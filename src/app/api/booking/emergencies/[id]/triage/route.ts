import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { triageEmergencySchema } from '@/lib/validations/emergency-reminders';

/**
 * POST /api/booking/emergencies/:id/triage
 * Complete triage for an emergency
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const validationResult = triageEmergencySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid triage data',
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
            message: 'Cannot triage a resolved emergency',
          },
        },
        { status: 400 }
      );
    }

    const { triageStatus, triageNotes, severity, selfCareInstructions } = validationResult.data;

    const emergency = await db.emergencyAppointment.update({
      where: { id },
      data: {
        triageStatus,
        triageNotes,
        ...(severity && { severity }),
        ...(selfCareInstructions && { selfCareInstructions }),
        triageCompletedAt: triageStatus === 'COMPLETED' || triageStatus === 'REFERRED' ? new Date() : null,
        triageCompletedBy: triageStatus === 'COMPLETED' || triageStatus === 'REFERRED' ? session.user.id : null,
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
