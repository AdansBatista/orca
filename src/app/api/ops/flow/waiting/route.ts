import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { waitingSchema } from '@/lib/validations/ops';

/**
 * POST /api/ops/flow/waiting
 * Move a checked-in patient to the waiting room
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = waitingSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid waiting data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { appointmentId, notes } = result.data;

    // Find the flow state
    const flowState = await db.patientFlowState.findFirst({
      where: {
        appointmentId,
        ...getClinicFilter(session),
      },
      include: {
        appointment: true,
      },
    });

    if (!flowState) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Patient flow state not found. Patient may not be checked in.',
          },
        },
        { status: 404 }
      );
    }

    // Check valid stage transition - only from CHECKED_IN
    if (flowState.stage !== 'CHECKED_IN') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STAGE',
            message: `Cannot move patient to waiting from stage: ${flowState.stage}. Patient must be checked in.`,
          },
        },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update flow state
    const updatedFlowState = await db.$transaction(async (tx) => {
      // Update flow state
      const flow = await tx.patientFlowState.update({
        where: { id: flowState.id },
        data: {
          stage: 'WAITING',
          // Keep currentWaitStartedAt from check-in (wait time continues)
          ...(notes && { notes: flowState.notes ? `${flowState.notes}\n${notes}` : notes }),
          updatedBy: session.user.id,
        },
      });

      // Add stage history
      await tx.flowStageHistory.create({
        data: {
          flowStateId: flow.id,
          stage: 'WAITING',
          enteredAt: now,
          triggeredBy: session.user.id,
          notes,
        },
      });

      // Update previous stage history with exit time
      await tx.flowStageHistory.updateMany({
        where: {
          flowStateId: flow.id,
          stage: flowState.stage,
          exitedAt: null,
        },
        data: {
          exitedAt: now,
          duration: Math.floor((now.getTime() - (flowState.checkedInAt?.getTime() || now.getTime())) / 1000),
        },
      });

      return flow;
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PatientFlowState',
      entityId: updatedFlowState.id,
      details: {
        action: 'MOVE_TO_WAITING',
        appointmentId,
        previousStage: flowState.stage,
        newStage: 'WAITING',
      },
      ipAddress,
      userAgent,
    });

    // Fetch complete flow state with relations
    const completeFlowState = await db.patientFlowState.findUnique({
      where: { id: updatedFlowState.id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        provider: {
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
            chairNumber: true,
          },
        },
        appointment: {
          include: {
            appointmentType: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: completeFlowState,
    });
  },
  { permissions: ['ops:update'] }
);
