import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/booking/reminders/:id
 * Get a specific reminder
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    const reminder = await db.appointmentReminder.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        appointment: {
          select: {
            id: true,
            startTime: true,
            status: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    if (!reminder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Reminder not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: reminder,
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * DELETE /api/booking/reminders/:id
 * Cancel a scheduled reminder
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    const existing = await db.appointmentReminder.findFirst({
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
            message: 'Reminder not found',
          },
        },
        { status: 404 }
      );
    }

    // Only allow cancelling scheduled reminders
    if (existing.status !== 'SCHEDULED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CANNOT_CANCEL',
            message: `Cannot cancel a reminder with status: ${existing.status}`,
          },
        },
        { status: 400 }
      );
    }

    await db.appointmentReminder.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['booking:write'] }
);
