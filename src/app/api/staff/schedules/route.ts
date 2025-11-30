import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { shiftQuerySchema } from '@/lib/validations/scheduling';

/**
 * GET /api/staff/schedules
 * Get staff schedules with filters (aggregated view)
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      staffProfileId: searchParams.get('staffProfileId') ?? undefined,
      locationId: searchParams.get('locationId') ?? undefined,
      shiftType: searchParams.get('shiftType') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = shiftQuerySchema.safeParse(rawParams);

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
      locationId,
      shiftType,
      status,
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
    if (locationId) where.locationId = locationId;
    if (shiftType) where.shiftType = shiftType;
    if (status) where.status = status;

    // Date range filter
    if (startDate || endDate) {
      where.shiftDate = {};
      if (startDate) (where.shiftDate as Record<string, unknown>).gte = startDate;
      if (endDate) (where.shiftDate as Record<string, unknown>).lte = endDate;
    }

    // Get total count
    const total = await db.staffShift.count({ where });

    // Get paginated results with staff profile info
    const items = await db.staffShift.findMany({
      where,
      orderBy: [
        { shiftDate: 'asc' },
        { startTime: 'asc' },
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
            isProvider: true,
            providerType: true,
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
