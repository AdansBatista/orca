import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { eachDayOfInterval, getDay, format, parse, addMinutes } from 'date-fns';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * Booking zone event for FullCalendar background display
 */
interface BookingZoneEvent {
  id: string;
  start: string;
  end: string;
  display: 'background';
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    type: 'booking-zone';
    templateId: string;
    templateName: string;
    appointmentTypeIds: string[];
    appointmentTypeNames: string[];
    isBlocked: boolean;
    blockReason: string | null;
    label: string | null;
  };
}

/**
 * GET /api/booking/calendar/zones
 * Get booking zones for calendar display (as background events)
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const startDateStr = searchParams.get('startDate') ?? searchParams.get('start');
    const endDateStr = searchParams.get('endDate') ?? searchParams.get('end');
    const providerId = searchParams.get('providerId') ?? undefined;

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'startDate and endDate are required',
          },
        },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Build where clause for template applications
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
      OR: [
        {
          // Applications that overlap with the requested range
          dateRangeStart: { lte: endDate },
          dateRangeEnd: { gte: startDate },
        },
        {
          // Single-day applications
          appliedDate: { gte: startDate, lte: endDate },
          dateRangeStart: null,
        },
      ],
    };

    if (providerId) {
      where.providerId = providerId;
    }

    // Fetch template applications that cover the date range
    const applications = await db.templateApplication.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
            slots: true,
            color: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
    });

    // Fetch appointment types for color/name lookup
    const appointmentTypes = await db.appointmentType.findMany({
      where: getClinicFilter(session),
      select: {
        id: true,
        name: true,
        color: true,
      },
    });

    const typeMap = new Map(appointmentTypes.map((t) => [t.id, t]));

    // Generate zone events
    const zones: BookingZoneEvent[] = [];
    const processedDays = new Set<string>(); // Track which days we've already processed

    for (const application of applications) {
      const appStartDate = application.dateRangeStart || application.appliedDate;
      const appEndDate = application.dateRangeEnd || application.appliedDate;

      // Get days in this application's range that overlap with requested range
      const effectiveStart = appStartDate > startDate ? appStartDate : startDate;
      const effectiveEnd = appEndDate < endDate ? appEndDate : endDate;

      if (effectiveStart > effectiveEnd) continue;

      const daysInRange = eachDayOfInterval({
        start: effectiveStart,
        end: effectiveEnd,
      });

      const blocks = (application.template.slots as Array<{
        id: string;
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        appointmentTypeIds?: string[];
        isBlocked?: boolean;
        blockReason?: string | null;
        label?: string | null;
        color?: string | null;
      }>) || [];

      for (const day of daysInRange) {
        const dayKey = format(day, 'yyyy-MM-dd');
        const dayOfWeek = getDay(day);

        // Skip if we've already processed this day (from a more recent application)
        if (processedDays.has(dayKey)) continue;

        const blocksForDay = blocks.filter((b) => b.dayOfWeek === dayOfWeek);

        for (const block of blocksForDay) {
          // Parse times and create datetime
          const startTime = parse(block.startTime, 'HH:mm', day);
          const endTime = parse(block.endTime, 'HH:mm', day);

          // Determine color - use higher opacity for better visibility
          let backgroundColor = '#3B82F650'; // Default blue with ~31% opacity
          let borderColor = '#3B82F6';
          if (block.color) {
            backgroundColor = `${block.color}50`; // ~31% opacity for good visibility
            borderColor = block.color;
          } else if (block.isBlocked) {
            backgroundColor = '#6B728060'; // Gray for blocked with higher opacity
            borderColor = '#6B7280';
          } else if (block.appointmentTypeIds && block.appointmentTypeIds.length > 0) {
            const firstType = typeMap.get(block.appointmentTypeIds[0]);
            if (firstType?.color) {
              backgroundColor = `${firstType.color}50`;
              borderColor = firstType.color;
            }
          }

          // Get appointment type names
          const appointmentTypeNames = (block.appointmentTypeIds || [])
            .map((id) => typeMap.get(id)?.name)
            .filter((name): name is string => !!name);

          zones.push({
            id: `zone-${application.id}-${block.id || dayKey}-${block.startTime}`,
            start: startTime.toISOString(),
            end: endTime.toISOString(),
            display: 'background',
            backgroundColor,
            borderColor,
            extendedProps: {
              type: 'booking-zone',
              templateId: application.template.id,
              templateName: application.template.name,
              appointmentTypeIds: block.appointmentTypeIds || [],
              appointmentTypeNames,
              isBlocked: block.isBlocked || false,
              blockReason: block.blockReason || null,
              label: block.label || null,
            },
          });
        }

        // Mark this day as processed
        processedDays.add(dayKey);
      }
    }

    return NextResponse.json({
      success: true,
      data: zones,
    });
  },
  { permissions: ['booking:read'] }
);
