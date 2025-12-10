/**
 * Portal Appointment Detail API
 *
 * GET /api/portal/appointments/:id - Get appointment details
 *
 * Patient-facing API for viewing a specific appointment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPortalSession } from '@/lib/services/portal';

/**
 * GET /api/portal/appointments/:id
 * Get a specific appointment
 */
export async function GET(
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

    const appointment = await db.appointment.findFirst({
      where: {
        id,
        clinicId: session.clinicId,
        patientId: session.patientId,
        deletedAt: null,
      },
      include: {
        appointmentType: {
          select: {
            name: true,
            color: true,
            description: true,
            defaultDuration: true,
          },
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        chair: {
          select: { name: true },
        },
        room: {
          select: { name: true },
        },
        clinic: {
          select: {
            name: true,
            phone: true,
            address: true,
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

    const now = new Date();
    const isUpcoming = appointment.startTime > now;

    return NextResponse.json({
      success: true,
      data: {
        id: appointment.id,
        startTime: appointment.startTime.toISOString(),
        endTime: appointment.endTime.toISOString(),
        duration: appointment.duration,
        status: appointment.status,
        confirmationStatus: appointment.confirmationStatus,
        appointmentType: appointment.appointmentType,
        provider: appointment.provider
          ? {
              id: appointment.provider.id,
              name: `Dr. ${appointment.provider.firstName} ${appointment.provider.lastName}`,
              title: appointment.provider.title,
            }
          : null,
        location: appointment.room?.name || appointment.chair?.name || null,
        patientNotes: appointment.patientNotes,
        clinic: appointment.clinic,
        // Self-service permissions
        canConfirm: appointment.status === 'SCHEDULED' && isUpcoming,
        canCancel:
          ['SCHEDULED', 'CONFIRMED'].includes(appointment.status) && isUpcoming,
      },
    });
  } catch (error) {
    console.error('[Portal Appointment Detail] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    );
  }
}
