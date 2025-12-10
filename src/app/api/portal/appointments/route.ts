/**
 * Portal Appointments API
 *
 * GET /api/portal/appointments - List patient's appointments
 *
 * Patient-facing API for viewing and managing appointments.
 * Uses portal session authentication (not staff auth).
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPortalSession } from '@/lib/services/portal';

/**
 * GET /api/portal/appointments
 * List patient's upcoming and past appointments
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // upcoming, past, all
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const now = new Date();

    // Build where clause based on status filter
    let dateFilter: object = {};
    if (status === 'upcoming') {
      dateFilter = { startTime: { gte: now } };
    } else if (status === 'past') {
      dateFilter = { startTime: { lt: now } };
    }

    const appointments = await db.appointment.findMany({
      where: {
        clinicId: session.clinicId,
        patientId: session.patientId,
        deletedAt: null,
        ...dateFilter,
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
      },
      orderBy: {
        startTime: status === 'past' ? 'desc' : 'asc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: {
        appointments: appointments.map((apt) => ({
          id: apt.id,
          startTime: apt.startTime.toISOString(),
          endTime: apt.endTime.toISOString(),
          duration: apt.duration,
          status: apt.status,
          confirmationStatus: apt.confirmationStatus,
          appointmentType: apt.appointmentType,
          provider: apt.provider
            ? {
                id: apt.provider.id,
                name: `Dr. ${apt.provider.firstName} ${apt.provider.lastName}`,
                title: apt.provider.title,
              }
            : null,
          location: apt.room?.name || apt.chair?.name || null,
          patientNotes: apt.patientNotes,
          canConfirm: apt.status === 'SCHEDULED' && apt.startTime > now,
          canCancel:
            ['SCHEDULED', 'CONFIRMED'].includes(apt.status) && apt.startTime > now,
        })),
        total: appointments.length,
      },
    });
  } catch (error) {
    console.error('[Portal Appointments] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    );
  }
}
