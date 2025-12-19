import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateProgressNoteSchema } from '@/lib/validations/treatment';

/**
 * GET /api/progress-notes/[id]
 * Get a single progress note by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const progressNote = await db.progressNote.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
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
        supervisingProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        signedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        coSignedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            planNumber: true,
            planName: true,
          },
        },
        procedures: {
          orderBy: { performedAt: 'asc' },
        },
        findings: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!progressNote) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROGRESS_NOTE_NOT_FOUND',
            message: 'Progress note not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: progressNote });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/progress-notes/[id]
 * Update an existing progress note
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateProgressNoteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid progress note data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify note exists and belongs to clinic
    const existingNote = await db.progressNote.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existingNote) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROGRESS_NOTE_NOT_FOUND',
            message: 'Progress note not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if note can be edited (not signed or co-signed)
    if (['SIGNED', 'COSIGNED'].includes(existingNote.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOTE_LOCKED',
            message: 'Cannot edit a signed progress note. Use the amend endpoint instead.',
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Update the progress note
    const progressNote = await db.progressNote.update({
      where: { id },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ProgressNote',
      entityId: id,
      details: {
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: progressNote });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/progress-notes/[id]
 * Soft delete a progress note (only if DRAFT)
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Verify note exists and belongs to clinic
    const existingNote = await db.progressNote.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existingNote) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROGRESS_NOTE_NOT_FOUND',
            message: 'Progress note not found',
          },
        },
        { status: 404 }
      );
    }

    // Only allow deletion of DRAFT notes
    if (existingNote.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOTE_CANNOT_BE_DELETED',
            message: 'Only draft progress notes can be deleted',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete
    await db.progressNote.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ProgressNote',
      entityId: id,
      details: {
        noteType: existingNote.noteType,
        patientId: existingNote.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['treatment:delete'] }
);
