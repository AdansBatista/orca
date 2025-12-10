/**
 * Portal Appointment Confirm API
 *
 * POST /api/portal/appointments/:id/confirm - Confirm attendance
 *
 * Allows patients to confirm their upcoming appointments.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPortalSession } from '@/lib/services/portal';

/**
 * POST /api/portal/appointments/:id/confirm
 * Patient confirms their appointment
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

    // Find the appointment and verify ownership
    const appointment = await db.appointment.findFirst({
      where: {
        id,
        clinicId: session.clinicId,
        patientId: session.patientId,
        deletedAt: null,
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

    // Check if appointment can be confirmed
    const now = new Date();
    if (appointment.startTime <= now) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'APPOINTMENT_PAST', message: 'Cannot confirm past appointments' },
        },
        { status: 400 }
      );
    }

    if (appointment.status !== 'SCHEDULED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot confirm appointment with status: ${appointment.status}`,
          },
        },
        { status: 400 }
      );
    }

    // Update appointment status
    const updated = await db.appointment.update({
      where: { id },
      data: {
        status: 'CONFIRMED',
        confirmationStatus: 'CONFIRMED',
        confirmedAt: new Date(),
        confirmedBy: session.patientId,
      },
      select: {
        id: true,
        status: true,
        confirmationStatus: true,
        confirmedAt: true,
      },
    });

    // Log portal activity
    await db.portalActivityLog.create({
      data: {
        accountId: session.accountId,
        activityType: 'APPOINTMENT_CONFIRM',
        description: `Confirmed appointment for ${appointment.startTime.toISOString()}`,
        relatedType: 'Appointment',
        relatedId: id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        status: updated.status,
        confirmationStatus: updated.confirmationStatus,
        confirmedAt: updated.confirmedAt?.toISOString(),
        message: 'Appointment confirmed successfully',
      },
    });
  } catch (error) {
    console.error('[Portal Confirm Appointment] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    );
  }
}
