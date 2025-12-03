import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { startAppointmentSchema } from '@/lib/validations/booking';

/**
 * POST /api/booking/appointments/:id/start
 * Start an appointment (patient is with provider)
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = startAppointmentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid start data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Find the appointment
    const existing = await db.appointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
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
    if (!['ARRIVED'].includes(existing.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: `Cannot start an appointment with status: ${existing.status}. Patient must be checked in first.`,
          },
        },
        { status: 400 }
      );
    }

    // Update appointment status
    const appointment = await db.appointment.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        ...(data.notes && { notes: existing.notes ? `${existing.notes}\n\nStart: ${data.notes}` : `Start: ${data.notes}` }),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Appointment',
      entityId: appointment.id,
      details: {
        action: 'START',
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
