import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { updateSubStageSchema } from '@/lib/validations/ops';

/**
 * PUT /api/ops/chairs/[chairId]/sub-stage
 * Update the activity sub-stage for a chair
 */
export const PUT = withAuth<{ chairId: string }>(
  async (req, session, context) => {
    const { chairId } = await context.params;
    const clinicId = session.user.clinicId;
    const body = await req.json();

    // Validate input
    const parsed = updateSubStageSchema.safeParse(body);
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

    const { subStage, assignedStaffId, notes } = parsed.data;

    // Verify chair exists and belongs to this clinic
    const chair = await db.treatmentChair.findFirst({
      where: {
        id: chairId,
        room: { clinicId },
        deletedAt: null,
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
    });

    if (!occupancy) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_OCCUPIED',
            message: 'Chair is not currently occupied. Cannot set sub-stage.',
          },
        },
        { status: 400 }
      );
    }

    // Update the sub-stage
    const updated = await db.resourceOccupancy.update({
      where: { id: occupancy.id },
      data: {
        activitySubStage: subStage,
        subStageStartedAt: new Date(),
        ...(assignedStaffId && { assignedStaffId }),
        ...(notes && {
          procedureNotes: occupancy.procedureNotes
            ? `${occupancy.procedureNotes}\n[${subStage}] ${notes}`
            : `[${subStage}] ${notes}`,
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
        activitySubStage: updated.activitySubStage,
        subStageStartedAt: updated.subStageStartedAt,
        assignedStaff: updated.assignedStaff,
        patient: updated.patient,
        procedureNotes: updated.procedureNotes,
      },
    });
  },
  { permissions: ['ops:manage_flow'] }
);

/**
 * GET /api/ops/chairs/[chairId]/sub-stage
 * Get current sub-stage for a chair
 */
export const GET = withAuth<{ chairId: string }>(
  async (req, session, context) => {
    const { chairId } = await context.params;
    const clinicId = session.user.clinicId;

    // Get current occupancy with sub-stage
    const occupancy = await db.resourceOccupancy.findFirst({
      where: {
        clinicId,
        chairId,
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
        assignedStaff: {
          select: { id: true, firstName: true, lastName: true, providerType: true },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            appointmentType: {
              select: { id: true, name: true, code: true },
            },
          },
        },
      },
    });

    if (!occupancy) {
      return NextResponse.json({
        success: true,
        data: {
          chairId,
          status: 'AVAILABLE',
          activitySubStage: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        chairId,
        status: occupancy.status,
        activitySubStage: occupancy.activitySubStage,
        subStageStartedAt: occupancy.subStageStartedAt,
        assignedStaff: occupancy.assignedStaff,
        patient: occupancy.patient,
        appointment: occupancy.appointment,
        procedureNotes: occupancy.procedureNotes,
        occupiedAt: occupancy.occupiedAt,
        expectedFreeAt: occupancy.expectedFreeAt,
      },
    });
  },
  { permissions: ['ops:read'] }
);
