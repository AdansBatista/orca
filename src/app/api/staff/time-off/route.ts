import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { timeOffQuerySchema } from '@/lib/validations/scheduling';

/**
 * GET /api/staff/time-off
 * List all time-off requests
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      staffProfileId: searchParams.get('staffProfileId') ?? undefined,
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

    const {
      staffProfileId,
      status,
      requestType,
      startDate,
      endDate,
      page,
      pageSize,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (staffProfileId) where.staffProfileId = staffProfileId;
    if (status) where.status = status;
    if (requestType) where.requestType = requestType;

    // Date range filter (requests that overlap with the date range)
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
        { status: 'asc' }, // Pending first
        { startDate: 'asc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
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
