import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDeleteAnd, SOFT_DELETE_FILTER } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateTemplateSchema } from '@/lib/validations/communications';

/**
 * GET /api/communications/templates/[id]
 * Get a single message template
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    // Use soft delete helper for MongoDB null/unset handling
    const template = await db.messageTemplate.findFirst({
      where: withSoftDeleteAnd([{ id }, getClinicFilter(session)]),
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  },
  { permissions: ['comms:view_inbox'] }
);

/**
 * PUT /api/communications/templates/[id]
 * Update a message template
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = updateTemplateSchema.safeParse(body);
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

    // Check template exists (using soft delete helper)
    const existing = await db.messageTemplate.findFirst({
      where: withSoftDeleteAnd([{ id }, getClinicFilter(session)]),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found',
          },
        },
        { status: 404 }
      );
    }

    // Check for system templates
    if (existing.isSystem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SYSTEM_TEMPLATE',
            message: 'System templates cannot be modified',
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate name if name is being changed (using soft delete filter)
    if (data.name && data.name !== existing.name) {
      const duplicate = await db.messageTemplate.findFirst({
        where: withSoftDeleteAnd([
          { clinicId: session.user.clinicId },
          { name: data.name },
          { id: { not: id } },
        ]),
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_NAME',
              message: 'A template with this name already exists',
            },
          },
          { status: 400 }
        );
      }
    }

    // Update template (increment version)
    const template = await db.messageTemplate.update({
      where: { id },
      data: {
        ...data,
        version: existing.version + 1,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'MessageTemplate',
      entityId: template.id,
      details: {
        name: template.name,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  },
  { permissions: ['comms:manage_templates'] }
);

/**
 * DELETE /api/communications/templates/[id]
 * Soft delete a message template
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    // Check template exists (using soft delete helper)
    const existing = await db.messageTemplate.findFirst({
      where: withSoftDeleteAnd([{ id }, getClinicFilter(session)]),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found',
          },
        },
        { status: 404 }
      );
    }

    // Check for system templates
    if (existing.isSystem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SYSTEM_TEMPLATE',
            message: 'System templates cannot be deleted',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete
    await db.messageTemplate.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'MessageTemplate',
      entityId: id,
      details: {
        name: existing.name,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['comms:manage_templates'] }
);
