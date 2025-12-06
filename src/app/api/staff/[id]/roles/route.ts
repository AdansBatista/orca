import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { createRoleAssignmentSchema } from '@/lib/validations/roles';

/**
 * GET /api/staff/[id]/roles
 * Get all role assignments for a staff member (user)
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Verify the user exists and belongs to the clinic
    const user = await db.user.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found',
          },
        },
        { status: 404 }
      );
    }

    // Get role assignments
    const assignments = await db.roleAssignment.findMany({
      where: {
        userId: id,
        clinicId: session.user.clinicId,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            code: true,
            description: true,
            isSystem: true,
            permissions: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          primaryRole: user.role,
        },
        assignments,
      },
    });
  },
  { permissions: ['roles:view', 'roles:edit', 'roles:full', 'staff:view', 'staff:full'] }
);

/**
 * POST /api/staff/[id]/roles
 * Assign a role to a staff member
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createRoleAssignmentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid role assignment data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const targetClinicId = data.clinicId || session.user.clinicId;

    // Verify the user exists and belongs to the clinic
    const user = await db.user.findFirst({
      where: withSoftDelete({
        id,
        clinicIds: { has: targetClinicId },
      }),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'User not found or not associated with this clinic',
          },
        },
        { status: 404 }
      );
    }

    // Verify the role exists
    const role = await db.role.findUnique({
      where: { id: data.roleId },
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

    // Check if assignment already exists
    const existingAssignment = await db.roleAssignment.findFirst({
      where: {
        userId: id,
        roleId: data.roleId,
        clinicId: targetClinicId,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE',
            message: 'This role is already assigned to this user for this clinic',
          },
        },
        { status: 409 }
      );
    }

    // Create the assignment
    const assignment = await db.roleAssignment.create({
      data: {
        userId: id,
        roleId: data.roleId,
        clinicId: targetClinicId,
        assignedBy: session.user.id,
        assignedAt: data.effectiveFrom || new Date(),
        expiresAt: data.effectiveUntil,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            code: true,
            permissions: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'RoleAssignment',
      entityId: assignment.id,
      details: {
        userId: id,
        userName: `${user.firstName} ${user.lastName}`,
        roleId: role.id,
        roleName: role.name,
        clinicId: targetClinicId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  },
  { permissions: ['roles:assign', 'roles:full'] }
);
