import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { coSignProgressNoteSchema } from '@/lib/validations/treatment';

/**
 * POST /api/progress-notes/[id]/cosign
 * Co-sign a progress note (supervising provider)
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = coSignProgressNoteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid co-sign data',
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

    // Check if note can be co-signed
    if (existingNote.status !== 'PENDING_COSIGN') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Note must be in PENDING_COSIGN status to co-sign. Current status: ${existingNote.status}`,
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
        status: 'COSIGNED',
        coSignedAt: data.coSignedAt ?? new Date(),
        coSignedById: session.user.id,
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
        coSignedBy: {
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
        action: 'COSIGN',
        previousStatus: existingNote.status,
        newStatus: 'COSIGNED',
        coSignedAt: progressNote.coSignedAt,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: progressNote });
  },
  { permissions: ['treatment:update'] }
);
