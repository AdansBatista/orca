import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { completeTreatmentPlanSchema } from '@/lib/validations/treatment';

/**
 * POST /api/treatment-plans/[id]/complete
 * Mark a treatment plan as completed
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = completeTreatmentPlanSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid completion data',
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

    // Check if plan can be completed (must be ACTIVE)
    if (treatmentPlan.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: `Cannot complete a plan with status ${treatmentPlan.status}. Plan must be in ACTIVE status.`,
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
        status: 'COMPLETED',
        actualEndDate: data.actualEndDate ?? new Date(),
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
        phases: {
          select: {
            id: true,
            phaseName: true,
            status: true,
          },
          orderBy: { phaseNumber: 'asc' },
        },
      },
    });

    // Optionally mark all phases as completed
    await db.treatmentPhase.updateMany({
      where: {
        treatmentPlanId: id,
        status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
        deletedAt: null,
      },
      data: {
        status: 'COMPLETED',
        actualEndDate: data.actualEndDate ?? new Date(),
      },
    });

    // Mark pending milestones as achieved
    await db.treatmentMilestone.updateMany({
      where: {
        treatmentPlanId: id,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        deletedAt: null,
      },
      data: {
        status: 'ACHIEVED',
        achievedDate: data.actualEndDate ?? new Date(),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'TreatmentPlan',
      entityId: id,
      details: {
        action: 'COMPLETE',
        previousStatus: treatmentPlan.status,
        newStatus: 'COMPLETED',
        actualEndDate: updatedPlan.actualEndDate,
        notes: data.notes,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: updatedPlan });
  },
  { permissions: ['treatment:update'] }
);
