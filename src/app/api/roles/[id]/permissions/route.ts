import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateRolePermissionsSchema } from '@/lib/validations/roles';

/**
 * GET /api/roles/[id]/permissions
 * Get permissions for a role
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const role = await db.role.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        permissions: true,
        isSystem: true,
      },
    });

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Role not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        roleId: role.id,
        roleName: role.name,
        roleCode: role.code,
        isSystem: role.isSystem,
        permissions: role.permissions,
      },
    });
  },
  { permissions: ['roles:view', 'roles:edit', 'roles:full'] }
);

/**
 * PUT /api/roles/[id]/permissions
 * Update permissions for a role
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateRolePermissionsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid permissions data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if role exists
    const existingRole = await db.role.findUnique({
      where: { id },
    });

    if (!existingRole) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Role not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot modify system role permissions
    if (existingRole.isSystem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot modify permissions of system roles',
          },
        },
        { status: 403 }
      );
    }

    const previousPermissions = existingRole.permissions;

    // Update the role permissions
    const role = await db.role.update({
      where: { id },
      data: {
        permissions: result.data.permissions,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Role',
      entityId: role.id,
      details: {
        name: role.name,
        code: role.code,
        field: 'permissions',
        previousPermissions,
        newPermissions: result.data.permissions,
        added: result.data.permissions.filter((p: string) => !previousPermissions.includes(p)),
        removed: previousPermissions.filter((p) => !result.data.permissions.includes(p)),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        roleId: role.id,
        roleName: role.name,
        roleCode: role.code,
        isSystem: role.isSystem,
        permissions: role.permissions,
      },
    });
  },
  { permissions: ['roles:full'] }
);
