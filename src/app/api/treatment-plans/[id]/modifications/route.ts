import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createPlanModificationSchema,
  planModificationQuerySchema,
  VERSION_CREATING_MODIFICATIONS,
  ACKNOWLEDGMENT_REQUIRED_MODIFICATIONS,
  CONSENT_REQUIRED_MODIFICATIONS,
} from '@/lib/validations/treatment';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/treatment-plans/[id]/modifications
 * List modifications for a treatment plan
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);

    // Parse query params
    const queryResult = planModificationQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

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

    const query = queryResult.data;

    // Verify treatment plan exists and belongs to clinic
    const treatmentPlan = await db.treatmentPlan.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!treatmentPlan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Treatment plan not found',
          },
        },
        { status: 404 }
      );
    }

    // Build filter
    const where: Record<string, unknown> = {
      treatmentPlanId: id,
      clinicId: session.user.clinicId,
    };

    if (query.modificationType) {
      where.modificationType = query.modificationType;
    }

    if (query.createsNewVersion !== undefined) {
      where.createsNewVersion = query.createsNewVersion;
    }

    if (query.requiresAcknowledgment !== undefined) {
      where.requiresAcknowledgment = query.requiresAcknowledgment;
    }

    if (query.pendingAcknowledgment) {
      where.requiresAcknowledgment = true;
      where.acknowledgedAt = null;
    }

    if (query.fromDate || query.toDate) {
      where.modificationDate = {};
      if (query.fromDate) {
        (where.modificationDate as Record<string, Date>).gte = query.fromDate;
      }
      if (query.toDate) {
        (where.modificationDate as Record<string, Date>).lte = query.toDate;
      }
    }

    // Get total count
    const total = await db.planModification.count({ where });

    // Get modifications
    const modifications = await db.planModification.findMany({
      where,
      include: {
        modifiedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        acknowledgedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: modifications,
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
 * POST /api/treatment-plans/[id]/modifications
 * Create a new plan modification (and optionally apply changes)
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createPlanModificationSchema.safeParse({ ...body, treatmentPlanId: id });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid modification data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Get treatment plan
    const treatmentPlan = await db.treatmentPlan.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!treatmentPlan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Treatment plan not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if plan can be modified
    if (['COMPLETED', 'DISCONTINUED', 'TRANSFERRED'].includes(treatmentPlan.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PLAN_LOCKED',
            message: `Cannot modify a ${treatmentPlan.status.toLowerCase()} treatment plan`,
          },
        },
        { status: 400 }
      );
    }

    // Get staff profile for modifiedBy
    const staffProfile = await db.staffProfile.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STAFF_NOT_FOUND',
            message: 'Staff profile not found for current user',
          },
        },
        { status: 400 }
      );
    }

    // Determine if this creates a new version
    const createsNewVersion = VERSION_CREATING_MODIFICATIONS.includes(
      data.modificationType as typeof VERSION_CREATING_MODIFICATIONS[number]
    );

    // Determine if acknowledgment is required
    const requiresAcknowledgment =
      data.forceAcknowledgment ||
      ACKNOWLEDGMENT_REQUIRED_MODIFICATIONS.includes(
        data.modificationType as typeof ACKNOWLEDGMENT_REQUIRED_MODIFICATIONS[number]
      );

    // Determine if new consent is required
    const requiresNewConsent = CONSENT_REQUIRED_MODIFICATIONS.includes(
      data.modificationType as typeof CONSENT_REQUIRED_MODIFICATIONS[number]
    );

    // Calculate fee change if applicable
    const previousFee = data.previousFee ?? treatmentPlan.totalFee;
    const newFee = data.newFee ?? data.planUpdates?.totalFee ?? previousFee;
    const feeChangeAmount = previousFee && newFee ? newFee - previousFee : null;

    // Create snapshot of current state before modification
    const previousStateSnapshot = {
      version: treatmentPlan.version,
      planType: treatmentPlan.planType,
      treatmentDescription: treatmentPlan.treatmentDescription,
      treatmentGoals: treatmentPlan.treatmentGoals,
      primaryProviderId: treatmentPlan.primaryProviderId,
      supervisingProviderId: treatmentPlan.supervisingProviderId,
      estimatedDuration: treatmentPlan.estimatedDuration,
      estimatedVisits: treatmentPlan.estimatedVisits,
      totalFee: treatmentPlan.totalFee,
      estimatedEndDate: treatmentPlan.estimatedEndDate,
    };

    // Calculate new version number
    const previousVersion = treatmentPlan.version;
    const newVersion = createsNewVersion ? previousVersion + 1 : previousVersion;

    // Use transaction to create modification and update plan atomically
    const [modification, updatedPlan] = await db.$transaction(async (tx) => {
      // Create the modification record
      const mod = await tx.planModification.create({
        data: {
          clinicId: session.user.clinicId,
          treatmentPlanId: id,
          modificationType: data.modificationType,
          modifiedById: staffProfile.id,
          previousVersion,
          newVersion,
          createsNewVersion,
          changeDescription: data.changeDescription,
          reason: data.reason,
          changedFields: (data.changedFields || null) as Prisma.InputJsonValue,
          previousFee,
          newFee,
          feeChangeAmount,
          requiresAcknowledgment,
          requiresNewConsent,
          previousStateSnapshot: previousStateSnapshot as Prisma.InputJsonValue,
        },
        include: {
          modifiedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              title: true,
            },
          },
        },
      });

      // Update the treatment plan if there are plan updates
      let plan = treatmentPlan;
      if (data.planUpdates || createsNewVersion) {
        plan = await tx.treatmentPlan.update({
          where: { id },
          data: {
            ...data.planUpdates,
            version: newVersion,
            updatedBy: session.user.id,
          },
        });
      }

      return [mod, plan];
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'PlanModification',
      entityId: modification.id,
      details: {
        treatmentPlanId: id,
        planNumber: treatmentPlan.planNumber,
        modificationType: data.modificationType,
        previousVersion,
        newVersion,
        createsNewVersion,
        requiresAcknowledgment,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        modification,
        treatmentPlan: updatedPlan,
      },
    });
  },
  { permissions: ['treatment:update'] }
);
