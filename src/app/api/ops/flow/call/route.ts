import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { callPatientSchema } from '@/lib/validations/ops';

/**
 * POST /api/ops/flow/call
 * Call a patient to the treatment area
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = callPatientSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid call data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { appointmentId, chairId, notes } = result.data;

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

    // Check valid stage transition
    if (!['CHECKED_IN', 'WAITING'].includes(flowState.stage)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STAGE',
            message: `Cannot call patient from stage: ${flowState.stage}`,
          },
        },
        { status: 400 }
      );
    }

    // If chairId provided, verify it exists and is available
    if (chairId) {
      const chair = await db.treatmentChair.findFirst({
        where: {
          id: chairId,
          room: {
            ...getClinicFilter(session),
          },
        },
      });

      if (!chair) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_CHAIR',
              message: 'Chair not found',
            },
          },
          { status: 400 }
        );
      }

      // Check chair occupancy
      const occupancy = await db.resourceOccupancy.findFirst({
        where: {
          chairId,
          status: { in: ['OCCUPIED', 'BLOCKED', 'MAINTENANCE'] },
        },
      });

      if (occupancy && occupancy.appointmentId !== appointmentId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CHAIR_UNAVAILABLE',
              message: 'Chair is not available',
            },
          },
          { status: 400 }
        );
      }
    }

    const now = new Date();

    // Update flow state
    const updatedFlowState = await db.$transaction(async (tx) => {
      // Update flow state
      const flow = await tx.patientFlowState.update({
        where: { id: flowState.id },
        data: {
          stage: 'CALLED',
          calledAt: now,
          currentWaitStartedAt: null, // Clear wait timer
          ...(chairId && { chairId }),
          ...(notes && { notes: flowState.notes ? `${flowState.notes}\n${notes}` : notes }),
          updatedBy: session.user.id,
        },
      });

      // Add stage history
      await tx.flowStageHistory.create({
        data: {
          flowStateId: flow.id,
          stage: 'CALLED',
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
        action: 'CALL',
        appointmentId,
        previousStage: flowState.stage,
        newStage: 'CALLED',
        chairId: chairId || flowState.chairId,
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
