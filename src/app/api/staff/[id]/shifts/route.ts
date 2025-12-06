import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createShiftSchema, shiftQuerySchema } from '@/lib/validations/scheduling';
import { withSoftDelete } from '@/lib/db/soft-delete';

/**
 * GET /api/staff/:id/shifts
 * Get shifts for a specific staff member
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id: staffProfileId } = await context.params;
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
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

    const { shiftType, status, startDate, endDate, page, pageSize } = queryResult.data;

    // Verify staff profile exists and belongs to clinic
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

    // Get paginated results
    const items = await db.staffShift.findMany({
      where,
      orderBy: [
        { shiftDate: 'asc' },
        { startTime: 'asc' },
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
 * POST /api/staff/:id/shifts
 * Create a new shift for a staff member
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id: staffProfileId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createShiftSchema.safeParse({ ...body, staffProfileId });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid shift data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify staff profile exists and belongs to clinic
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

    // Check for overlapping shifts
    const startOfDay = new Date(data.shiftDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(data.shiftDate);
    endOfDay.setHours(23, 59, 59, 999);

    const overlappingShift = await db.staffShift.findFirst({
      where: {
        staffProfileId,
        clinicId: session.user.clinicId,
        shiftDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { notIn: ['CANCELLED'] },
        OR: [
          {
            // New shift starts during existing shift
            AND: [
              { startTime: { lte: data.startTime } },
              { endTime: { gt: data.startTime } },
            ],
          },
          {
            // New shift ends during existing shift
            AND: [
              { startTime: { lt: data.endTime } },
              { endTime: { gte: data.endTime } },
            ],
          },
          {
            // New shift contains existing shift
            AND: [
              { startTime: { gte: data.startTime } },
              { endTime: { lte: data.endTime } },
            ],
          },
        ],
      },
    });

    if (overlappingShift) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SHIFT_OVERLAP',
            message: 'This shift overlaps with an existing shift',
            details: { existingShiftId: overlappingShift.id },
          },
        },
        { status: 409 }
      );
    }

    // Check for cross-location conflicts (different clinic, same time)
    // This is a warning, not a blocker
    let crossLocationWarning: string | null = null;

    // Get all clinic IDs the staff member is associated with
    if (staffProfile.clinicIds && staffProfile.clinicIds.length > 1) {
      const otherClinicIds = staffProfile.clinicIds.filter(
        (id: string) => id !== session.user.clinicId
      );

      if (otherClinicIds.length > 0) {
        const crossLocationShift = await db.staffShift.findFirst({
          where: {
            staffProfileId,
            clinicId: { in: otherClinicIds },
            shiftDate: {
              gte: startOfDay,
              lte: endOfDay,
            },
            status: { notIn: ['CANCELLED'] },
            OR: [
              {
                AND: [
                  { startTime: { lte: data.startTime } },
                  { endTime: { gt: data.startTime } },
                ],
              },
              {
                AND: [
                  { startTime: { lt: data.endTime } },
                  { endTime: { gte: data.endTime } },
                ],
              },
              {
                AND: [
                  { startTime: { gte: data.startTime } },
                  { endTime: { lte: data.endTime } },
                ],
              },
            ],
          },
        });

        if (crossLocationShift) {
          // Get the clinic name for the warning message
          const otherClinic = await db.clinic.findUnique({
            where: { id: crossLocationShift.clinicId },
            select: { name: true },
          });
          crossLocationWarning = `Warning: Staff member has an overlapping shift at ${otherClinic?.name || 'another location'}`;
        }
      }
    }

    // Calculate scheduled hours
    const startTime = new Date(data.startTime);
    const endTime = new Date(data.endTime);
    const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const scheduledHours = (totalMinutes - data.breakMinutes) / 60;

    // Create the shift
    const shift = await db.staffShift.create({
      data: {
        ...data,
        scheduledHours,
        clinicId: session.user.clinicId,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'StaffShift',
      entityId: shift.id,
      details: {
        staffProfileId,
        shiftDate: data.shiftDate,
        shiftType: data.shiftType,
        scheduledHours,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: shift,
        ...(crossLocationWarning && { warnings: [crossLocationWarning] }),
      },
      { status: 201 }
    );
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);
