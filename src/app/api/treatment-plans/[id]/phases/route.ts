import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createTreatmentPhaseSchema,
  updateTreatmentPhaseSchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/treatment-plans/[id]/phases
 * List phases for a treatment plan
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

    const phases = await db.treatmentPhase.findMany({
      where: {
        treatmentPlanId,
        deletedAt: null,
      },
      orderBy: { phaseNumber: 'asc' },
      include: {
        images: {
          select: {
            id: true,
            fileName: true,
            thumbnailUrl: true,
          },
          take: 5,
        },
      },
    });

    return NextResponse.json({ success: true, data: phases });
  },
  { permissions: ['treatment:read'] }
);

/**
 * POST /api/treatment-plans/[id]/phases
 * Add a new phase to a treatment plan
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: treatmentPlanId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createTreatmentPhaseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid phase data',
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
            message: `Cannot add phases to a ${treatmentPlan.status.toLowerCase()} treatment plan`,
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check if phase number already exists
    const existingPhase = await db.treatmentPhase.findFirst({
      where: {
        treatmentPlanId,
        phaseNumber: data.phaseNumber,
        deletedAt: null,
      },
    });

    if (existingPhase) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PHASE_NUMBER_EXISTS',
            message: `Phase number ${data.phaseNumber} already exists in this treatment plan`,
          },
        },
        { status: 400 }
      );
    }

    // Create the phase
    const phase = await db.treatmentPhase.create({
      data: {
        clinicId: session.user.clinicId,
        treatmentPlanId,
        phaseNumber: data.phaseNumber,
        phaseName: data.phaseName,
        phaseType: data.phaseType,
        description: data.description,
        objectives: data.objectives,
        plannedStartDate: data.plannedStartDate,
        plannedEndDate: data.plannedEndDate,
        estimatedVisits: data.estimatedVisits,
        notes: data.notes,
        status: data.status,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'TreatmentPhase',
      entityId: phase.id,
      details: {
        treatmentPlanId,
        phaseName: phase.phaseName,
        phaseNumber: phase.phaseNumber,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: phase }, { status: 201 });
  },
  { permissions: ['treatment:update'] }
);

/**
 * PUT /api/treatment-plans/[id]/phases
 * Bulk update phases (for reordering)
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: treatmentPlanId } = await context.params;
    const body = await req.json();

    // Verify treatment plan exists
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

    // Expect array of { id, phaseNumber } for reordering
    if (!Array.isArray(body.phases)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Expected phases array',
          },
        },
        { status: 400 }
      );
    }

    // Update each phase's order
    const updates = body.phases.map(
      (phase: { id: string; phaseNumber: number }, index: number) =>
        db.treatmentPhase.update({
          where: { id: phase.id },
          data: { phaseNumber: phase.phaseNumber ?? index + 1 },
        })
    );

    await Promise.all(updates);

    // Return updated phases
    const phases = await db.treatmentPhase.findMany({
      where: { treatmentPlanId, deletedAt: null },
      orderBy: { phaseNumber: 'asc' },
    });

    return NextResponse.json({ success: true, data: phases });
  },
  { permissions: ['treatment:update'] }
);
