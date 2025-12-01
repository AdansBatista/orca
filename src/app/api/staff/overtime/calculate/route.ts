import { NextResponse } from 'next/server';
import { z } from 'zod';
import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns';
import { OvertimeStatus } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

const calculateOvertimeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  staffProfileId: z.string().optional(),
  regularHoursThreshold: z.number().min(0).max(60).default(40), // Hours per week before overtime
  createLogs: z.boolean().default(false), // Whether to create OvertimeLog entries
});

interface WeeklyOvertimeCalculation {
  staffProfileId: string;
  staffName: string;
  weekStartDate: string;
  weekEndDate: string;
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
  existingLogId: string | null;
  existingLogStatus: string | null;
}

/**
 * POST /api/staff/overtime/calculate
 * Calculate overtime for a date range
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = calculateOvertimeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid calculation parameters',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { startDate, endDate, staffProfileId, regularHoursThreshold, createLogs } = result.data;

    // Limit to max 3 months
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    if (diffDays > 92) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Date range cannot exceed 3 months',
          },
        },
        { status: 400 }
      );
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

    if (staffProfileId) {
      shiftWhere.staffProfileId = staffProfileId;
    }

    const shifts = await db.staffShift.findMany({
      where: shiftWhere,
      include: {
        staffProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        shiftDate: 'asc',
      },
    });

    // Group shifts by staff and week
    const staffWeeklyHours = new Map<string, Map<string, number>>();
    const staffNames = new Map<string, string>();

    for (const shift of shifts) {
      const staffId = shift.staffProfileId;
      const staffName = `${shift.staffProfile.firstName} ${shift.staffProfile.lastName}`;
      staffNames.set(staffId, staffName);

      // Get the Monday of the week for this shift
      const weekStart = startOfWeek(shift.shiftDate, { weekStartsOn: 1 }); // Monday
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      if (!staffWeeklyHours.has(staffId)) {
        staffWeeklyHours.set(staffId, new Map());
      }

      const staffWeeks = staffWeeklyHours.get(staffId)!;
      const currentHours = staffWeeks.get(weekKey) || 0;

      // Calculate hours for this shift (use actual if available, otherwise scheduled)
      const hours = shift.actualHours ?? shift.scheduledHours;
      staffWeeks.set(weekKey, currentHours + hours);
    }

    // Get existing overtime logs for this period
    const existingLogs = await db.overtimeLog.findMany({
      where: {
        ...getClinicFilter(session),
        weekStartDate: {
          gte: startOfWeek(startDate, { weekStartsOn: 1 }),
          lte: endOfWeek(endDate, { weekStartsOn: 1 }),
        },
        ...(staffProfileId ? { staffProfileId } : {}),
      },
    });

    const existingLogMap = new Map<string, typeof existingLogs[0]>();
    for (const log of existingLogs) {
      const key = `${log.staffProfileId}|${format(log.weekStartDate, 'yyyy-MM-dd')}`;
      existingLogMap.set(key, log);
    }

    // Calculate overtime
    const calculations: WeeklyOvertimeCalculation[] = [];
    const newLogs: Array<{
      staffProfileId: string;
      weekStartDate: Date;
      weekEndDate: Date;
      regularHours: number;
      overtimeHours: number;
      totalHours: number;
      status: OvertimeStatus;
      clinicId: string;
    }> = [];

    for (const [staffId, weeklyHours] of staffWeeklyHours.entries()) {
      for (const [weekKey, totalHours] of weeklyHours.entries()) {
        const weekStart = parseISO(weekKey);
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });

        const regularHours = Math.min(totalHours, regularHoursThreshold);
        const overtimeHours = Math.max(0, totalHours - regularHoursThreshold);

        const existingLogKey = `${staffId}|${weekKey}`;
        const existingLog = existingLogMap.get(existingLogKey);

        calculations.push({
          staffProfileId: staffId,
          staffName: staffNames.get(staffId) || 'Unknown',
          weekStartDate: weekKey,
          weekEndDate: format(weekEnd, 'yyyy-MM-dd'),
          regularHours,
          overtimeHours,
          totalHours,
          existingLogId: existingLog?.id || null,
          existingLogStatus: existingLog?.status || null,
        });

        // If createLogs is true and there's overtime and no existing log
        if (createLogs && overtimeHours > 0 && !existingLog) {
          newLogs.push({
            staffProfileId: staffId,
            weekStartDate: weekStart,
            weekEndDate: weekEnd,
            regularHours,
            overtimeHours,
            totalHours,
            status: OvertimeStatus.PENDING,
            clinicId: session.user.clinicId,
          });
        }
      }
    }

    // Create new logs if requested
    let createdCount = 0;
    if (createLogs && newLogs.length > 0) {
      await db.overtimeLog.createMany({
        data: newLogs,
      });
      createdCount = newLogs.length;

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'CREATE',
        entity: 'OvertimeLog',
        entityId: 'batch',
        details: {
          count: createdCount,
          dateRange: `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`,
        },
        ipAddress,
        userAgent,
      });
    }

    // Calculate summary
    const summary = {
      totalStaff: staffWeeklyHours.size,
      totalWeeks: calculations.length,
      totalRegularHours: calculations.reduce((sum, c) => sum + c.regularHours, 0),
      totalOvertimeHours: calculations.reduce((sum, c) => sum + c.overtimeHours, 0),
      staffWithOvertime: calculations.filter(c => c.overtimeHours > 0).length,
      newLogsCreated: createdCount,
    };

    return NextResponse.json({
      success: true,
      data: {
        calculations: calculations.sort((a, b) => {
          // Sort by overtime hours descending, then by staff name
          if (b.overtimeHours !== a.overtimeHours) {
            return b.overtimeHours - a.overtimeHours;
          }
          return a.staffName.localeCompare(b.staffName);
        }),
        summary,
      },
    });
  },
  { permissions: ['schedule:view', 'schedule:edit', 'schedule:full'] }
);
