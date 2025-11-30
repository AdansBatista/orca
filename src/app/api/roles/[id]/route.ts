import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
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
      where: {
        userId: { in: userIds },
        deletedAt: null,
      },
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

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
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
      updateData.permissions = data.permissions;
    }

    // Update the role
    const role = await db.role.update({
      where: { id },
      data: updateData,
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
        changes: Object.keys(updateData),
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
          select: { assignments: true },
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
