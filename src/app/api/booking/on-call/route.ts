import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { createOnCallSchema, onCallQuerySchema } from '@/lib/validations/emergency-reminders';

/**
 * GET /api/booking/on-call
 * List on-call schedules with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = onCallQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      providerId,
      type,
      status,
      startDate,
      endDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = validationResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (providerId) where.providerId = providerId;
    if (type) where.type = type;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.startDate = {};
      if (startDate) (where.startDate as Record<string, Date>).gte = startDate;
      if (endDate) (where.startDate as Record<string, Date>).lte = endDate;
    }

    // Get total count
    const total = await db.onCallSchedule.count({ where });

    // Build order by
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    // Get paginated results
    const schedules = await db.onCallSchedule.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: schedules,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * POST /api/booking/on-call
 * Create a new on-call schedule
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const validationResult = createOnCallSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid on-call data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check for overlapping schedules for the same provider
    const overlapping = await db.onCallSchedule.findFirst({
      where: {
        clinicId: session.user.clinicId,
        providerId: data.providerId,
        status: { in: ['SCHEDULED', 'ACTIVE'] },
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

    if (overlapping) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OVERLAP_ERROR',
            message: 'Provider already has an on-call schedule during this period',
          },
        },
        { status: 400 }
      );
    }

    const schedule = await db.onCallSchedule.create({
      data: {
        ...data,
        clinicId: session.user.clinicId,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  },
  { permissions: ['booking:write'] }
);
