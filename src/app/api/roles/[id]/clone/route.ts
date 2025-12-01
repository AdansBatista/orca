import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

const cloneRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required').max(100),
  code: z
    .string()
    .min(1, 'Role code is required')
    .max(50)
    .regex(
      /^[a-z][a-z0-9_]*$/,
      'Role code must start with a letter and contain only lowercase letters, numbers, and underscores'
    ),
  description: z.string().max(500).optional().nullable(),
});

/**
 * POST /api/roles/[id]/clone
 * Clone an existing role
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = cloneRoleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid clone data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Find the source role
    const sourceRole = await db.role.findUnique({
      where: { id },
    });

    if (!sourceRole) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Source role not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Check for duplicate code
    const existingByCode = await db.role.findUnique({
      where: { code: data.code },
    });

    if (existingByCode) {
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

    // Create the cloned role
    const newRole = await db.role.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description ?? `Cloned from ${sourceRole.name}`,
        permissions: sourceRole.permissions, // Copy permissions from source
        isSystem: false, // Cloned roles are never system roles
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Role',
      entityId: newRole.id,
      details: {
        name: newRole.name,
        code: newRole.code,
        clonedFrom: sourceRole.name,
        clonedFromId: sourceRole.id,
        permissionCount: newRole.permissions.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: newRole }, { status: 201 });
  },
  { permissions: ['roles:edit', 'roles:full'] }
);
