import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { acceptTreatmentPlanSchema } from '@/lib/validations/treatment';

/**
 * POST /api/treatment-plans/[id]/accept
 * Mark a treatment plan as accepted by the patient
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = acceptTreatmentPlanSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid accept data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

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
            code: 'TREATMENT_PLAN_NOT_FOUND',
            message: 'Treatment plan not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if plan can be accepted (must be PRESENTED)
    if (treatmentPlan.status !== 'PRESENTED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: `Cannot accept a plan with status ${treatmentPlan.status}. Plan must be in PRESENTED status.`,
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Update the treatment plan
    const updatedPlan = await db.treatmentPlan.update({
      where: { id },
      data: {
        status: 'ACCEPTED',
        acceptedDate: data.acceptedDate ?? new Date(),
        updatedBy: session.user.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        primaryProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'TreatmentPlan',
      entityId: id,
      details: {
        action: 'ACCEPT',
        previousStatus: treatmentPlan.status,
        newStatus: 'ACCEPTED',
        acceptedDate: updatedPlan.acceptedDate,
        notes: data.notes,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: updatedPlan });
  },
  { permissions: ['treatment:update'] }
);
