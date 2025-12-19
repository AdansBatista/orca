import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { checkInSchema } from '@/lib/validations/ops';

/**
 * POST /api/ops/flow/check-in
 * Check in a patient (creates or updates flow state)
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = checkInSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid check-in data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { appointmentId, notes } = result.data;
    const clinicId = session.user.clinicId;

    // Find the appointment with standardized soft delete
    const appointment = await db.appointment.findFirst({
      where: withSoftDelete({
        id: appointmentId,
        ...getClinicFilter(session),
      }),
      include: {
        patient: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Appointment not found',
          },
        },
        { status: 404 }
      );
    }

    // Check valid status for check-in
    if (!['SCHEDULED', 'CONFIRMED'].includes(appointment.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot check in an appointment with status: ${appointment.status}`,
          },
        },
        { status: 400 }
      );
    }

    const now = new Date();

    // Use a transaction to update both appointment and flow state
    const [updatedAppointment, flowState] = await db.$transaction(async (tx) => {
      // Update appointment status (AppointmentStatus uses ARRIVED, not CHECKED_IN)
      const apt = await tx.appointment.update({
        where: { id: appointmentId },
        data: {
          status: 'ARRIVED',
          arrivedAt: now,
          checkedInBy: session.user.id,
        },
      });

      // Create or update flow state
      const existingFlow = await tx.patientFlowState.findFirst({
        where: { appointmentId },
      });

      let flow;
      if (existingFlow) {
        flow = await tx.patientFlowState.update({
          where: { id: existingFlow.id },
          data: {
            stage: 'CHECKED_IN',
            checkedInAt: now,
            currentWaitStartedAt: now,
            notes: notes || existingFlow.notes,
            updatedBy: session.user.id,
          },
        });

        // Add stage history
        await tx.flowStageHistory.create({
          data: {
            flowStateId: flow.id,
            stage: 'CHECKED_IN',
            enteredAt: now,
            triggeredBy: session.user.id,
            notes,
          },
        });
      } else {
        // Create new flow state
        flow = await tx.patientFlowState.create({
          data: {
            clinicId,
            appointmentId,
            patientId: appointment.patientId,
            stage: 'CHECKED_IN',
            providerId: appointment.providerId,
            chairId: appointment.chairId,
            scheduledAt: appointment.startTime,
            checkedInAt: now,
            currentWaitStartedAt: now,
            notes,
            createdBy: session.user.id,
          },
        });

        // Add stage history
        await tx.flowStageHistory.create({
          data: {
            flowStateId: flow.id,
            stage: 'CHECKED_IN',
            enteredAt: now,
            triggeredBy: session.user.id,
            notes,
          },
        });
      }

      return [apt, flow];
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PatientFlowState',
      entityId: flowState.id,
      details: {
        action: 'CHECK_IN',
        appointmentId,
        patientId: appointment.patientId,
        stage: 'CHECKED_IN',
      },
      ipAddress,
      userAgent,
    });

    // Fetch complete flow state with relations
    const completeFlowState = await db.patientFlowState.findUnique({
      where: { id: flowState.id },
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
      data: {
        flowState: completeFlowState,
        appointment: updatedAppointment,
      },
    });
  },
  { permissions: ['ops:update'] }
);
