import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateLabOrderTemplateSchema } from '@/lib/validations/lab';

/**
 * GET /api/lab/templates/[id]
 * Get a specific template
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const template = await db.labOrderTemplate.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Template not found',
          },
        },
        { status: 404 }
      );
    }

    // Fetch vendor info if applicable
    let vendor = null;
    if (template.vendorId) {
      vendor = await db.labVendor.findUnique({
        where: { id: template.vendorId },
        select: { id: true, name: true, code: true },
      });
    }

    return NextResponse.json({ success: true, data: { ...template, vendor } });
  },
  { permissions: ['lab:view'] }
);

/**
 * PUT /api/lab/templates/[id]
 * Update a template
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    const result = updateLabOrderTemplateSchema.safeParse(body);
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

    const existing = await db.labOrderTemplate.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Template not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== existing.name) {
      const duplicate = await db.labOrderTemplate.findFirst({
        where: {
          clinicId: session.user.clinicId,
          name: data.name,
          id: { not: id },
          deletedAt: null,
        },
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

    const template = await db.labOrderTemplate.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isClinicWide !== undefined && { isClinicWide: data.isClinicWide }),
        ...(data.vendorId !== undefined && { vendorId: data.vendorId }),
        ...(data.items && { items: data.items }),
        ...(data.defaultNotes !== undefined && { defaultNotes: data.defaultNotes }),
      },
    });

    // Fetch vendor info if applicable
    let vendor = null;
    if (template.vendorId) {
      vendor = await db.labVendor.findUnique({
        where: { id: template.vendorId },
        select: { id: true, name: true, code: true },
      });
    }

    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'LabOrderTemplate',
      entityId: template.id,
      details: { name: template.name, changes: Object.keys(data) },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { ...template, vendor } });
  },
  { permissions: ['lab:create_order'] }
);

/**
 * DELETE /api/lab/templates/[id]
 * Soft delete a template
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const existing = await db.labOrderTemplate.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Template not found',
          },
        },
        { status: 404 }
      );
    }

    await db.labOrderTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'LabOrderTemplate',
      entityId: id,
      details: { name: existing.name },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['lab:create_order'] }
);
