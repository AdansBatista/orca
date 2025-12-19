import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { cancelAppointmentSchema } from '@/lib/validations/booking';

/**
 * POST /api/booking/appointments/:id/cancel
 * Cancel an appointment
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    // Validate input
    const result = cancelAppointmentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid cancellation data',
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

    // Check valid status transition - cannot cancel completed or already cancelled/no-show
    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(existing.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: `Cannot cancel an appointment with status: ${existing.status}`,
          },
        },
        { status: 400 }
      );
    }

    // Update appointment status
    const appointment = await db.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: session.user.id,
        cancellationReason: data.cancellationReason,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Appointment',
      entityId: appointment.id,
      details: {
        action: 'CANCEL',
        previousStatus: existing.status,
        newStatus: appointment.status,
        reason: data.cancellationReason,
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
