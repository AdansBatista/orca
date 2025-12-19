import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

const useTemplateSchema = z.object({
  name: z.string().min(1).max(100, 'Role name must be less than 100 characters'),
  code: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Role code must start with a letter and contain only lowercase letters, numbers, and underscores'
    ),
  description: z.string().max(500).optional().nullable(),
  additionalPermissions: z.array(z.string()).optional(),
  removePermissions: z.array(z.string()).optional(),
});

/**
 * POST /api/role-templates/[id]/use
 * Create a new role from a template
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = useTemplateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid role data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Find the template
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

    if (!template.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: 'Cannot use inactive template',
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate role code
    const existingRole = await db.role.findUnique({
      where: { code: data.code },
    });

    if (existingRole) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CODE',
            message: 'A role with this code already exists',
          },
        },
        { status: 409 }
      );
    }

    // Calculate final permissions
    let permissions = [...template.permissions];

    // Add additional permissions
    if (data.additionalPermissions && data.additionalPermissions.length > 0) {
      permissions = [...new Set([...permissions, ...data.additionalPermissions])];
    }

    // Remove specified permissions
    if (data.removePermissions && data.removePermissions.length > 0) {
      permissions = permissions.filter(p => !data.removePermissions!.includes(p));
    }

    // Create the role
    const role = await db.role.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description ?? `Created from template: ${template.name}`,
        permissions,
        isSystem: false,
      },
    });

    // Increment template usage count
    await db.roleTemplate.update({
      where: { id },
      data: {
        usageCount: { increment: 1 },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Role',
      entityId: role.id,
      details: {
        name: role.name,
        code: role.code,
        fromTemplate: template.name,
        fromTemplateId: template.id,
        permissionCount: permissions.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: role }, { status: 201 });
  },
  { permissions: ['roles:edit', 'roles:full'] }
);
