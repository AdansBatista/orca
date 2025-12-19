import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth } from '@/lib/auth/with-auth';
import { blockChairSchema } from '@/lib/validations/ops';

/**
 * POST /api/ops/chairs/[chairId]/block
 * Block a chair for cleaning, maintenance, or other reasons
 */
export const POST = withAuth<{ chairId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { chairId } = await context.params;
    const clinicId = session.user.clinicId;
    const body = await req.json();

    // Validate input
    const parsed = blockChairSchema.safeParse(body);
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

    const { reason, blockType, blockedUntil, durationMinutes } = parsed.data;

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

    // Check if chair is currently occupied with a patient
    const existingOccupancy = await db.resourceOccupancy.findFirst({
      where: {
        clinicId,
        chairId,
        status: 'OCCUPIED',
      },
    });

    if (existingOccupancy) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CHAIR_OCCUPIED',
            message: 'Cannot block an occupied chair. Please complete or move the patient first.',
          },
        },
        { status: 400 }
      );
    }

    // Calculate blockedUntil if durationMinutes is provided
    let calculatedBlockedUntil: Date | null = null;
    if (blockedUntil) {
      calculatedBlockedUntil = new Date(blockedUntil);
    } else if (durationMinutes) {
      calculatedBlockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
    }

    // Create or update occupancy record
    await db.resourceOccupancy.upsert({
      where: {
        clinicId_chairId: {
          clinicId,
          chairId,
        },
      },
      create: {
        clinicId,
        chairId,
        status: blockType,
        blockReason: reason,
        blockedUntil: calculatedBlockedUntil,
        occupiedAt: new Date(),
      },
      update: {
        status: blockType,
        blockReason: reason,
        blockedUntil: calculatedBlockedUntil,
        occupiedAt: new Date(),
        // Clear patient/appointment data if any
        patientId: null,
        appointmentId: null,
        activitySubStage: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        chairId,
        chairName: chair.name,
        roomName: chair.room.name,
        status: blockType,
        blockReason: reason,
        blockedUntil: calculatedBlockedUntil,
        message: `${chair.name} in ${chair.room.name} has been ${
          blockType === 'CLEANING' ? 'marked for cleaning' :
          blockType === 'MAINTENANCE' ? 'marked for maintenance' :
          'blocked'
        }`,
      },
    });
  },
  { permissions: ['ops:manage_resources'] }
);
