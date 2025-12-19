import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createTreatmentOptionSchema, treatmentOptionQuerySchema } from '@/lib/validations/treatment';

/**
 * GET /api/treatment-plans/[id]/options
 * Get all treatment options for a plan
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: treatmentPlanId } = await context.params;
    const { searchParams } = new URL(req.url);

    // Parse query params
    const query = treatmentOptionQuerySchema.parse({
      treatmentPlanId,
      status: searchParams.get('status'),
      applianceSystem: searchParams.get('applianceSystem'),
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    // Verify plan exists and belongs to clinic
    const plan = await db.treatmentPlan.findFirst({
      where: {
        id: treatmentPlanId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TREATMENT_PLAN_NOT_FOUND',
            message: 'Treatment plan not found',
          },
        },
        { status: 404 }
      );
    }

    // Build filters
    const where = {
      treatmentPlanId,
      ...getClinicFilter(session),
      deletedAt: null,
      ...(query.status && { status: query.status }),
      ...(query.applianceSystem && { applianceSystem: query.applianceSystem }),
    };

    // Get total count
    const total = await db.treatmentOption.count({ where });

    // Get options
    const options = await db.treatmentOption.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: options,
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
      },
    });
  },
  { permissions: ['treatment:read'] }
);

/**
 * POST /api/treatment-plans/[id]/options
 * Create a new treatment option for a plan
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: treatmentPlanId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createTreatmentOptionSchema.safeParse({
      ...body,
      treatmentPlanId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid treatment option data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify plan exists and belongs to clinic
    const plan = await db.treatmentPlan.findFirst({
      where: {
        id: treatmentPlanId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TREATMENT_PLAN_NOT_FOUND',
            message: 'Treatment plan not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // If this is marked as recommended, unmark others
    if (data.isRecommended) {
      await db.treatmentOption.updateMany({
        where: {
          treatmentPlanId,
          ...getClinicFilter(session),
          deletedAt: null,
        },
        data: { isRecommended: false },
      });
    }

    // Create the option
    const option = await db.treatmentOption.create({
      data: {
        clinicId: session.user.clinicId,
        treatmentPlanId,
        optionNumber: data.optionNumber,
        optionName: data.optionName,
        description: data.description,
        applianceSystem: data.applianceSystem,
        applianceDetails: data.applianceDetails,
        estimatedDuration: data.estimatedDuration,
        estimatedVisits: data.estimatedVisits,
        estimatedCost: data.estimatedCost,
        isRecommended: data.isRecommended,
        recommendationNotes: data.recommendationNotes,
        advantages: data.advantages,
        disadvantages: data.disadvantages,
        status: data.status,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'TreatmentOption',
      entityId: option.id,
      details: {
        treatmentPlanId,
        optionName: option.optionName,
        applianceSystem: option.applianceSystem,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: option }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
