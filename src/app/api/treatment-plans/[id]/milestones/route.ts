import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createTreatmentMilestoneSchema,
  updateTreatmentMilestoneSchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/treatment-plans/[id]/milestones
 * List milestones for a treatment plan
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: treatmentPlanId } = await context.params;

    // Verify treatment plan exists and belongs to clinic
    const treatmentPlan = await db.treatmentPlan.findFirst({
      where: withSoftDelete({
        id: treatmentPlanId,
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

    const milestones = await db.treatmentMilestone.findMany({
      where: {
        treatmentPlanId,
        deletedAt: null,
      },
      orderBy: [{ targetDate: 'asc' }, { createdAt: 'asc' }],
      include: {
        phase: {
          select: {
            id: true,
            phaseName: true,
            phaseNumber: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: milestones });
  },
  { permissions: ['treatment:read'] }
);

/**
 * POST /api/treatment-plans/[id]/milestones
 * Add a new milestone to a treatment plan
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: treatmentPlanId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createTreatmentMilestoneSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid milestone data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify treatment plan exists and belongs to clinic
    const treatmentPlan = await db.treatmentPlan.findFirst({
      where: withSoftDelete({
        id: treatmentPlanId,
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

    // Check if plan can be modified
    if (['COMPLETED', 'DISCONTINUED', 'TRANSFERRED'].includes(treatmentPlan.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PLAN_LOCKED',
            message: `Cannot add milestones to a ${treatmentPlan.status.toLowerCase()} treatment plan`,
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify phase exists if provided
    if (body.phaseId) {
      const phase = await db.treatmentPhase.findFirst({
        where: {
          id: body.phaseId,
          treatmentPlanId,
          deletedAt: null,
        },
      });

      if (!phase) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PHASE_NOT_FOUND',
              message: 'Treatment phase not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Create the milestone
    const milestone = await db.treatmentMilestone.create({
      data: {
        clinicId: session.user.clinicId,
        treatmentPlanId,
        phaseId: body.phaseId ?? null,
        milestoneName: data.milestoneName,
        milestoneType: data.milestoneType,
        description: data.description,
        targetDate: data.targetDate,
        completionCriteria: data.completionCriteria,
        notes: data.notes,
        visibleToPatient: data.visibleToPatient,
        patientDescription: data.patientDescription,
        status: data.status,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'TreatmentMilestone',
      entityId: milestone.id,
      details: {
        treatmentPlanId,
        milestoneName: milestone.milestoneName,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: milestone }, { status: 201 });
  },
  { permissions: ['treatment:update'] }
);
