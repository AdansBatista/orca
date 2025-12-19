import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth } from '@/lib/auth/with-auth';
import { readyForDoctorSchema } from '@/lib/validations/ops';

/**
 * POST /api/ops/chairs/[chairId]/ready-for-doctor
 * Quick action to mark a chair as "Ready for Doctor"
 * This is the most common action - assistants use this to signal the doctor
 */
export const POST = withAuth<{ chairId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { chairId } = await context.params;
    const clinicId = session.user.clinicId;
    const body = await req.json();

    // Validate input (optional notes)
    const parsed = readyForDoctorSchema.safeParse(body);
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

    const { notes } = parsed.data;

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

    // Get current occupancy
    const occupancy = await db.resourceOccupancy.findFirst({
      where: {
        clinicId,
        chairId,
        status: 'OCCUPIED',
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!occupancy) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_OCCUPIED',
            message: 'Chair is not currently occupied. Cannot mark ready for doctor.',
          },
        },
        { status: 400 }
      );
    }

    // Update to READY_FOR_DOCTOR sub-stage
    const updated = await db.resourceOccupancy.update({
      where: { id: occupancy.id },
      data: {
        activitySubStage: 'READY_FOR_DOCTOR',
        subStageStartedAt: new Date(),
        // Keep current assigned staff (or leave as is)
        ...(notes && {
          procedureNotes: occupancy.procedureNotes
            ? `${occupancy.procedureNotes}\n[READY_FOR_DOCTOR] ${notes}`
            : `[READY_FOR_DOCTOR] ${notes}`,
        }),
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
        assignedStaff: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        chairId,
        chairName: chair.name,
        roomName: chair.room.name,
        activitySubStage: 'READY_FOR_DOCTOR',
        subStageStartedAt: updated.subStageStartedAt,
        patient: updated.patient,
        assignedStaff: updated.assignedStaff,
        message: `${chair.name} in ${chair.room.name} is now ready for doctor`,
      },
    });
  },
  { permissions: ['ops:manage_flow'] }
);
