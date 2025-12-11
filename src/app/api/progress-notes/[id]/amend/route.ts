import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { amendProgressNoteSchema } from '@/lib/validations/treatment';

/**
 * POST /api/progress-notes/[id]/amend
 * Amend a signed progress note
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = amendProgressNoteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid amendment data',
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

    // Check if note can be amended (must be signed or co-signed)
    if (!['SIGNED', 'COSIGNED'].includes(existingNote.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Only signed or co-signed notes can be amended. Current status: ${existingNote.status}`,
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Store previous content for audit trail
    const previousContent = {
      subjective: existingNote.subjective,
      objective: existingNote.objective,
      assessment: existingNote.assessment,
      plan: existingNote.plan,
    };

    // Update the progress note with amendment
    const progressNote = await db.progressNote.update({
      where: { id },
      data: {
        status: 'AMENDED',
        isAmended: true,
        amendmentReason: data.amendmentReason,
        amendedAt: new Date(),
        subjective: data.subjective ?? existingNote.subjective,
        objective: data.objective ?? existingNote.objective,
        assessment: data.assessment ?? existingNote.assessment,
        plan: data.plan ?? existingNote.plan,
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
        signedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log with detailed amendment information
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ProgressNote',
      entityId: id,
      details: {
        action: 'AMEND',
        previousStatus: existingNote.status,
        newStatus: 'AMENDED',
        amendmentReason: data.amendmentReason,
        amendedAt: progressNote.amendedAt,
        previousContent,
        updatedFields: Object.keys(data).filter(k => k !== 'amendmentReason'),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: progressNote });
  },
  { permissions: ['treatment:update'] }
);
