import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateTreatmentOptionSchema, selectTreatmentOptionSchema } from '@/lib/validations/treatment';

/**
 * GET /api/treatment-plans/[id]/options/[optionId]
 * Get a single treatment option
 */
export const GET = withAuth<{ id: string; optionId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: treatmentPlanId, optionId } = await context.params;

    const option = await db.treatmentOption.findFirst({
      where: {
        id: optionId,
        treatmentPlanId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      include: {
        treatmentPlan: {
          select: {
            id: true,
            planName: true,
            status: true,
          },
        },
      },
    });

    if (!option) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TREATMENT_OPTION_NOT_FOUND',
            message: 'Treatment option not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: option });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/treatment-plans/[id]/options/[optionId]
 * Update a treatment option
 */
export const PUT = withAuth<{ id: string; optionId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: treatmentPlanId, optionId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateTreatmentOptionSchema.safeParse(body);
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

    // Verify option exists
    const existingOption = await db.treatmentOption.findFirst({
      where: {
        id: optionId,
        treatmentPlanId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existingOption) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TREATMENT_OPTION_NOT_FOUND',
            message: 'Treatment option not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // If this is being marked as recommended, unmark others
    if (data.isRecommended) {
      await db.treatmentOption.updateMany({
        where: {
          treatmentPlanId,
          ...getClinicFilter(session),
          deletedAt: null,
          id: { not: optionId },
        },
        data: { isRecommended: false },
      });
    }

    // Update the option
    const option = await db.treatmentOption.update({
      where: { id: optionId },
      data: {
        ...(data.optionNumber !== undefined && { optionNumber: data.optionNumber }),
        ...(data.optionName !== undefined && { optionName: data.optionName }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.applianceSystem !== undefined && { applianceSystem: data.applianceSystem }),
        ...(data.applianceDetails !== undefined && { applianceDetails: data.applianceDetails }),
        ...(data.estimatedDuration !== undefined && { estimatedDuration: data.estimatedDuration }),
        ...(data.estimatedVisits !== undefined && { estimatedVisits: data.estimatedVisits }),
        ...(data.estimatedCost !== undefined && { estimatedCost: data.estimatedCost }),
        ...(data.isRecommended !== undefined && { isRecommended: data.isRecommended }),
        ...(data.recommendationNotes !== undefined && { recommendationNotes: data.recommendationNotes }),
        ...(data.advantages !== undefined && { advantages: data.advantages }),
        ...(data.disadvantages !== undefined && { disadvantages: data.disadvantages }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'TreatmentOption',
      entityId: optionId,
      details: {
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: option });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/treatment-plans/[id]/options/[optionId]
 * Soft delete a treatment option
 */
export const DELETE = withAuth<{ id: string; optionId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: treatmentPlanId, optionId } = await context.params;

    // Verify option exists
    const existingOption = await db.treatmentOption.findFirst({
      where: {
        id: optionId,
        treatmentPlanId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      include: {
        _count: {
          select: { caseAcceptances: true },
        },
      },
    });

    if (!existingOption) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TREATMENT_OPTION_NOT_FOUND',
            message: 'Treatment option not found',
          },
        },
        { status: 404 }
      );
    }

    // Prevent deletion if option has been selected in an acceptance
    if (existingOption._count.caseAcceptances > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_DEPENDENCIES',
            message: 'Cannot delete option that has been selected in a case acceptance',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete
    await db.treatmentOption.update({
      where: { id: optionId },
      data: { deletedAt: new Date() },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'TreatmentOption',
      entityId: optionId,
      details: {
        optionName: existingOption.optionName,
        treatmentPlanId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['treatment:delete'] }
);

/**
 * POST /api/treatment-plans/[id]/options/[optionId]/select
 * Mark this option as selected by patient
 */
export const PATCH = withAuth<{ id: string; optionId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: treatmentPlanId, optionId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = selectTreatmentOptionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid selection data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify option exists
    const existingOption = await db.treatmentOption.findFirst({
      where: {
        id: optionId,
        treatmentPlanId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existingOption) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TREATMENT_OPTION_NOT_FOUND',
            message: 'Treatment option not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Mark all other options as declined
    await db.treatmentOption.updateMany({
      where: {
        treatmentPlanId,
        ...getClinicFilter(session),
        deletedAt: null,
        id: { not: optionId },
        status: { not: 'ARCHIVED' },
      },
      data: { status: 'DECLINED' },
    });

    // Mark this option as selected
    const option = await db.treatmentOption.update({
      where: { id: optionId },
      data: {
        status: 'SELECTED',
        selectedDate: data.selectedDate || new Date(),
        selectionNotes: data.selectionNotes,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'TreatmentOption',
      entityId: optionId,
      details: {
        action: 'SELECTED',
        optionName: option.optionName,
        treatmentPlanId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: option });
  },
  { permissions: ['treatment:update'] }
);
