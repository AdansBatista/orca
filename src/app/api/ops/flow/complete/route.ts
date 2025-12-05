import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { completePatientSchema } from '@/lib/validations/ops';

/**
 * POST /api/ops/flow/complete
 * Mark treatment as complete
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = completePatientSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid complete data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { appointmentId, notes } = result.data;
    const clinicId = session.user.clinicId;

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
            message: 'Patient flow state not found',
          },
        },
        { status: 404 }
      );
    }

    // Check valid stage transition
    if (flowState.stage !== 'IN_CHAIR') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STAGE',
            message: `Cannot complete treatment from stage: ${flowState.stage}`,
          },
        },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update flow state and release chair in transaction
    const updatedFlowState = await db.$transaction(async (tx) => {
      // Update flow state
      const flow = await tx.patientFlowState.update({
        where: { id: flowState.id },
        data: {
          stage: 'COMPLETED',
          completedAt: now,
          ...(notes && { notes: flowState.notes ? `${flowState.notes}\n${notes}` : notes }),
          updatedBy: session.user.id,
        },
      });

      // Add stage history
      await tx.flowStageHistory.create({
        data: {
          flowStateId: flow.id,
          stage: 'COMPLETED',
          enteredAt: now,
          triggeredBy: session.user.id,
          notes,
        },
      });

      // Update previous stage history with exit time
      await tx.flowStageHistory.updateMany({
        where: {
          flowStateId: flow.id,
          stage: 'IN_CHAIR',
          exitedAt: null,
        },
        data: {
          exitedAt: now,
          duration: Math.floor((now.getTime() - (flowState.seatedAt?.getTime() || now.getTime())) / 1000),
        },
      });

      // Update appointment status
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'COMPLETED',
          completedAt: now,
        },
      });

      // Release chair occupancy and clear sub-stage tracking
      if (flowState.chairId) {
        await tx.resourceOccupancy.updateMany({
          where: {
            clinicId,
            chairId: flowState.chairId,
            appointmentId,
          },
          data: {
            status: 'AVAILABLE',
            appointmentId: null,
            patientId: null,
            occupiedAt: null,
            expectedFreeAt: null,
            // Clear sub-stage tracking
            activitySubStage: null,
            subStageStartedAt: null,
            assignedStaffId: null,
            procedureNotes: null,
          },
        });
      }

      return flow;
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PatientFlowState',
      entityId: updatedFlowState.id,
      details: {
        action: 'COMPLETE',
        appointmentId,
        previousStage: 'IN_CHAIR',
        newStage: 'COMPLETED',
        chairId: flowState.chairId,
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
