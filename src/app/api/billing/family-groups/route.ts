import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createFamilyGroupSchema,
  familyGroupQuerySchema,
} from '@/lib/validations/billing';

/**
 * GET /api/billing/family-groups
 * List family groups with pagination and filters
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = familyGroupQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      search,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    // Search
    if (search) {
      where.OR = [
        { groupName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.familyGroup.count({ where });

    // Get paginated results
    const groups = await db.familyGroup.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        accounts: {
          where: { deletedAt: null },
          select: {
            id: true,
            accountNumber: true,
            currentBalance: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            accounts: { where: { deletedAt: null } },
          },
        },
      },
    });

    // Calculate combined balances and get guarantor info for each group
    const groupsWithBalances = await Promise.all(
      groups.map(async (group) => {
        // Get guarantor patient info
        const guarantor = await db.patient.findUnique({
          where: { id: group.primaryGuarantorId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        });

        return {
          ...group,
          primaryGuarantor: guarantor,
          combinedBalance: group.accounts.reduce((sum, acc) => sum + acc.currentBalance, 0),
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        items: groupsWithBalances,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['billing:read'] }
);

/**
 * POST /api/billing/family-groups
 * Create a new family group
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createFamilyGroupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid family group data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify primary guarantor patient exists
    const guarantor = await db.patient.findFirst({
      where: withSoftDelete({
        id: data.primaryGuarantorId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!guarantor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'GUARANTOR_NOT_FOUND',
            message: 'Primary guarantor patient not found',
          },
        },
        { status: 400 }
      );
    }

    // Create family group
    const group = await db.familyGroup.create({
      data: {
        clinicId: session.user.clinicId,
        groupName: data.groupName,
        primaryGuarantorId: data.primaryGuarantorId,
        consolidateStatements: data.consolidateStatements,
        createdBy: session.user.id,
      },
      include: {
        accounts: {
          where: { deletedAt: null },
          select: {
            id: true,
            accountNumber: true,
            currentBalance: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'FamilyGroup',
      entityId: group.id,
      details: {
        groupName: group.groupName,
        primaryGuarantorId: group.primaryGuarantorId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: { ...group, primaryGuarantor: guarantor } },
      { status: 201 }
    );
  },
  { permissions: ['billing:create'] }
);
