import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createBlackoutDateSchema, blackoutDateQuerySchema } from '@/lib/validations/scheduling';

/**
 * GET /api/staff/blackout-dates
 * List all blackout dates for the clinic
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      restrictionType: searchParams.get('restrictionType') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = blackoutDateQuerySchema.safeParse(rawParams);

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

    const { restrictionType, isActive, startDate, endDate, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (restrictionType) where.restrictionType = restrictionType;
    if (typeof isActive === 'boolean') where.isActive = isActive;

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
    const total = await db.blackoutDate.count({ where });

    // Get paginated results
    const items = await db.blackoutDate.findMany({
      where,
      orderBy: [{ startDate: 'asc' }],
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
 * POST /api/staff/blackout-dates
 * Create a new blackout date
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createBlackoutDateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid blackout date data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for overlapping blackout dates of the same type
    const overlapping = await db.blackoutDate.findFirst({
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

    if (overlapping) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BLACKOUT_OVERLAP',
            message: 'This blackout date overlaps with an existing blackout period',
            details: {
              existingId: overlapping.id,
              existingName: overlapping.name,
            },
          },
        },
        { status: 409 }
      );
    }

    // Create the blackout date
    const blackoutDate = await db.blackoutDate.create({
      data: {
        ...data,
        clinicId: session.user.clinicId,
        createdBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'BlackoutDate',
      entityId: blackoutDate.id,
      details: {
        name: blackoutDate.name,
        restrictionType: blackoutDate.restrictionType,
        startDate: blackoutDate.startDate,
        endDate: blackoutDate.endDate,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: blackoutDate },
      { status: 201 }
    );
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);
