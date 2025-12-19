import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import {
  providerScheduleQuerySchema,
  bulkUpdateProviderScheduleSchema,
} from '@/lib/validations/advanced-scheduling';

/**
 * GET /api/booking/provider-schedules
 * List provider schedules with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      providerId: searchParams.get('providerId') ?? undefined,
      providerIds: searchParams.get('providerIds') ?? undefined,
      dayOfWeek: searchParams.get('dayOfWeek') ?? undefined,
      effectiveDate: searchParams.get('effectiveDate') ?? undefined,
      includeNonWorking: searchParams.get('includeNonWorking') ?? undefined,
    };

    const queryResult = providerScheduleQuerySchema.safeParse(rawParams);

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
      dayOfWeek,
      effectiveDate,
      includeNonWorking,
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

    // Day of week filter
    if (dayOfWeek !== undefined) {
      where.dayOfWeek = dayOfWeek;
    }

    // Effective date filter - get schedules effective on a specific date
    if (effectiveDate) {
      where.OR = [
        // No effective date range (always effective)
        { effectiveFrom: null, effectiveTo: null },
        // Effective date range includes the query date
        {
          AND: [
            { OR: [{ effectiveFrom: null }, { effectiveFrom: { lte: effectiveDate } }] },
            { OR: [{ effectiveTo: null }, { effectiveTo: { gte: effectiveDate } }] },
          ],
        },
      ];
    }

    // Non-working day filter
    if (!includeNonWorking) {
      where.isWorkingDay = true;
    }

    // Fetch schedules
    const schedules = await db.providerSchedule.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            providerType: true,
          },
        },
      },
      orderBy: [
        { providerId: 'asc' },
        { dayOfWeek: 'asc' },
      ],
    });

    // Group schedules by provider
    const groupedByProvider = schedules.reduce((acc, schedule) => {
      const providerId = schedule.providerId;
      if (!acc[providerId]) {
        acc[providerId] = {
          provider: schedule.provider,
          schedules: [],
        };
      }
      acc[providerId].schedules.push({
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isWorkingDay: schedule.isWorkingDay,
        breaks: schedule.breaks,
        lunchStartTime: schedule.lunchStartTime,
        lunchEndTime: schedule.lunchEndTime,
        autoBlockLunch: schedule.autoBlockLunch,
        effectiveFrom: schedule.effectiveFrom,
        effectiveTo: schedule.effectiveTo,
      });
      return acc;
    }, {} as Record<string, { provider: typeof schedules[0]['provider']; schedules: unknown[] }>);

    return NextResponse.json({
      success: true,
      data: {
        items: schedules,
        grouped: Object.values(groupedByProvider),
      },
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * POST /api/booking/provider-schedules
 * Bulk create/update provider schedules for a week
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();
    const validationResult = bulkUpdateProviderScheduleSchema.safeParse(body);

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

    const { providerId, schedules, effectiveFrom, effectiveTo } = validationResult.data;

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
            message: 'Provider not found or not a valid provider',
          },
        },
        { status: 404 }
      );
    }

    // Normalize effectiveFrom to null if undefined (for consistent MongoDB queries)
    const normalizedEffectiveFrom = effectiveFrom ?? null;

    // Upsert each day's schedule
    const results = await Promise.all(
      schedules.map(async (schedule) => {
        // Try to find existing schedule for this day
        // Handle MongoDB null semantics: check both isSet: false and null value
        const whereClause: Record<string, unknown> = {
          providerId,
          dayOfWeek: schedule.dayOfWeek,
          ...getClinicFilter(session),
        };

        // For null effectiveFrom, match records where field is unset or explicitly null
        if (normalizedEffectiveFrom === null) {
          whereClause.OR = [
            { effectiveFrom: { isSet: false } },
            { effectiveFrom: null },
          ];
        } else {
          // For non-null values, just match directly
          whereClause.effectiveFrom = normalizedEffectiveFrom;
        }

        const existing = await db.providerSchedule.findFirst({
          where: whereClause,
        });

        if (existing) {
          // Update existing
          return db.providerSchedule.update({
            where: { id: existing.id },
            data: {
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              isWorkingDay: schedule.isWorkingDay,
              breaks: schedule.breaks ?? null,
              lunchStartTime: schedule.lunchStartTime,
              lunchEndTime: schedule.lunchEndTime,
              autoBlockLunch: schedule.autoBlockLunch,
              effectiveTo: effectiveTo ?? null,
              updatedBy: session.user.id,
            },
          });
        } else {
          // Create new
          return db.providerSchedule.create({
            data: {
              clinicId: session.user.clinicId,
              providerId,
              dayOfWeek: schedule.dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              isWorkingDay: schedule.isWorkingDay,
              breaks: schedule.breaks ?? null,
              lunchStartTime: schedule.lunchStartTime,
              lunchEndTime: schedule.lunchEndTime,
              autoBlockLunch: schedule.autoBlockLunch,
              effectiveFrom: normalizedEffectiveFrom,
              effectiveTo: effectiveTo ?? null,
              createdBy: session.user.id,
            },
          });
        }
      })
    );

    // Fetch complete schedules with provider info
    // Use same MongoDB null handling as above
    const fetchWhereClause: Record<string, unknown> = {
      providerId,
      ...getClinicFilter(session),
    };

    if (normalizedEffectiveFrom === null) {
      fetchWhereClause.OR = [
        { effectiveFrom: { isSet: false } },
        { effectiveFrom: null },
      ];
    } else {
      fetchWhereClause.effectiveFrom = normalizedEffectiveFrom;
    }

    const updatedSchedules = await db.providerSchedule.findMany({
      where: fetchWhereClause,
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
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        updated: results.length,
        schedules: updatedSchedules,
      },
    });
  },
  { permissions: ['booking:write'] }
);
