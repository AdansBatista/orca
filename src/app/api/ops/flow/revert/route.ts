import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

/**
 * Valid backward transitions for reverting patient flow
 */
const VALID_REVERSIONS: Record<string, string[]> = {
  IN_CHAIR: ['CALLED', 'WAITING'],
  CALLED: ['WAITING', 'CHECKED_IN'],
  WAITING: ['CHECKED_IN'],
  COMPLETED: ['IN_CHAIR'],
  CHECKED_OUT: ['COMPLETED'],
};

const revertSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  toStage: z.enum([
    'CHECKED_IN',
    'WAITING',
    'CALLED',
    'IN_CHAIR',
    'COMPLETED',
  ]),
  notes: z.string().optional(),
});

/**
 * POST /api/ops/flow/revert
 * Revert a patient to a previous flow stage (backward transition)
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = revertSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid revert data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { appointmentId, toStage, notes } = result.data;
    const clinicId = session.user.clinicId;

    // Find the patient flow state
    const flowState = await db.patientFlowState.findFirst({
      where: {
        ...getClinicFilter(session),
        appointmentId,
      },
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

    if (!flowState) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Patient flow state not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate the transition
    const allowedStages = VALID_REVERSIONS[flowState.stage];
    if (!allowedStages || !allowedStages.includes(toStage)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_TRANSITION',
            message: `Cannot revert from ${flowState.stage} to ${toStage}`,
          },
        },
        { status: 400 }
      );
    }

    // If reverting from IN_CHAIR, free the chair
    const chairToFree = flowState.stage === 'IN_CHAIR' ? flowState.chairId : null;

    // Build update data
    const updateData: Record<string, unknown> = {
      stage: toStage,
      updatedBy: session.user.id,
    };

    // Clear timestamps for stages we're moving back from
    if (['IN_CHAIR', 'CALLED', 'WAITING'].includes(flowState.stage)) {
      updateData.seatedAt = null;
    }
    if (['CALLED', 'WAITING'].includes(flowState.stage)) {
      updateData.calledAt = null;
    }
    if (flowState.stage === 'COMPLETED') {
      updateData.completedAt = null;
    }
    if (flowState.stage === 'CHECKED_OUT') {
      updateData.checkedOutAt = null;
    }

    // Clear chair assignment if reverting from IN_CHAIR
    if (flowState.stage === 'IN_CHAIR') {
      updateData.chairId = null;
    }

    // Update wait time tracking
    updateData.currentWaitStartedAt = new Date();

    // Add notes if provided
    if (notes) {
      updateData.notes = notes;
    }

    // Update the flow state
    const updatedState = await db.patientFlowState.update({
      where: { id: flowState.id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        chair: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Free the chair if needed
    if (chairToFree) {
      await db.resourceOccupancy.deleteMany({
        where: {
          clinicId,
          chairId: chairToFree,
          appointmentId,
        },
      });
    }

    // Record in stage history
    await db.flowStageHistory.create({
      data: {
        flowStateId: flowState.id,
        stage: toStage,
        triggeredBy: session.user.id,
        notes: notes || `Reverted from ${flowState.stage}`,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PatientFlowState',
      entityId: flowState.id,
      details: {
        fromStage: flowState.stage,
        toStage,
        action: 'revert',
        patientName: `${flowState.patient.firstName} ${flowState.patient.lastName}`,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedState,
    });
  },
  { permissions: ['ops:update'] }
);
