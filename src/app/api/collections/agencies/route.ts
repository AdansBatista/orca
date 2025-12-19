import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createCollectionAgencySchema,
  collectionAgencyQuerySchema,
} from '@/lib/validations/collections';

/**
 * GET /api/collections/agencies
 * List collection agencies
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = collectionAgencyQuerySchema.safeParse(rawParams);

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
      isActive,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (isActive !== undefined) where.isActive = isActive;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.collectionAgency.count({ where });

    // Get paginated results
    const agencies = await db.collectionAgency.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            referrals: true,
          },
        },
      },
    });

    // Get aggregate stats per agency
    const agencyStats = await Promise.all(
      agencies.map(async agency => {
        const stats = await db.agencyReferral.aggregate({
          where: {
            agencyId: agency.id,
            clinicId: session.user.clinicId,
          },
          _sum: {
            referredBalance: true,
            collectedAmount: true,
            agencyFees: true,
            netRecovered: true,
          },
          _count: true,
        });

        return {
          ...agency,
          stats: {
            totalReferred: stats._sum.referredBalance || 0,
            totalCollected: stats._sum.collectedAmount || 0,
            totalFees: stats._sum.agencyFees || 0,
            netRecovered: stats._sum.netRecovered || 0,
            referralCount: stats._count,
            collectionRate: stats._sum.referredBalance
              ? ((stats._sum.collectedAmount || 0) / stats._sum.referredBalance) * 100
              : 0,
          },
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        items: agencyStats,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['collections:read'] }
);

/**
 * POST /api/collections/agencies
 * Create a new collection agency
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const result = createCollectionAgencySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid agency data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    const agency = await db.collectionAgency.create({
      data: {
        clinicId: session.user.clinicId,
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        street: data.street,
        city: data.city,
        state: data.state,
        zip: data.zip,
        exportFormat: data.exportFormat,
        feePercentage: data.feePercentage,
        minBalance: data.minBalance,
        minDays: data.minDays,
        isActive: data.isActive,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'CollectionAgency',
      entityId: agency.id,
      details: { name: agency.name },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: agency },
      { status: 201 }
    );
  },
  { permissions: ['collections:manage'] }
);
