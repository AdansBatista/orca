import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateTimeOffRequestSchema } from '@/lib/validations/scheduling';

/**
 * GET /api/staff/time-off/:requestId
 * Get a specific time-off request
 */
export const GET = withAuth<{ requestId: string }>(
  async (req, session, context) => {
    const { requestId } = await context.params;

    const timeOffRequest = await db.timeOffRequest.findFirst({
      where: {
        id: requestId,
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

    if (!timeOffRequest) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Time-off request not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: timeOffRequest,
    });
  },
  { permissions: ['schedule:view', 'schedule:edit', 'schedule:full'] }
);

/**
 * PUT /api/staff/time-off/:requestId
 * Update a time-off request
 */
export const PUT = withAuth<{ requestId: string }>(
  async (req, session, context) => {
    const { requestId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateTimeOffRequestSchema.safeParse({ ...body, id: requestId });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid time-off request data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { id, ...updateData } = result.data;

    // Find existing request
    const existingRequest = await db.timeOffRequest.findFirst({
      where: {
        id: requestId,
        ...getClinicFilter(session),
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Time-off request not found',
          },
        },
        { status: 404 }
      );
    }

    // Can only update pending requests
    if (existingRequest.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Can only update pending time-off requests',
          },
        },
        { status: 400 }
      );
    }

    // Update the request
    const timeOffRequest = await db.timeOffRequest.update({
      where: { id: requestId },
      data: updateData,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'TimeOffRequest',
      entityId: timeOffRequest.id,
      details: {
        changes: Object.keys(updateData),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: timeOffRequest,
    });
  },
  { permissions: ['schedule:request', 'schedule:edit', 'schedule:full'] }
);

/**
 * DELETE /api/staff/time-off/:requestId
 * Cancel/withdraw a time-off request
 */
export const DELETE = withAuth<{ requestId: string }>(
  async (req, session, context) => {
    const { requestId } = await context.params;

    // Find existing request
    const existingRequest = await db.timeOffRequest.findFirst({
      where: {
        id: requestId,
        ...getClinicFilter(session),
      },
    });

    if (!existingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Time-off request not found',
          },
        },
        { status: 404 }
      );
    }

    // Can only cancel pending or approved requests
    if (!['PENDING', 'APPROVED'].includes(existingRequest.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Can only cancel pending or approved time-off requests',
          },
        },
        { status: 400 }
      );
    }

    // Update status based on current status
    const newStatus = existingRequest.status === 'PENDING' ? 'WITHDRAWN' : 'CANCELLED';

    const timeOffRequest = await db.timeOffRequest.update({
      where: { id: requestId },
      data: { status: newStatus },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'TimeOffRequest',
      entityId: timeOffRequest.id,
      details: {
        staffProfileId: timeOffRequest.staffProfileId,
        previousStatus: existingRequest.status,
        newStatus,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { message: `Time-off request ${newStatus.toLowerCase()}` },
    });
  },
  { permissions: ['schedule:request', 'schedule:edit', 'schedule:full'] }
);
