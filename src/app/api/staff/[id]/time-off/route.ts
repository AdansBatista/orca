import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createTimeOffRequestSchema, timeOffQuerySchema } from '@/lib/validations/scheduling';
import { withSoftDelete } from '@/lib/db/soft-delete';
import {
  validateAdvanceNotice,
  requiresHRReview,
  checkConsecutiveDays,
} from '@/lib/utils/time-off-policy';

/**
 * GET /api/staff/:id/time-off
 * Get time-off requests for a specific staff member
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: staffProfileId } = await context.params;
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      status: searchParams.get('status') ?? undefined,
      requestType: searchParams.get('requestType') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = timeOffQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { status, requestType, startDate, endDate, page, pageSize } = queryResult.data;

    // Verify staff profile exists
    const staffProfile = await db.staffProfile.findFirst({
      where: withSoftDelete({
        id: staffProfileId,
        ...getClinicFilter(session),
      }),
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Staff profile not found',
          },
        },
        { status: 404 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {
      staffProfileId,
      ...getClinicFilter(session),
    };

    if (status) where.status = status;
    if (requestType) where.requestType = requestType;

    // Date range filter
    if (startDate || endDate) {
      const dateConditions = [];
      if (startDate) {
        dateConditions.push({ endDate: { gte: startDate } });
      }
      if (endDate) {
        dateConditions.push({ startDate: { lte: endDate } });
      }
      if (dateConditions.length > 0) {
        where.AND = dateConditions;
      }
    }

    // Get total count
    const total = await db.timeOffRequest.count({ where });

    // Get paginated results
    const items = await db.timeOffRequest.findMany({
      where,
      orderBy: [
        { startDate: 'desc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['schedule:view', 'schedule:edit', 'schedule:full'] }
);

/**
 * POST /api/staff/:id/time-off
 * Create a new time-off request
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: staffProfileId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createTimeOffRequestSchema.safeParse({ ...body, staffProfileId });
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

    const data = result.data;

    // Verify staff profile exists
    const staffProfile = await db.staffProfile.findFirst({
      where: withSoftDelete({
        id: staffProfileId,
        ...getClinicFilter(session),
      }),
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Staff profile not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate advance notice requirements
    const advanceNoticeResult = validateAdvanceNotice(
      data.requestType,
      new Date(data.startDate)
    );

    if (!advanceNoticeResult.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_ADVANCE_NOTICE',
            message: advanceNoticeResult.message,
            details: {
              requiredDays: advanceNoticeResult.requiredDays,
              actualDays: advanceNoticeResult.actualDays,
              requestType: data.requestType,
            },
          },
        },
        { status: 400 }
      );
    }

    // Check for blackout dates that block or restrict the requested period
    const blackoutDates = await db.blackoutDate.findMany({
      where: {
        clinicId: session.user.clinicId,
        isActive: true,
        OR: [
          {
            AND: [
              { startDate: { lte: data.startDate } },
              { endDate: { gte: data.startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: data.endDate } },
              { endDate: { gte: data.endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: data.startDate } },
              { endDate: { lte: data.endDate } },
            ],
          },
        ],
      },
    });

    // Check for BLOCKED blackout dates
    const blockedDates = blackoutDates.filter(d => d.restrictionType === 'BLOCKED');
    if (blockedDates.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BLACKOUT_DATE_BLOCKED',
            message: 'Time-off requests are not allowed during this period',
            details: {
              blackoutDates: blockedDates.map(d => ({
                name: d.name,
                startDate: d.startDate,
                endDate: d.endDate,
                description: d.description,
              })),
            },
          },
        },
        { status: 400 }
      );
    }

    // Check for RESTRICTED or WARNING blackout dates (will be included in response)
    const warningDates = blackoutDates.filter(
      d => d.restrictionType === 'RESTRICTED' || d.restrictionType === 'WARNING'
    );

    // Check for overlapping time-off requests
    const overlappingRequest = await db.timeOffRequest.findFirst({
      where: {
        staffProfileId,
        clinicId: session.user.clinicId,
        status: { in: ['PENDING', 'APPROVED'] },
        OR: [
          {
            AND: [
              { startDate: { lte: data.startDate } },
              { endDate: { gte: data.startDate } },
            ],
          },
          {
            AND: [
              { startDate: { lte: data.endDate } },
              { endDate: { gte: data.endDate } },
            ],
          },
          {
            AND: [
              { startDate: { gte: data.startDate } },
              { endDate: { lte: data.endDate } },
            ],
          },
        ],
      },
    });

    if (overlappingRequest) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TIME_OFF_OVERLAP',
            message: 'This request overlaps with an existing time-off request',
            details: { existingRequestId: overlappingRequest.id },
          },
        },
        { status: 409 }
      );
    }

    // Calculate total days
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check consecutive days warning
    const consecutiveDaysWarning = checkConsecutiveDays(data.requestType, totalDays);

    // Check if HR review is required
    const needsHRReview = requiresHRReview(data.requestType);

    // Create the request
    const timeOffRequest = await db.timeOffRequest.create({
      data: {
        ...data,
        totalDays: data.isPartialDay ? 0.5 : totalDays,
        clinicId: session.user.clinicId,
      },
    });

    // Build warnings array for response
    const warnings: string[] = [];
    if (warningDates.length > 0) {
      warnings.push(
        `Note: This request overlaps with restricted periods: ${warningDates.map(d => d.name).join(', ')}`
      );
    }
    if (consecutiveDaysWarning) {
      warnings.push(consecutiveDaysWarning);
    }
    if (needsHRReview) {
      warnings.push(`${data.requestType} requests require HR review and may take longer to process.`);
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'TimeOffRequest',
      entityId: timeOffRequest.id,
      details: {
        staffProfileId,
        requestType: data.requestType,
        startDate: data.startDate,
        endDate: data.endDate,
        totalDays,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: timeOffRequest,
        ...(warnings.length > 0 && { warnings }),
        ...(needsHRReview && { requiresHRReview: true }),
      },
      { status: 201 }
    );
  },
  { permissions: ['schedule:request', 'schedule:edit', 'schedule:full'] }
);
