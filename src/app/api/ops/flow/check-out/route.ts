import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { checkOutSchema } from '@/lib/validations/ops';

/**
 * POST /api/ops/flow/check-out
 * Check out a patient after treatment
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = checkOutSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid check-out data',
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

    // Check valid stage transition
    if (flowState.stage !== 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STAGE',
            message: `Cannot check out patient from stage: ${flowState.stage}`,
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
          stage: 'CHECKED_OUT',
          checkedOutAt: now,
          ...(notes && { notes: flowState.notes ? `${flowState.notes}\n${notes}` : notes }),
          updatedBy: session.user.id,
        },
      });

      // Add stage history
      await tx.flowStageHistory.create({
        data: {
          flowStateId: flow.id,
          stage: 'CHECKED_OUT',
          enteredAt: now,
          triggeredBy: session.user.id,
          notes,
        },
      });

      // Update previous stage history with exit time
      await tx.flowStageHistory.updateMany({
        where: {
          flowStateId: flow.id,
          stage: 'COMPLETED',
          exitedAt: null,
        },
        data: {
          exitedAt: now,
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
        action: 'CHECK_OUT',
        appointmentId,
        previousStage: 'COMPLETED',
        newStage: 'CHECKED_OUT',
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
