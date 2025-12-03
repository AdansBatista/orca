import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { resolveEmergencySchema } from '@/lib/validations/emergency-reminders';

/**
 * POST /api/booking/emergencies/:id/resolve
 * Resolve an emergency appointment request
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const validationResult = resolveEmergencySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid resolution data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const existing = await db.emergencyAppointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Emergency appointment not found',
          },
        },
        { status: 404 }
      );
    }

    if (existing.resolution) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_RESOLVED',
            message: 'Emergency is already resolved',
          },
        },
        { status: 400 }
      );
    }

    const { resolution, resolutionNotes, appointmentId, scheduledFor } = validationResult.data;

    const emergency = await db.emergencyAppointment.update({
      where: { id },
      data: {
        resolution,
        resolutionNotes,
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
        ...(appointmentId && { appointmentId }),
        ...(scheduledFor && { scheduledFor }),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: emergency,
    });
  },
  { permissions: ['booking:write'] }
);
