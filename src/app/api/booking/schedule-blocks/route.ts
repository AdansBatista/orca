import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import {
  scheduleBlockQuerySchema,
  createScheduleBlockSchema,
} from '@/lib/validations/advanced-scheduling';

/**
 * GET /api/booking/schedule-blocks
 * List schedule blocks with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      providerId: searchParams.get('providerId') ?? undefined,
      providerIds: searchParams.get('providerIds') ?? undefined,
      blockType: searchParams.get('blockType') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = scheduleBlockQuerySchema.safeParse(rawParams);

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
      providerId,
      providerIds,
      blockType,
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

    // Provider filter
    if (providerId) {
      where.providerId = providerId;
    } else if (providerIds && providerIds.length > 0) {
      where.providerId = { in: providerIds };
    }

    // Block type filter
    if (blockType) {
      where.blockType = blockType;
    }

    // Status filter (default to ACTIVE if not specified)
    if (status) {
      where.status = status;
    } else {
      where.status = { in: ['ACTIVE', 'APPROVED'] };
    }

    // Date range filter - blocks that overlap with the requested range
    if (startDate || endDate) {
      const dateFilters: Record<string, unknown>[] = [];
      if (startDate) {
        dateFilters.push({ endDateTime: { gte: startDate } });
      }
      if (endDate) {
        dateFilters.push({ startDateTime: { lte: endDate } });
      }
      if (dateFilters.length > 0) {
        where.AND = dateFilters;
      }
    }

    // Count total
    const total = await db.scheduleBlock.count({ where });

    // Fetch blocks
    const blocks = await db.scheduleBlock.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
      orderBy: { startDateTime: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: blocks,
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
 * POST /api/booking/schedule-blocks
 * Create a schedule block
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();
    const validationResult = createScheduleBlockSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid schedule block data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify provider exists and belongs to clinic
    const provider = await db.staffProfile.findFirst({
      where: {
        id: data.providerId,
        ...getClinicFilter(session),
        isProvider: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROVIDER_NOT_FOUND',
            message: 'Provider not found',
          },
        },
        { status: 404 }
      );
    }

    // Check for overlapping blocks
    const overlapping = await db.scheduleBlock.findFirst({
      where: {
        providerId: data.providerId,
        status: { in: ['ACTIVE', 'APPROVED'] },
        ...getClinicFilter(session),
        AND: [
          { startDateTime: { lt: data.endDateTime } },
          { endDateTime: { gt: data.startDateTime } },
        ],
      },
    });

    if (overlapping) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OVERLAP_CONFLICT',
            message: 'This time block overlaps with an existing block',
            details: {
              existingBlockId: overlapping.id,
              existingBlockTitle: overlapping.title,
            },
          },
        },
        { status: 409 }
      );
    }

    // Check for affected appointments if block is in the future
    let affectedAppointments: { id: string; patientId: string; startTime: Date }[] = [];
    if (data.notifyPatients && data.startDateTime > new Date()) {
      affectedAppointments = await db.appointment.findMany({
        where: {
          providerId: data.providerId,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          ...getClinicFilter(session),
          AND: [
            { startTime: { gte: data.startDateTime } },
            { startTime: { lt: data.endDateTime } },
          ],
        },
        select: {
          id: true,
          patientId: true,
          startTime: true,
        },
      });
    }

    // Determine if this block requires approval (e.g., vacation, personal time)
    const requiresApproval = ['VACATION', 'PERSONAL', 'SICK_LEAVE'].includes(data.blockType);

    // Create block
    const block = await db.scheduleBlock.create({
      data: {
        clinicId: session.user.clinicId,
        providerId: data.providerId,
        title: data.title,
        blockType: data.blockType,
        reason: data.reason,
        startDateTime: data.startDateTime,
        endDateTime: data.endDateTime,
        allDay: data.allDay,
        isRecurring: data.isRecurring,
        recurrenceRule: data.recurrenceRule,
        status: requiresApproval ? 'PENDING_APPROVAL' : 'ACTIVE',
        requiresApproval,
        notifyPatients: data.notifyPatients,
        createdBy: session.user.id,
      },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          block,
          affectedAppointments: affectedAppointments.length,
        },
      },
      { status: 201 }
    );
  },
  { permissions: ['booking:write'] }
);
