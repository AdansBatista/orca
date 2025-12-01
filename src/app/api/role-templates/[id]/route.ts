import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

const updateRoleTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().min(1).max(100).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/role-templates/[id]
 * Get a single role template
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const template = await db.roleTemplate.findUnique({
      where: { id },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Role template not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: template });
  },
  { permissions: ['roles:view', 'roles:edit', 'roles:full'] }
);

/**
 * PUT /api/role-templates/[id]
 * Update a role template
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateRoleTemplateSchema.safeParse(body);
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

    // Check if template exists
    const existingTemplate = await db.roleTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Role template not found',
          },
        },
        { status: 404 }
      );
    }

    // Industry standard templates can only be deactivated, not modified
    const data = result.data;
    if (existingTemplate.isIndustryStandard) {
      // Only allow isActive to be changed
      if (Object.keys(data).some(k => k !== 'isActive')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FORBIDDEN',
              message: 'Cannot modify industry standard templates. You can only activate/deactivate them.',
            },
          },
          { status: 403 }
        );
      }
    }

    // Update the template
    const template = await db.roleTemplate.update({
      where: { id },
      data,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'RoleTemplate',
      entityId: template.id,
      details: {
        name: template.name,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: template });
  },
  { permissions: ['roles:edit', 'roles:full'] }
);

/**
 * DELETE /api/role-templates/[id]
 * Delete a role template
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Check if template exists
    const existingTemplate = await db.roleTemplate.findUnique({
      where: { id },
    });

    if (!existingTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Role template not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot delete industry standard templates
    if (existingTemplate.isIndustryStandard) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot delete industry standard templates. Deactivate them instead.',
          },
        },
        { status: 403 }
      );
    }

    // Delete the template
    await db.roleTemplate.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'RoleTemplate',
      entityId: id,
      details: {
        name: existingTemplate.name,
        code: existingTemplate.code,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['roles:full'] }
);
