import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateRoleSchema } from '@/lib/validations/roles';

/**
 * GET /api/roles/[id]
 * Get a single role by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const role = await db.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assignments: true },
        },
        assignments: {
          take: 10,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        parentRole: {
          select: {
            id: true,
            name: true,
            code: true,
            level: true,
          },
        },
        childRoles: {
          select: {
            id: true,
            name: true,
            code: true,
            level: true,
          },
        },
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

    // Look up StaffProfiles for assigned users to enable proper linking
    const userIds = role.assignments.map((a) => a.user.id);
    const staffProfiles = await db.staffProfile.findMany({
      where: withSoftDelete({
        userId: { in: userIds },
      }),
      select: {
        id: true,
        userId: true,
      },
    });

    // Create a map from userId to staffProfileId
    const userToStaffMap = new Map(
      staffProfiles.map((sp) => [sp.userId, sp.id])
    );

    // Enrich assignments with staffProfileId
    const enrichedAssignments = role.assignments.map((assignment) => ({
      ...assignment,
      staffProfileId: userToStaffMap.get(assignment.user.id) || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...role,
        assignments: enrichedAssignments,
        assignmentCount: role._count.assignments,
        _count: undefined,
      },
    });
  },
  { permissions: ['roles:view', 'roles:edit', 'roles:full'] }
);

/**
 * PUT /api/roles/[id]
 * Update a role
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateRoleSchema.safeParse(body);
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

    // System roles have limited editability (only name and description)
    const data = result.data;
    const updateData: Record<string, unknown> = {};
    const changes: string[] = [];

    if (data.name !== undefined && data.name !== existingRole.name) {
      updateData.name = data.name;
      changes.push('name');
    }
    if (data.description !== undefined && data.description !== existingRole.description) {
      updateData.description = data.description;
      changes.push('description');
    }

    // Only allow permission updates for non-system roles
    if (data.permissions !== undefined) {
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

      // Track permission changes
      const newPermissions = data.permissions;
      const addedPerms = newPermissions.filter((p: string) => !existingRole.permissions.includes(p));
      const removedPerms = existingRole.permissions.filter((p: string) => !newPermissions.includes(p));

      updateData.permissions = data.permissions;
      if (addedPerms.length > 0 || removedPerms.length > 0) {
        changes.push('permissions');
      }
    }

    // Handle hierarchy fields for non-system roles
    if (!existingRole.isSystem) {
      if (data.level !== undefined && data.level !== existingRole.level) {
        updateData.level = data.level;
        changes.push('level');
      }

      if (data.parentRoleId !== undefined) {
        // Validate parent role if provided
        if (data.parentRoleId !== null) {
          // Can't set self as parent
          if (data.parentRoleId === id) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'INVALID_PARENT_ROLE',
                  message: 'A role cannot be its own parent',
                },
              },
              { status: 400 }
            );
          }

          const parentRole = await db.role.findUnique({
            where: { id: data.parentRoleId },
          });

          if (!parentRole) {
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'INVALID_PARENT_ROLE',
                  message: 'Parent role not found',
                },
              },
              { status: 400 }
            );
          }

          // Check for circular reference
          let currentParent = parentRole;
          while (currentParent.parentRoleId) {
            if (currentParent.parentRoleId === id) {
              return NextResponse.json(
                {
                  success: false,
                  error: {
                    code: 'CIRCULAR_HIERARCHY',
                    message: 'This would create a circular hierarchy',
                  },
                },
                { status: 400 }
              );
            }
            const nextParent = await db.role.findUnique({
              where: { id: currentParent.parentRoleId },
            });
            if (!nextParent) break;
            currentParent = nextParent;
          }
        }

        if (data.parentRoleId !== existingRole.parentRoleId) {
          updateData.parentRoleId = data.parentRoleId;
          changes.push('parentRoleId');
        }
      }
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true, data: existingRole });
    }

    // Update the role
    const role = await db.role.update({
      where: { id },
      data: updateData,
    });

    // Record role change history
    await db.roleChangeHistory.create({
      data: {
        roleId: id,
        changeType: 'UPDATE',
        changeData: {
          before: {
            name: existingRole.name,
            description: existingRole.description,
            permissions: existingRole.permissions,
            level: existingRole.level,
            parentRoleId: existingRole.parentRoleId,
          },
          after: {
            name: role.name,
            description: role.description,
            permissions: role.permissions,
            level: role.level,
            parentRoleId: role.parentRoleId,
          },
          changes,
        },
        description: `Updated role "${role.name}": ${changes.join(', ')}`,
        changedById: session.user.id,
        changedByName: `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || undefined,
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
        changes,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: role });
  },
  { permissions: ['roles:edit', 'roles:full'] }
);

/**
 * DELETE /api/roles/[id]
 * Delete a role
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Check if role exists
    const existingRole = await db.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { assignments: true, childRoles: true },
        },
      },
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

    // Cannot delete system roles
    if (existingRole.isSystem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot delete system roles',
          },
        },
        { status: 403 }
      );
    }

    // Cannot delete roles with active assignments
    if (existingRole._count.assignments > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: `Cannot delete role with ${existingRole._count.assignments} active assignments. Remove all assignments first.`,
          },
        },
        { status: 409 }
      );
    }

    // Cannot delete roles with child roles
    if (existingRole._count.childRoles > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: `Cannot delete role with ${existingRole._count.childRoles} child roles. Update or remove child roles first.`,
          },
        },
        { status: 409 }
      );
    }

    // Record deletion in history before deleting
    await db.roleChangeHistory.create({
      data: {
        roleId: id,
        changeType: 'DELETE',
        changeData: {
          deletedRole: {
            name: existingRole.name,
            code: existingRole.code,
            description: existingRole.description,
            permissions: existingRole.permissions,
            level: existingRole.level,
            parentRoleId: existingRole.parentRoleId,
          },
        },
        description: `Deleted role "${existingRole.name}" (${existingRole.code})`,
        changedById: session.user.id,
        changedByName: `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || undefined,
      },
    });

    // Delete the role
    await db.role.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'Role',
      entityId: id,
      details: {
        name: existingRole.name,
        code: existingRole.code,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['roles:full'] }
);
