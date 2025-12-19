import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { approveOvertimeSchema } from '@/lib/validations/scheduling';

/**
 * GET /api/staff/overtime/[id]
 * Get a single overtime log
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const overtimeLog = await db.overtimeLog.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        staffProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            title: true,
            department: true,
          },
        },
      },
    });

    if (!overtimeLog) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Overtime log not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: overtimeLog });
  },
  { permissions: ['schedule:view', 'schedule:edit', 'schedule:full'] }
);

/**
 * PATCH /api/staff/overtime/[id]
 * Update overtime log (primarily for approval)
 */
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = approveOvertimeSchema.safeParse({ ...body, id });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid overtime data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await db.overtimeLog.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        staffProfile: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Overtime log not found',
          },
        },
        { status: 404 }
      );
    }

    // Can only update pending overtime
    if (existing.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: `Cannot update overtime that is already ${existing.status.toLowerCase()}`,
          },
        },
        { status: 400 }
      );
    }

    const { notes } = result.data;

    // Update the overtime log
    const updated = await db.overtimeLog.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
        notes: notes || existing.notes,
      },
      include: {
        staffProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            title: true,
            department: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'APPROVE',
      entity: 'OvertimeLog',
      entityId: id,
      details: {
        staffName: `${existing.staffProfile.firstName} ${existing.staffProfile.lastName}`,
        weekStartDate: existing.weekStartDate,
        overtimeHours: existing.overtimeHours,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: updated });
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);
