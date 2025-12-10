/**
 * Portal Appointment Reschedule API
 *
 * POST /api/portal/appointments/:id/reschedule - Request reschedule
 *
 * Allows patients to request a reschedule for their upcoming appointments.
 * Updates appointment notes and logs the request.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getPortalSession } from '@/lib/services/portal';

const rescheduleSchema = z.object({
  preferredDates: z
    .array(z.string())
    .min(1, 'Please select at least one preferred date')
    .max(3, 'You can select up to 3 preferred dates'),
  preferredTimeOfDay: z.enum(['MORNING', 'AFTERNOON', 'EVENING', 'ANY']).default('ANY'),
  reason: z.string().min(1, 'Please provide a reason for rescheduling').max(500),
});

const TIME_LABELS: Record<string, string> = {
  MORNING: 'Morning (8am-12pm)',
  AFTERNOON: 'Afternoon (12pm-5pm)',
  EVENING: 'Evening (5pm-8pm)',
  ANY: 'Any time',
};

/**
 * POST /api/portal/appointments/:id/reschedule
 * Patient requests to reschedule their appointment
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getPortalSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Please log in to continue' },
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Parse and validate request body
    const body = await req.json().catch(() => ({}));
    const validation = rescheduleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.issues[0]?.message || 'Invalid request',
            details: validation.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { preferredDates, preferredTimeOfDay, reason } = validation.data;

    // Find the appointment and verify ownership
    const appointment = await db.appointment.findFirst({
      where: {
        id,
        clinicId: session.clinicId,
        patientId: session.patientId,
        deletedAt: null,
      },
      include: {
        appointmentType: {
          select: { name: true },
        },
        patient: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Appointment not found' },
        },
        { status: 404 }
      );
    }

    // Check if appointment can be rescheduled
    const now = new Date();
    if (appointment.startTime <= now) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'APPOINTMENT_PAST', message: 'Cannot reschedule past appointments' },
        },
        { status: 400 }
      );
    }

    if (!['SCHEDULED', 'CONFIRMED'].includes(appointment.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot reschedule appointment with status: ${appointment.status}`,
          },
        },
        { status: 400 }
      );
    }

    // Validate preferred dates are in the future
    const parsedDates = preferredDates.map((d) => new Date(d));
    const invalidDates = parsedDates.filter((date) => date <= now);
    if (invalidDates.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_DATE',
            message: 'Preferred dates must be in the future',
          },
        },
        { status: 400 }
      );
    }

    // Format dates for display
    const formattedDates = parsedDates
      .map((d) =>
        d.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      )
      .join(', ');

    const originalDate = appointment.startTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });

    // Update appointment with reschedule request info
    const rescheduleNote = `[RESCHEDULE REQUESTED via Portal ${now.toISOString()}]\nReason: ${reason}\nPreferred dates: ${formattedDates}\nPreferred time: ${TIME_LABELS[preferredTimeOfDay]}`;

    await db.appointment.update({
      where: { id },
      data: {
        confirmationStatus: 'PENDING', // Reset to pending since they want to reschedule
        patientNotes: appointment.patientNotes
          ? `${appointment.patientNotes}\n\n${rescheduleNote}`
          : rescheduleNote,
      },
    });

    // Log portal activity
    await db.portalActivityLog.create({
      data: {
        accountId: session.accountId,
        activityType: 'APPOINTMENT_RESCHEDULE',
        description: `Requested reschedule for ${appointment.appointmentType?.name || 'appointment'} on ${originalDate}. Reason: ${reason}. Preferred dates: ${formattedDates}. Preferred time: ${TIME_LABELS[preferredTimeOfDay]}`,
        relatedType: 'Appointment',
        relatedId: id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        appointmentId: id,
        status: 'REQUEST_SUBMITTED',
        message:
          'Your reschedule request has been submitted. The clinic will contact you soon to confirm a new time.',
        preferredDates: parsedDates.map((d) => d.toISOString()),
        preferredTimeOfDay,
      },
    });
  } catch (error) {
    console.error('[Portal Reschedule Appointment] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    );
  }
}
