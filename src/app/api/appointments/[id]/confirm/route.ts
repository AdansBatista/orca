import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { getReminderService } from '@/lib/services/reminders';
import { z } from 'zod';

const confirmSchema = z.object({
  response: z.enum(['CONFIRMED', 'DECLINED', 'RESCHEDULE_REQUESTED']),
  source: z.enum(['patient', 'staff', 'auto']).optional().default('staff'),
  responseText: z.string().optional(),
});

/**
 * POST /api/appointments/[id]/confirm
 *
 * Process a confirmation response for an appointment.
 * Updates appointment status and reminder records.
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = confirmSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid confirmation data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { response, source, responseText } = result.data;

    // Verify appointment exists
    const appointment = await db.appointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      select: {
        id: true,
        status: true,
        confirmationStatus: true,
        patientId: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPOINTMENT_NOT_FOUND',
            message: 'Appointment not found',
          },
        },
        { status: 404 }
      );
    }

    // Check appointment status
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Cannot confirm cancelled or completed appointments',
          },
        },
        { status: 400 }
      );
    }

    const service = getReminderService();
    const now = new Date();

    // Process the confirmation
    if (response === 'CONFIRMED') {
      await db.appointment.update({
        where: { id },
        data: {
          confirmationStatus: 'CONFIRMED',
          confirmedAt: now,
          confirmedBy: source,
        },
      });
    } else if (response === 'DECLINED') {
      await db.appointment.update({
        where: { id },
        data: {
          confirmationStatus: 'DECLINED',
          status: 'CANCELLED',
          cancelledAt: now,
          cancelledBy: session.user.id,
          cancellationReason: responseText || 'Patient declined via confirmation',
        },
      });

      // Cancel remaining reminders
      await service.cancelRemindersForAppointment(id);
    } else if (response === 'RESCHEDULE_REQUESTED') {
      await db.appointment.update({
        where: { id },
        data: {
          confirmationStatus: 'DECLINED', // Use DECLINED for reschedule requests
          notes: `${responseText ? responseText + '\n' : ''}Patient requested reschedule on ${now.toISOString()}`,
        },
      });
    }

    // Update reminder records
    await service.processConfirmationResponse(id, response, responseText);

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Appointment',
      entityId: id,
      details: {
        action: 'confirmation',
        response,
        source,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        appointmentId: id,
        response,
        processedAt: now,
      },
    });
  },
  { permissions: ['appointments:manage'] }
);
