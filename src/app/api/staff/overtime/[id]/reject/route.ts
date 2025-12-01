import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

const rejectOvertimeSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(1000),
});

/**
 * POST /api/staff/overtime/[id]/reject
 * Reject an overtime log
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = rejectOvertimeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid rejection data',
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

    // Can only reject pending overtime
    if (existing.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATE',
            message: `Cannot reject overtime that is already ${existing.status.toLowerCase()}`,
          },
        },
        { status: 400 }
      );
    }

    const { reason } = result.data;

    // Update the overtime log
    const updated = await db.overtimeLog.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
        notes: reason,
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
      action: 'REJECT',
      entity: 'OvertimeLog',
      entityId: id,
      details: {
        staffName: `${existing.staffProfile.firstName} ${existing.staffProfile.lastName}`,
        weekStartDate: existing.weekStartDate,
        overtimeHours: existing.overtimeHours,
        reason,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: updated });
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);
