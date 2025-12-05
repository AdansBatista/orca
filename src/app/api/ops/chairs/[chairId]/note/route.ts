import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { addChairNoteSchema } from '@/lib/validations/ops';

/**
 * POST /api/ops/chairs/[chairId]/note
 * Add a procedure note to the current chair session
 * Notes are accumulated during the appointment and can feed into the patient chart
 */
export const POST = withAuth<{ chairId: string }>(
  async (req, session, context) => {
    const { chairId } = await context.params;
    const clinicId = session.user.clinicId;
    const body = await req.json();

    // Validate input
    const parsed = addChairNoteSchema.safeParse(body);
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

    const { note, appendToExisting } = parsed.data;

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
            message: 'Chair is not currently occupied. Cannot add note.',
          },
        },
        { status: 400 }
      );
    }

    // Format note with timestamp and user
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const formattedNote = `[${timestamp}] ${note}`;

    // Update the procedure notes
    const updated = await db.resourceOccupancy.update({
      where: { id: occupancy.id },
      data: {
        procedureNotes:
          appendToExisting && occupancy.procedureNotes
            ? `${occupancy.procedureNotes}\n${formattedNote}`
            : formattedNote,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        chairId,
        procedureNotes: updated.procedureNotes,
        noteAdded: formattedNote,
      },
    });
  },
  { permissions: ['ops:manage_flow'] }
);

/**
 * GET /api/ops/chairs/[chairId]/note
 * Get the current procedure notes for a chair session
 */
export const GET = withAuth<{ chairId: string }>(
  async (req, session, context) => {
    const { chairId } = await context.params;
    const clinicId = session.user.clinicId;

    // Get current occupancy
    const occupancy = await db.resourceOccupancy.findFirst({
      where: {
        clinicId,
        chairId,
      },
      select: {
        procedureNotes: true,
        status: true,
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    if (!occupancy) {
      return NextResponse.json({
        success: true,
        data: {
          chairId,
          status: 'AVAILABLE',
          procedureNotes: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        chairId,
        status: occupancy.status,
        procedureNotes: occupancy.procedureNotes,
        patient: occupancy.patient,
      },
    });
  },
  { permissions: ['ops:read'] }
);
