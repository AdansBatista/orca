import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { overtimeQuerySchema } from '@/lib/validations/scheduling';

/**
 * GET /api/staff/overtime
 * List overtime logs with filters
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      staffProfileId: searchParams.get('staffProfileId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = overtimeQuerySchema.safeParse(rawParams);

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

    const { staffProfileId, status, startDate, endDate, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (staffProfileId) where.staffProfileId = staffProfileId;
    if (status) where.status = status;

    // Date range filter on weekStartDate
    if (startDate || endDate) {
      where.weekStartDate = {};
      if (startDate) (where.weekStartDate as Record<string, unknown>).gte = startDate;
      if (endDate) (where.weekStartDate as Record<string, unknown>).lte = endDate;
    }

    // Get total count
    const total = await db.overtimeLog.count({ where });

    // Get paginated results with staff profile info
    const items = await db.overtimeLog.findMany({
      where,
      orderBy: [
        { weekStartDate: 'desc' },
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
