import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete } from '@/lib/db/soft-delete';

/**
 * DELETE /api/staff/[id]/roles/[assignmentId]
 * Remove a role assignment from a staff member
 */
export const DELETE = withAuth<{ id: string; assignmentId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id, assignmentId } = await context.params;

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

    // Find the assignment
    const assignment = await db.roleAssignment.findFirst({
      where: {
        id: assignmentId,
        userId: id,
        clinicId: session.user.clinicId,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Role assignment not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the assignment
    await db.roleAssignment.delete({
      where: { id: assignmentId },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'RoleAssignment',
      entityId: assignmentId,
      details: {
        userId: id,
        userName: `${user.firstName} ${user.lastName}`,
        roleId: assignment.role.id,
        roleName: assignment.role.name,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['roles:assign', 'roles:full'] }
);
