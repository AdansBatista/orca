import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { checkInAppointmentSchema } from '@/lib/validations/booking';

/**
 * POST /api/booking/appointments/:id/check-in
 * Check in a patient for their appointment
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = checkInAppointmentSchema.safeParse(body);
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

    const data = result.data;

    // Find the appointment
    const existing = await db.appointment.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
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

    // Check valid status transition
    if (!['SCHEDULED', 'CONFIRMED'].includes(existing.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: `Cannot check in an appointment with status: ${existing.status}`,
          },
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const clinicId = session.user.clinicId;

    // Use a transaction to update both appointment and flow state
    const [appointment, flowState] = await db.$transaction(async (tx) => {
      // Update appointment status
      const apt = await tx.appointment.update({
        where: { id },
        data: {
          status: 'ARRIVED',
          arrivedAt: now,
          checkedInBy: session.user.id,
          ...(data.notes && { notes: existing.notes ? `${existing.notes}\n\nCheck-in: ${data.notes}` : `Check-in: ${data.notes}` }),
        },
      });

      // Create or update flow state for operations tracking
      const existingFlow = await tx.patientFlowState.findFirst({
        where: { appointmentId: id },
      });

      let flow;
      if (existingFlow) {
        flow = await tx.patientFlowState.update({
          where: { id: existingFlow.id },
          data: {
            stage: 'CHECKED_IN',
            checkedInAt: now,
            currentWaitStartedAt: now,
            updatedBy: session.user.id,
          },
        });
      } else {
        // Create new flow state if it doesn't exist
        flow = await tx.patientFlowState.create({
          data: {
            clinicId,
            appointmentId: id,
            patientId: existing.patientId,
            stage: 'CHECKED_IN',
            providerId: existing.providerId,
            chairId: existing.chairId,
            scheduledAt: existing.startTime,
            checkedInAt: now,
            currentWaitStartedAt: now,
            createdBy: session.user.id,
          },
        });
      }

      // Add stage history
      await tx.flowStageHistory.create({
        data: {
          flowStateId: flow.id,
          stage: 'CHECKED_IN',
          enteredAt: now,
          triggeredBy: session.user.id,
        },
      });

      return [apt, flow];
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Appointment',
      entityId: appointment.id,
      details: {
        action: 'CHECK_IN',
        previousStatus: existing.status,
        newStatus: appointment.status,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: appointment,
    });
  },
  { permissions: ['booking:update'] }
);
