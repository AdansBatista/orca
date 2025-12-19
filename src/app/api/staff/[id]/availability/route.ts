import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createAvailabilitySchema, availabilityQuerySchema } from '@/lib/validations/scheduling';
import { withSoftDelete } from '@/lib/db/soft-delete';

/**
 * GET /api/staff/:id/availability
 * Get availability for a specific staff member
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: staffProfileId } = await context.params;
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      availabilityType: searchParams.get('availabilityType') ?? undefined,
      isRecurring: searchParams.get('isRecurring') ?? undefined,
      dayOfWeek: searchParams.get('dayOfWeek') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
    };

    const queryResult = availabilityQuerySchema.safeParse(rawParams);

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

    const { availabilityType, isRecurring, dayOfWeek, startDate, endDate, isActive } = queryResult.data;

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

    if (availabilityType) where.availabilityType = availabilityType;
    if (isRecurring !== undefined) where.isRecurring = isRecurring;
    if (dayOfWeek !== undefined) where.dayOfWeek = dayOfWeek;
    if (isActive !== undefined) where.isActive = isActive;

    // Date range filter for specific dates
    if (startDate || endDate) {
      where.OR = [
        // Recurring availability (always relevant)
        { isRecurring: true },
        // Specific date availability within range
        {
          AND: [
            { isRecurring: false },
            ...(startDate ? [{ specificDate: { gte: startDate } }] : []),
            ...(endDate ? [{ specificDate: { lte: endDate } }] : []),
          ],
        },
      ];
    }

    const items = await db.staffAvailability.findMany({
      where,
      orderBy: [
        { isRecurring: 'desc' },
        { dayOfWeek: 'asc' },
        { specificDate: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  },
  { permissions: ['schedule:view', 'schedule:edit', 'schedule:full'] }
);

/**
 * POST /api/staff/:id/availability
 * Create availability for a staff member
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: staffProfileId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createAvailabilitySchema.safeParse({ ...body, staffProfileId });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid availability data',
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

    // Create the availability
    const availability = await db.staffAvailability.create({
      data: {
        ...data,
        clinicId: session.user.clinicId,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'StaffAvailability',
      entityId: availability.id,
      details: {
        staffProfileId,
        availabilityType: data.availabilityType,
        isRecurring: data.isRecurring,
        dayOfWeek: data.dayOfWeek,
        specificDate: data.specificDate,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: availability },
      { status: 201 }
    );
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);
