import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/booking/on-call/current
 * Get the current on-call provider
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const now = new Date();

    const current = await db.onCallSchedule.findFirst({
      where: {
        ...getClinicFilter(session),
        status: { in: ['SCHEDULED', 'ACTIVE'] },
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: [
        { type: 'asc' }, // PRIMARY first
        { startDate: 'asc' },
      ],
    });

    if (!current) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No on-call provider currently assigned',
      });
    }

    // If status is SCHEDULED and we're now within the window, update to ACTIVE
    if (current.status === 'SCHEDULED') {
      await db.onCallSchedule.update({
        where: { id: current.id },
        data: { status: 'ACTIVE' },
      });
      current.status = 'ACTIVE';
    }

    return NextResponse.json({
      success: true,
      data: current,
    });
  },
  { permissions: ['booking:read'] }
);
