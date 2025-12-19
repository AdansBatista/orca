import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { updateProviderScheduleSchema } from '@/lib/validations/advanced-scheduling';

/**
 * GET /api/booking/provider-schedules/[providerId]
 * Get all schedules for a specific provider
 */
export const GET = withAuth<{ providerId: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { providerId } = await params;
    const { searchParams } = new URL(req.url);

    // Optional effective date filter
    const effectiveDateStr = searchParams.get('effectiveDate');
    const effectiveDate = effectiveDateStr ? new Date(effectiveDateStr) : undefined;

    // Verify provider exists and belongs to clinic
    const provider = await db.staffProfile.findFirst({
      where: {
        id: providerId,
        ...getClinicFilter(session),
        isProvider: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        title: true,
        providerType: true,
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

    // Build where clause
    const where: Record<string, unknown> = {
      providerId,
      ...getClinicFilter(session),
    };

    // Effective date filter
    if (effectiveDate) {
      where.OR = [
        { effectiveFrom: null, effectiveTo: null },
        {
          AND: [
            { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: effectiveDate } }] },
            { OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveDate } }] },
          ],
        },
      ];
    }

    const schedules = await db.providerSchedule.findMany({
      where,
      orderBy: { dayOfWeek: 'asc' },
    });

    // Create a full week array (0-6) with schedules or defaults
    const weekSchedule = Array.from({ length: 7 }, (_, dayOfWeek) => {
      const existing = schedules.find((s) => s.dayOfWeek === dayOfWeek);
      if (existing) {
        return {
          id: existing.id,
          dayOfWeek,
          startTime: existing.startTime,
          endTime: existing.endTime,
          isWorkingDay: existing.isWorkingDay,
          breaks: existing.breaks,
          lunchStartTime: existing.lunchStartTime,
          lunchEndTime: existing.lunchEndTime,
          autoBlockLunch: existing.autoBlockLunch,
          effectiveFrom: existing.effectiveFrom,
          effectiveTo: existing.effectiveTo,
        };
      }
      // Default non-working for weekends, working for weekdays
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      return {
        id: null,
        dayOfWeek,
        startTime: '08:00',
        endTime: '17:00',
        isWorkingDay: !isWeekend,
        breaks: null,
        lunchStartTime: '12:00',
        lunchEndTime: '13:00',
        autoBlockLunch: true,
        effectiveFrom: null,
        effectiveTo: null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        provider,
        weekSchedule,
      },
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/provider-schedules/[providerId]
 * Update a specific day's schedule for a provider
 */
export const PUT = withAuth<{ providerId: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { providerId } = await params;
    const body = await req.json();

    // dayOfWeek must be in body
    const dayOfWeek = body.dayOfWeek;
    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'dayOfWeek is required and must be 0-6',
          },
        },
        { status: 400 }
      );
    }

    const validationResult = updateProviderScheduleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid schedule data',
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
        id: providerId,
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

    // Find existing schedule for this day
    const existing = await db.providerSchedule.findFirst({
      where: {
        providerId,
        dayOfWeek,
        effectiveFrom: data.effectiveFrom ?? null,
        ...getClinicFilter(session),
      },
    });

    let schedule;
    if (existing) {
      // Update existing
      schedule = await db.providerSchedule.update({
        where: { id: existing.id },
        data: {
          ...data,
          updatedBy: session.user.id,
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
    } else {
      // Create new
      schedule = await db.providerSchedule.create({
        data: {
          clinicId: session.user.clinicId,
          providerId,
          dayOfWeek,
          startTime: data.startTime ?? '08:00',
          endTime: data.endTime ?? '17:00',
          isWorkingDay: data.isWorkingDay ?? true,
          breaks: data.breaks ?? null,
          lunchStartTime: data.lunchStartTime,
          lunchEndTime: data.lunchEndTime,
          autoBlockLunch: data.autoBlockLunch ?? true,
          effectiveFrom: data.effectiveFrom,
          effectiveTo: data.effectiveTo,
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
    }

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  },
  { permissions: ['booking:write'] }
);

/**
 * DELETE /api/booking/provider-schedules/[providerId]
 * Delete all schedules for a provider (or specific day if dayOfWeek query param provided)
 */
export const DELETE = withAuth<{ providerId: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { providerId } = await params;
    const { searchParams } = new URL(req.url);

    const dayOfWeekStr = searchParams.get('dayOfWeek');
    const dayOfWeek = dayOfWeekStr !== null ? parseInt(dayOfWeekStr, 10) : undefined;

    // Verify provider belongs to clinic
    const provider = await db.staffProfile.findFirst({
      where: {
        id: providerId,
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

    // Build where clause
    const where: Record<string, unknown> = {
      providerId,
      ...getClinicFilter(session),
    };

    if (dayOfWeek !== undefined && dayOfWeek >= 0 && dayOfWeek <= 6) {
      where.dayOfWeek = dayOfWeek;
    }

    const result = await db.providerSchedule.deleteMany({
      where,
    });

    return NextResponse.json({
      success: true,
      data: {
        deleted: result.count,
      },
    });
  },
  { permissions: ['booking:write'] }
);
