import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { approveTimeOffSchema } from '@/lib/validations/scheduling';
import { updatePTOUsage } from '@/lib/services/pto-tracking';

/**
 * POST /api/staff/time-off/:requestId/approve
 * Approve a time-off request
 */
export const POST = withAuth<{ requestId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { requestId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = approveTimeOffSchema.safeParse({ ...body, id: requestId });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid approval data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { approvalNotes } = result.data;

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
            userId: true,
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

    // Prevent self-approval: manager cannot approve their own request
    if (existingRequest.staffProfile.userId === session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SELF_APPROVAL_NOT_ALLOWED',
            message: 'You cannot approve your own time-off request',
          },
        },
        { status: 403 }
      );
    }

    // Can only approve pending requests
    if (existingRequest.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Can only approve pending time-off requests',
          },
        },
        { status: 400 }
      );
    }

    // Update the request
    const timeOffRequest = await db.timeOffRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        approvalNotes,
      },
    });

    // Update PTO usage tracking
    const requestYear = existingRequest.startDate.getFullYear();
    await updatePTOUsage(
      existingRequest.staffProfileId,
      session.user.clinicId,
      existingRequest.requestType,
      existingRequest.totalDays,
      requestYear
    );

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'TimeOffRequest',
      entityId: timeOffRequest.id,
      details: {
        action: 'APPROVE',
        staffProfileId: timeOffRequest.staffProfileId,
        staffName: `${existingRequest.staffProfile.firstName} ${existingRequest.staffProfile.lastName}`,
        requestType: existingRequest.requestType,
        startDate: existingRequest.startDate,
        endDate: existingRequest.endDate,
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
