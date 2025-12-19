import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth } from '@/lib/auth/with-auth';
import { unblockChairSchema } from '@/lib/validations/ops';

/**
 * POST /api/ops/chairs/[chairId]/unblock
 * Unblock a chair, making it available again
 */
export const POST = withAuth<{ chairId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { chairId } = await context.params;
    const clinicId = session.user.clinicId;

    let body = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional for unblock
    }

    // Validate input (optional notes)
    const parsed = unblockChairSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid input',
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify chair exists and belongs to this clinic
    const chair = await db.treatmentChair.findFirst({
      where: withSoftDelete({
        id: chairId,
        room: { clinicId },
      }),
      include: {
        room: { select: { name: true } },
      },
    });

    if (!chair) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NOT_FOUND', message: 'Chair not found' },
        },
        { status: 404 }
      );
    }

    // Get current occupancy - should be BLOCKED, CLEANING, or MAINTENANCE
    const occupancy = await db.resourceOccupancy.findFirst({
      where: {
        clinicId,
        chairId,
        status: { in: ['BLOCKED', 'CLEANING', 'MAINTENANCE'] },
      },
    });

    if (!occupancy) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_BLOCKED',
            message: 'Chair is not currently blocked, in maintenance, or cleaning.',
          },
        },
        { status: 400 }
      );
    }

    const previousStatus = occupancy.status;

    // Update to AVAILABLE
    await db.resourceOccupancy.update({
      where: { id: occupancy.id },
      data: {
        status: 'AVAILABLE',
        blockReason: null,
        blockedUntil: null,
        occupiedAt: null,
        expectedFreeAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        chairId,
        chairName: chair.name,
        roomName: chair.room.name,
        previousStatus,
        status: 'AVAILABLE',
        message: `${chair.name} in ${chair.room.name} is now available`,
      },
    });
  },
  { permissions: ['ops:manage_resources'] }
);
