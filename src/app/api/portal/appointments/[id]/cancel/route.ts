/**
 * Portal Appointment Cancel API
 *
 * POST /api/portal/appointments/:id/cancel - Request cancellation
 *
 * Allows patients to cancel their upcoming appointments.
 * Cancellation may be subject to clinic policies (e.g., 24-hour notice).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getPortalSession } from '@/lib/services/portal';

const cancelSchema = z.object({
  reason: z.string().min(1, 'Please provide a reason').max(500).optional(),
});

/**
 * POST /api/portal/appointments/:id/cancel
 * Patient cancels their appointment
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

    // Parse request body
    let body: { reason?: string } = {};
    try {
      const rawBody = await req.text();
      if (rawBody) {
        body = JSON.parse(rawBody);
      }
    } catch {
      // Empty body is OK
    }

    const validation = cancelSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: validation.error.issues[0]?.message || 'Invalid request',
          },
        },
        { status: 400 }
      );
    }

    const { reason } = validation.data;

    // Find the appointment and verify ownership
    const appointment = await db.appointment.findFirst({
      where: {
        id,
        clinicId: session.clinicId,
        patientId: session.patientId,
        deletedAt: null,
      },
      include: {
        clinic: {
          select: {
            name: true,
            // Could add cancellation policy settings here
          },
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

    // Check if appointment can be cancelled
    const now = new Date();
    if (appointment.startTime <= now) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'APPOINTMENT_PAST', message: 'Cannot cancel past appointments' },
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
            message: `Cannot cancel appointment with status: ${appointment.status}`,
          },
        },
        { status: 400 }
      );
    }

    // Check cancellation policy (e.g., 24-hour notice)
    // This could be configurable per clinic
    const hoursUntilAppointment =
      (appointment.startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const minCancellationHours = 24; // Could be from clinic settings

    let warningMessage: string | null = null;
    if (hoursUntilAppointment < minCancellationHours) {
      warningMessage = `This cancellation is within ${minCancellationHours} hours of your appointment. A late cancellation fee may apply.`;
    }

    // Update appointment status
    const updated = await db.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        confirmationStatus: 'DECLINED', // Use DECLINED since CANCELLED doesn't exist in ConfirmationStatus
        cancelledAt: new Date(),
        cancelledBy: session.patientId,
        cancellationReason: reason
          ? `Patient: ${reason}`
          : 'Patient cancelled via portal',
      },
      select: {
        id: true,
        status: true,
        cancelledAt: true,
        startTime: true,
      },
    });

    // Log portal activity
    await db.portalActivityLog.create({
      data: {
        accountId: session.accountId,
        activityType: 'APPOINTMENT_CANCEL',
        description: `Cancelled appointment for ${appointment.startTime.toISOString()}${reason ? `: ${reason}` : ''}`,
        relatedType: 'Appointment',
        relatedId: id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        cancelledAt: updated.cancelledAt?.toISOString(),
        message: 'Appointment cancelled successfully',
        warning: warningMessage,
      },
    });
  } catch (error) {
    console.error('[Portal Cancel Appointment] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    );
  }
}
