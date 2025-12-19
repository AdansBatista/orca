import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { acknowledgePlanModificationSchema } from '@/lib/validations/treatment';

/**
 * POST /api/treatment-plans/[id]/modifications/[modificationId]/acknowledge
 * Record patient acknowledgment of a plan modification
 */
export const POST = withAuth<{ id: string; modificationId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id, modificationId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = acknowledgePlanModificationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid acknowledgment data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify treatment plan exists
    const treatmentPlan = await db.treatmentPlan.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
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

    // Get modification
    const modification = await db.planModification.findFirst({
      where: {
        id: modificationId,
        treatmentPlanId: id,
        clinicId: session.user.clinicId,
      },
    });

    if (!modification) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Plan modification not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if already acknowledged
    if (modification.acknowledgedAt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_ACKNOWLEDGED',
            message: 'This modification has already been acknowledged',
          },
        },
        { status: 400 }
      );
    }

    // Check if acknowledgment is required
    if (!modification.requiresAcknowledgment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_REQUIRED',
            message: 'This modification does not require acknowledgment',
          },
        },
        { status: 400 }
      );
    }

    // Update modification with acknowledgment
    const updatedModification = await db.planModification.update({
      where: { id: modificationId },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedById: treatmentPlan.patient.id,
        acknowledgmentMethod: data.acknowledgmentMethod,
        acknowledgmentNotes: data.acknowledgmentNotes,
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
        acknowledgedBy: {
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
      entity: 'PlanModification',
      entityId: modificationId,
      details: {
        treatmentPlanId: id,
        action: 'acknowledge',
        acknowledgmentMethod: data.acknowledgmentMethod,
        patientId: treatmentPlan.patient.id,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: updatedModification });
  },
  { permissions: ['treatment:update'] }
);
