import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { seatPatientSchema } from '@/lib/validations/ops';

/**
 * POST /api/ops/flow/seat
 * Seat a patient in a treatment chair
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = seatPatientSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid seat data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { appointmentId, chairId, notes } = result.data;
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
            message: 'Patient flow state not found. Patient may not be checked in.',
          },
        },
        { status: 404 }
      );
    }

    // Check valid stage transition
    if (!['CHECKED_IN', 'WAITING', 'CALLED'].includes(flowState.stage)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STAGE',
            message: `Cannot seat patient from stage: ${flowState.stage}`,
          },
        },
        { status: 400 }
      );
    }

    // Verify chair exists
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

    // Check chair availability (not occupied by another appointment)
    const existingOccupancy = await db.resourceOccupancy.findFirst({
      where: {
        chairId,
        status: { in: ['OCCUPIED', 'BLOCKED', 'MAINTENANCE'] },
      },
    });

    if (existingOccupancy && existingOccupancy.appointmentId !== appointmentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CHAIR_UNAVAILABLE',
            message: 'Chair is currently occupied or unavailable',
          },
        },
        { status: 400 }
      );
    }

    const now = new Date();

    // Update flow state and chair occupancy in transaction
    const updatedFlowState = await db.$transaction(async (tx) => {
      // Update flow state
      const flow = await tx.patientFlowState.update({
        where: { id: flowState.id },
        data: {
          stage: 'IN_CHAIR',
          chairId,
          seatedAt: now,
          currentWaitStartedAt: null,
          ...(notes && { notes: flowState.notes ? `${flowState.notes}\n${notes}` : notes }),
          updatedBy: session.user.id,
        },
      });

      // Add stage history
      await tx.flowStageHistory.create({
        data: {
          flowStateId: flow.id,
          stage: 'IN_CHAIR',
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
        },
      });

      // Update appointment status
      await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'IN_PROGRESS',
          startedAt: now,
          chairId,
        },
      });

      // Update chair occupancy with initial SETUP sub-stage
      await tx.resourceOccupancy.upsert({
        where: {
          clinicId_chairId: {
            clinicId,
            chairId,
          },
        },
        create: {
          clinicId,
          chairId,
          status: 'OCCUPIED',
          appointmentId,
          patientId: flowState.patientId,
          occupiedAt: now,
          expectedFreeAt: new Date(now.getTime() + (flowState.appointment?.duration || 30) * 60000),
          // Initialize chair activity tracking
          activitySubStage: 'SETUP',
          subStageStartedAt: now,
          // assignedStaffId will be set when staff explicitly assigns themselves
          procedureNotes: null,
        },
        update: {
          status: 'OCCUPIED',
          appointmentId,
          patientId: flowState.patientId,
          occupiedAt: now,
          expectedFreeAt: new Date(now.getTime() + (flowState.appointment?.duration || 30) * 60000),
          blockReason: null,
          blockedBy: null,
          blockedUntil: null,
          // Reset chair activity tracking for new patient
          activitySubStage: 'SETUP',
          subStageStartedAt: now,
          assignedStaffId: null,
          procedureNotes: null,
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
        action: 'SEAT',
        appointmentId,
        chairId,
        previousStage: flowState.stage,
        newStage: 'IN_CHAIR',
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
