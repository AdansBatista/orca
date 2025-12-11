import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { signProgressNoteSchema } from '@/lib/validations/treatment';

/**
 * POST /api/progress-notes/[id]/sign
 * Sign a progress note
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = signProgressNoteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid sign data',
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

    // Check if note can be signed
    if (!['DRAFT', 'PENDING_SIGNATURE'].includes(existingNote.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot sign a note with status ${existingNote.status}`,
          },
        },
        { status: 400 }
      );
    }

    // Verify the signer is the provider or has appropriate permissions
    // For simplicity, we allow any authorized user to sign
    const data = result.data;

    // Determine next status based on whether co-signature is required
    const needsCosign = existingNote.supervisingProviderId !== null;
    const newStatus = needsCosign ? 'PENDING_COSIGN' : 'SIGNED';

    // Update the progress note
    const progressNote = await db.progressNote.update({
      where: { id },
      data: {
        status: newStatus,
        signedAt: data.signedAt ?? new Date(),
        signedById: session.user.id,
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

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ProgressNote',
      entityId: id,
      details: {
        action: 'SIGN',
        previousStatus: existingNote.status,
        newStatus,
        signedAt: progressNote.signedAt,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: progressNote });
  },
  { permissions: ['treatment:update'] }
);
