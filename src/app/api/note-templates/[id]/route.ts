import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateNoteTemplateSchema } from '@/lib/validations/treatment';

// Helper for template clinic filter - templates can be null clinicId for system templates
function getTemplateFilter(session: { user: { clinicId: string } }) {
  return {
    OR: [
      { clinicId: session.user.clinicId },
      { clinicId: null }, // System templates
    ],
  };
}

/**
 * GET /api/note-templates/[id]
 * Get a single note template
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const template = await db.noteTemplate.findFirst({
      where: {
        id,
        ...getTemplateFilter(session),
      },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Note template not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: template });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/note-templates/[id]
 * Update a note template
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateNoteTemplateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid template data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify template exists and user can edit it
    const existingTemplate = await db.noteTemplate.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId, // Can only edit own clinic's templates
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Note template not found or not editable',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Update template
    const template = await db.noteTemplate.update({
      where: { id },
      data,
      include: {
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
      entity: 'NoteTemplate',
      entityId: id,
      details: {
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: template });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/note-templates/[id]
 * Delete a note template
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Verify template exists and user can delete it
    const existingTemplate = await db.noteTemplate.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId, // Can only delete own clinic's templates
        isSystemTemplate: false, // Cannot delete system templates
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Note template not found or cannot be deleted',
          },
        },
        { status: 404 }
      );
    }

    // Hard delete (no soft delete field on this model)
    await db.noteTemplate.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'NoteTemplate',
      entityId: id,
      details: {
        templateName: existingTemplate.templateName,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['treatment:delete'] }
);
