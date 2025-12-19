import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateShiftSchema } from '@/lib/validations/scheduling';

/**
 * GET /api/staff/shifts/:shiftId
 * Get a specific shift
 */
export const GET = withAuth<{ shiftId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { shiftId } = await context.params;

    const shift = await db.staffShift.findFirst({
      where: {
        id: shiftId,
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
            isProvider: true,
            providerType: true,
          },
        },
      },
    });

    if (!shift) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Shift not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: shift,
    });
  },
  { permissions: ['schedule:view', 'schedule:edit', 'schedule:full'] }
);

/**
 * PUT /api/staff/shifts/:shiftId
 * Update a shift
 */
export const PUT = withAuth<{ shiftId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { shiftId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateShiftSchema.safeParse({ ...body, id: shiftId });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid shift data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { id, ...updateData } = result.data;

    // Find existing shift
    const existingShift = await db.staffShift.findFirst({
      where: {
        id: shiftId,
        ...getClinicFilter(session),
      },
    });

    if (!existingShift) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Shift not found',
          },
        },
        { status: 404 }
      );
    }

    // Prevent modification of COMPLETED shifts without admin override
    if (existingShift.status === 'COMPLETED') {
      // Check for admin override flag in request body
      if (!body.adminOverride) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'HISTORICAL_SHIFT_PROTECTED',
              message: 'Cannot modify a completed shift. Admin override required.',
              details: {
                shiftId: existingShift.id,
                status: existingShift.status,
                shiftDate: existingShift.shiftDate,
              },
            },
          },
          { status: 403 }
        );
      }

      // Log the admin override action
      const { ipAddress: overrideIp, userAgent: overrideUa } = getRequestMeta(req);
      await logAudit(session, {
        action: 'UPDATE',
        entity: 'StaffShift',
        entityId: existingShift.id,
        details: {
          adminOverride: true,
          reason: body.overrideReason || 'No reason provided',
          originalStatus: existingShift.status,
        },
        ipAddress: overrideIp,
        userAgent: overrideUa,
      });
    }

    // Prepare update data
    const dataToUpdate: Record<string, unknown> = {
      ...updateData,
      updatedBy: session.user.id,
    };

    // Recalculate scheduled hours if times changed
    if (updateData.startTime || updateData.endTime || updateData.breakMinutes !== undefined) {
      const startTime = new Date(updateData.startTime || existingShift.startTime);
      const endTime = new Date(updateData.endTime || existingShift.endTime);
      const breakMinutes = updateData.breakMinutes ?? existingShift.breakMinutes;
      const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      dataToUpdate.scheduledHours = (totalMinutes - breakMinutes) / 60;
    }

    // Update the shift
    const shift = await db.staffShift.update({
      where: { id: shiftId },
      data: dataToUpdate,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'StaffShift',
      entityId: shift.id,
      details: {
        changes: Object.keys(updateData),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: shift,
    });
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);

/**
 * DELETE /api/staff/shifts/:shiftId
 * Delete (cancel) a shift
 */
export const DELETE = withAuth<{ shiftId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { shiftId } = await context.params;

    // Try to parse body for override options (body may be empty for DELETE)
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is acceptable for DELETE
    }

    // Find existing shift
    const existingShift = await db.staffShift.findFirst({
      where: {
        id: shiftId,
        ...getClinicFilter(session),
      },
    });

    if (!existingShift) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Shift not found',
          },
        },
        { status: 404 }
      );
    }

    // Prevent cancellation of COMPLETED shifts without admin override
    if (existingShift.status === 'COMPLETED') {
      if (!body.adminOverride) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'HISTORICAL_SHIFT_PROTECTED',
              message: 'Cannot cancel a completed shift. Admin override required.',
              details: {
                shiftId: existingShift.id,
                status: existingShift.status,
                shiftDate: existingShift.shiftDate,
              },
            },
          },
          { status: 403 }
        );
      }

      // Log the admin override action
      const { ipAddress: overrideIp, userAgent: overrideUa } = getRequestMeta(req);
      await logAudit(session, {
        action: 'DELETE',
        entity: 'StaffShift',
        entityId: existingShift.id,
        details: {
          adminOverride: true,
          reason: (body.overrideReason as string) || 'No reason provided',
          originalStatus: existingShift.status,
        },
        ipAddress: overrideIp,
        userAgent: overrideUa,
      });
    }

    // Update status to CANCELLED instead of deleting
    const shift = await db.staffShift.update({
      where: { id: shiftId },
      data: {
        status: 'CANCELLED',
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'StaffShift',
      entityId: shift.id,
      details: {
        staffProfileId: shift.staffProfileId,
        shiftDate: shift.shiftDate,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Shift cancelled successfully' },
    });
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);
