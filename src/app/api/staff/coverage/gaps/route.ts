import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

// Query schema for coverage gap analysis
const coverageGapQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  locationId: z.string().optional(),
  department: z.string().optional(),
});

interface CoverageGap {
  date: string;
  dayOfWeek: number;
  timeSlot: string | null;
  requirementId: string;
  requirementName: string;
  locationId: string;
  department: string | null;
  providerType: string | null;
  required: number;
  scheduled: number;
  gap: number;
  isCritical: boolean;
  priority: number;
}

interface CoverageStatus {
  date: string;
  gaps: CoverageGap[];
  totalGaps: number;
  criticalGaps: number;
}

/**
 * GET /api/staff/coverage/gaps
 * Analyze coverage gaps for a date range
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      locationId: searchParams.get('locationId') ?? undefined,
      department: searchParams.get('department') ?? undefined,
    };

    const queryResult = coverageGapQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters. startDate and endDate are required.',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { startDate, endDate, locationId, department } = queryResult.data;

    // Limit to max 31 days
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 31) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Date range cannot exceed 31 days',
          },
        },
        { status: 400 }
      );
    }

    // Get coverage requirements
    const requirementWhere: Record<string, unknown> = {
      ...getClinicFilter(session),
      isActive: true,
    };
    if (locationId) requirementWhere.locationId = locationId;
    if (department) requirementWhere.department = department;

    const requirements = await db.coverageRequirement.findMany({
      where: requirementWhere,
    });

    if (requirements.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          gaps: [],
          summary: {
            totalDays: Math.ceil(diffDays) + 1,
            daysWithGaps: 0,
            totalGaps: 0,
            criticalGaps: 0,
          },
        },
      });
    }

    // Get all shifts in the date range
    const shiftWhere: Record<string, unknown> = {
      ...getClinicFilter(session),
      shiftDate: {
        gte: startDate,
        lte: endDate,
      },
      status: {
        in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'],
      },
    };
    if (locationId) shiftWhere.locationId = locationId;

    const shifts = await db.staffShift.findMany({
      where: shiftWhere,
      include: {
        staffProfile: {
          select: {
            id: true,
            department: true,
            providerType: true,
          },
        },
      },
    });

    // Build a map of shifts by date, location, department, providerType
    const shiftMap = new Map<string, typeof shifts>();
    for (const shift of shifts) {
      const dateStr = shift.shiftDate.toISOString().split('T')[0];
      const key = `${dateStr}|${shift.locationId}|${shift.staffProfile?.department || 'ANY'}|${shift.staffProfile?.providerType || 'ANY'}`;

      if (!shiftMap.has(key)) {
        shiftMap.set(key, []);
      }
      shiftMap.get(key)!.push(shift);
    }

    // Analyze coverage for each day
    const coverageByDate: CoverageStatus[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();
      const gaps: CoverageGap[] = [];

      for (const requirement of requirements) {
        // Check if requirement applies to this day
        if (requirement.dayOfWeek !== null && requirement.dayOfWeek !== dayOfWeek) {
          continue;
        }

        // Count scheduled staff matching this requirement
        let scheduledCount = 0;

        // Look for shifts matching this requirement
        for (const [key, dayShifts] of shiftMap.entries()) {
          const [shiftDateStr, shiftLocationId, shiftDept, shiftProviderType] = key.split('|');

          if (shiftDateStr !== dateStr) continue;
          if (shiftLocationId !== requirement.locationId) continue;

          // Check department match
          if (requirement.department && shiftDept !== requirement.department && shiftDept !== 'ANY') {
            continue;
          }

          // Check provider type match
          if (requirement.providerType && shiftProviderType !== requirement.providerType && shiftProviderType !== 'ANY') {
            continue;
          }

          // Count shifts that overlap with requirement time slot
          for (const shift of dayShifts) {
            // If requirement has specific time slots, check overlap
            if (requirement.startTime && requirement.endTime) {
              const reqStart = parseTimeToMinutes(requirement.startTime);
              const reqEnd = parseTimeToMinutes(requirement.endTime);
              const shiftStart = shift.startTime.getHours() * 60 + shift.startTime.getMinutes();
              const shiftEnd = shift.endTime.getHours() * 60 + shift.endTime.getMinutes();

              // Check if there's overlap
              if (shiftStart < reqEnd && shiftEnd > reqStart) {
                scheduledCount++;
              }
            } else {
              // No specific time slot, count all shifts for this day
              scheduledCount++;
            }
          }
        }

        // Calculate gap
        const gap = requirement.minimumStaff - scheduledCount;

        if (gap > 0) {
          gaps.push({
            date: dateStr,
            dayOfWeek,
            timeSlot: requirement.startTime && requirement.endTime
              ? `${requirement.startTime}-${requirement.endTime}`
              : null,
            requirementId: requirement.id,
            requirementName: requirement.name,
            locationId: requirement.locationId,
            department: requirement.department,
            providerType: requirement.providerType,
            required: requirement.minimumStaff,
            scheduled: scheduledCount,
            gap,
            isCritical: requirement.isCritical,
            priority: requirement.priority,
          });
        }
      }

      if (gaps.length > 0) {
        coverageByDate.push({
          date: dateStr,
          gaps,
          totalGaps: gaps.reduce((sum, g) => sum + g.gap, 0),
          criticalGaps: gaps.filter(g => g.isCritical).reduce((sum, g) => sum + g.gap, 0),
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate summary
    const summary = {
      totalDays: Math.ceil(diffDays) + 1,
      daysWithGaps: coverageByDate.length,
      totalGaps: coverageByDate.reduce((sum, d) => sum + d.totalGaps, 0),
      criticalGaps: coverageByDate.reduce((sum, d) => sum + d.criticalGaps, 0),
    };

    return NextResponse.json({
      success: true,
      data: {
        gaps: coverageByDate,
        summary,
      },
    });
  },
  { permissions: ['schedule:view', 'schedule:edit', 'schedule:full'] }
);

/**
 * Parse time string "HH:mm" to minutes since midnight
 */
function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
