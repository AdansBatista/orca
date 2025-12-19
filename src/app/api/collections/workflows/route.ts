import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createCollectionWorkflowSchema,
  collectionWorkflowQuerySchema,
} from '@/lib/validations/collections';

/**
 * GET /api/collections/workflows
 * List collection workflows
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      patientType: searchParams.get('patientType') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = collectionWorkflowQuerySchema.safeParse(rawParams);

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
      patientType,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (isActive !== undefined) where.isActive = isActive;
    if (patientType) where.patientType = patientType;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.collectionWorkflow.count({ where });

    // Get paginated results
    const workflows = await db.collectionWorkflow.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        stages: {
          orderBy: { stageNumber: 'asc' },
        },
        _count: {
          select: {
            accounts: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: workflows,
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
 * POST /api/collections/workflows
 * Create a new collection workflow
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const result = createCollectionWorkflowSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid workflow data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db.collectionWorkflow.updateMany({
        where: withSoftDelete({
          clinicId: session.user.clinicId,
          isDefault: true,
        }),
        data: { isDefault: false },
      });
    }

    // Create workflow with stages
    const workflow = await db.collectionWorkflow.create({
      data: {
        clinicId: session.user.clinicId,
        name: data.name,
        description: data.description,
        isActive: data.isActive,
        isDefault: data.isDefault,
        triggerDays: data.triggerDays,
        minBalance: data.minBalance,
        patientType: data.patientType,
        stages: {
          create: data.stages.map(stage => ({
            stageNumber: stage.stageNumber,
            name: stage.name,
            description: stage.description,
            daysFromPrevious: stage.daysFromPrevious,
            daysOverdue: stage.daysOverdue,
            escalateAfterDays: stage.escalateAfterDays,
            actions: stage.actions,
          })),
        },
      },
      include: {
        stages: {
          orderBy: { stageNumber: 'asc' },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'CollectionWorkflow',
      entityId: workflow.id,
      details: {
        name: workflow.name,
        stageCount: data.stages.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: workflow },
      { status: 201 }
    );
  },
  { permissions: ['collections:manage'] }
);
