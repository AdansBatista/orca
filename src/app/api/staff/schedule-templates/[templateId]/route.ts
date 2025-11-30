import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateScheduleTemplateSchema } from '@/lib/validations/scheduling';

/**
 * GET /api/staff/schedule-templates/:templateId
 * Get a specific schedule template
 */
export const GET = withAuth<{ templateId: string }>(
  async (req, session, context) => {
    const { templateId } = await context.params;

    const template = await db.scheduleTemplate.findFirst({
      where: {
        id: templateId,
        ...getClinicFilter(session),
      },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Schedule template not found',
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
  { permissions: ['schedule:view', 'schedule:edit', 'schedule:full'] }
);

/**
 * PUT /api/staff/schedule-templates/:templateId
 * Update a schedule template
 */
export const PUT = withAuth<{ templateId: string }>(
  async (req, session, context) => {
    const { templateId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateScheduleTemplateSchema.safeParse({ ...body, id: templateId });
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

    const { id, ...updateData } = result.data;

    // Find existing template
    const existingTemplate = await db.scheduleTemplate.findFirst({
      where: {
        id: templateId,
        ...getClinicFilter(session),
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Schedule template not found',
          },
        },
        { status: 404 }
      );
    }

    // If setting as default, unset any existing defaults of same type
    if (updateData.isDefault) {
      await db.scheduleTemplate.updateMany({
        where: {
          ...getClinicFilter(session),
          templateType: updateData.templateType || existingTemplate.templateType,
          isDefault: true,
          id: { not: templateId },
        },
        data: { isDefault: false },
      });
    }

    // Update the template
    const template = await db.scheduleTemplate.update({
      where: { id: templateId },
      data: {
        ...updateData,
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ScheduleTemplate',
      entityId: template.id,
      details: {
        changes: Object.keys(updateData),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);

/**
 * DELETE /api/staff/schedule-templates/:templateId
 * Delete a schedule template
 */
export const DELETE = withAuth<{ templateId: string }>(
  async (req, session, context) => {
    const { templateId } = await context.params;

    // Find existing template
    const existingTemplate = await db.scheduleTemplate.findFirst({
      where: {
        id: templateId,
        ...getClinicFilter(session),
      },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Schedule template not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the template
    await db.scheduleTemplate.delete({
      where: { id: templateId },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ScheduleTemplate',
      entityId: templateId,
      details: {
        name: existingTemplate.name,
        templateType: existingTemplate.templateType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Template deleted successfully' },
    });
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);
