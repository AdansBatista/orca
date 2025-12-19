import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateStaffGoalSchema } from '@/lib/validations/performance';

/**
 * GET /api/staff/goals/[id]
 * Get a single staff goal
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    const goal = await db.staffGoal.findFirst({
      where: {
        id,
        ...clinicFilter,
      },
      include: {
        staffProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    if (!goal) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Goal not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: goal });
  },
  { permissions: ['staff:read', 'staff:write', 'staff:admin'] }
);

/**
 * PUT /api/staff/goals/[id]
 * Update a staff goal
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);

    // Validate input
    const result = updateStaffGoalSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid goal data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if goal exists
    const existing = await db.staffGoal.findFirst({
      where: {
        id,
        ...clinicFilter,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Goal not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Update the goal
    const goal = await db.staffGoal.update({
      where: { id },
      data,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'StaffGoal',
      entityId: goal.id,
      details: {
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: goal });
  },
  { permissions: ['staff:write', 'staff:admin'] }
);

/**
 * DELETE /api/staff/goals/[id]
 * Delete a staff goal
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    // Check if goal exists
    const existing = await db.staffGoal.findFirst({
      where: {
        id,
        ...clinicFilter,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Goal not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the goal
    await db.staffGoal.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'StaffGoal',
      entityId: id,
      details: {
        staffProfileId: existing.staffProfileId,
        title: existing.title,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['staff:admin'] }
);
