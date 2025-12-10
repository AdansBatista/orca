import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateFormTemplateSchema } from '@/lib/validations/forms';

/**
 * GET /api/forms/templates/[id]
 * Get a single form template by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Get template - either clinic-specific or global
    const template = await db.formTemplate.findFirst({
      where: {
        id,
        OR: [{ clinicId: session.user.clinicId }, { clinicId: null }],
      },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Form template not found',
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
  { permissions: ['forms:view', 'forms:edit', 'forms:full'] }
);

/**
 * PUT /api/forms/templates/[id]
 * Update a form template
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateFormTemplateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid form template data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if template exists and is clinic-owned (can't edit global templates)
    const existing = await db.formTemplate.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId, // Only allow editing clinic-owned templates
      },
    });

    if (!existing) {
      // Check if it's a global template
      const globalTemplate = await db.formTemplate.findFirst({
        where: { id, clinicId: null },
      });

      if (globalTemplate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Cannot edit global form templates',
            },
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Form template not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Update template
    const template = await db.formTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.schema !== undefined && { schema: data.schema as Prisma.InputJsonValue }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isRequired !== undefined && { isRequired: data.isRequired }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'FormTemplate',
      entityId: id,
      details: {
        changes: data,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  },
  { permissions: ['forms:edit', 'forms:full'] }
);

/**
 * DELETE /api/forms/templates/[id]
 * Delete a form template
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Check if template exists and is clinic-owned
    const existing = await db.formTemplate.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    });

    if (!existing) {
      const globalTemplate = await db.formTemplate.findFirst({
        where: { id, clinicId: null },
      });

      if (globalTemplate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Cannot delete global form templates',
            },
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Form template not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if template has submissions
    const submissionCount = await db.formSubmission.count({
      where: { templateId: id },
    });

    if (submissionCount > 0) {
      // Deactivate instead of delete
      await db.formTemplate.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        success: true,
        data: {
          id,
          deactivated: true,
          message: 'Template has submissions and was deactivated instead of deleted',
        },
      });
    }

    // Delete template
    await db.formTemplate.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'FormTemplate',
      entityId: id,
      details: {
        name: existing.name,
        type: existing.type,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['forms:full'] }
);
