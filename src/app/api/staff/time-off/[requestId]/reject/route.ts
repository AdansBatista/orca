import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { rejectTimeOffSchema } from '@/lib/validations/scheduling';

/**
 * POST /api/staff/time-off/:requestId/reject
 * Reject a time-off request
 */
export const POST = withAuth<{ requestId: string }>(
  async (req, session, context) => {
    const { requestId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = rejectTimeOffSchema.safeParse({ ...body, id: requestId });
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

    const { rejectionReason } = result.data;

    // Find existing request
    const existingRequest = await db.timeOffRequest.findFirst({
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
          },
        },
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

    // Can only reject pending requests
    if (existingRequest.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Can only reject pending time-off requests',
          },
        },
        { status: 400 }
      );
    }

    // Update the request
    const timeOffRequest = await db.timeOffRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectionReason,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'TimeOffRequest',
      entityId: timeOffRequest.id,
      details: {
        action: 'REJECT',
        staffProfileId: timeOffRequest.staffProfileId,
        staffName: `${existingRequest.staffProfile.firstName} ${existingRequest.staffProfile.lastName}`,
        requestType: existingRequest.requestType,
        rejectionReason,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: timeOffRequest,
    });
  },
  { permissions: ['schedule:approve', 'schedule:full'] }
);
