import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { noShowAppointmentSchema } from '@/lib/validations/booking';

/**
 * POST /api/booking/appointments/:id/no-show
 * Mark an appointment as no-show
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = noShowAppointmentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid no-show data',
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

    // Check valid status transition - can mark no-show from scheduled or confirmed
    if (!['SCHEDULED', 'CONFIRMED'].includes(existing.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: `Cannot mark no-show for an appointment with status: ${existing.status}`,
          },
        },
        { status: 400 }
      );
    }

    // Update appointment status
    const appointment = await db.appointment.update({
      where: { id },
      data: {
        status: 'NO_SHOW',
        markedNoShowAt: new Date(),
        noShowReason: data.noShowReason,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Appointment',
      entityId: appointment.id,
      details: {
        action: 'NO_SHOW',
        previousStatus: existing.status,
        newStatus: appointment.status,
        reason: data.noShowReason,
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
