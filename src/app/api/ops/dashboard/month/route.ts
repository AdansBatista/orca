import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { monthDashboardQuerySchema } from '@/lib/validations/ops';

/**
 * GET /api/ops/dashboard/month
 * Get month view dashboard data with daily summary cards
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse and validate query params
    const result = monthDashboardQuerySchema.safeParse({
      month: searchParams.get('month') || undefined,
      year: searchParams.get('year') || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const month = result.data.month ?? now.getMonth() + 1; // 1-indexed
    const year = result.data.year ?? now.getFullYear();

    // Calculate month boundaries
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month, 1);

    const clinicFilter = getClinicFilter(session);

    // Build appointment filter with standardized soft delete
    const appointmentWhere = withSoftDelete({
      ...clinicFilter,
      startTime: {
        gte: startDate,
        lt: endDate,
      },
    });

    // Fetch appointments for the month
    const appointments = await db.appointment.findMany({
      where: appointmentWhere,
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        appointmentType: {
          select: {
            id: true,
            name: true,
            code: true,
            color: true,
          },
        },
        patientFlowState: {
          select: {
            stage: true,
            completedAt: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Get number of days in the month
    const daysInMonth = new Date(year, month, 0).getDate();

    // Organize appointments by day
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(year, month - 1, day);
      const nextDay = new Date(year, month - 1, day + 1);

      const dayAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= dayDate && aptDate < nextDay;
      });

      // Calculate day stats
      const stats = {
        scheduled: dayAppointments.length,
        completed: dayAppointments.filter((a) => a.status === 'COMPLETED').length,
        cancelled: dayAppointments.filter((a) => a.status === 'CANCELLED').length,
        noShow: dayAppointments.filter((a) => a.status === 'NO_SHOW').length,
      };

      // Determine day status for coloring
      let status: 'empty' | 'light' | 'normal' | 'busy' | 'full' = 'empty';
      if (stats.scheduled === 0) {
        status = 'empty';
      } else if (stats.scheduled <= 5) {
        status = 'light';
      } else if (stats.scheduled <= 15) {
        status = 'normal';
      } else if (stats.scheduled <= 25) {
        status = 'busy';
      } else {
        status = 'full';
      }

      days.push({
        date: dayDate.toISOString().split('T')[0],
        day,
        dayOfWeek: dayDate.getDay(),
        isToday: isSameDay(dayDate, now),
        isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
        isPast: dayDate < new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        stats,
        status,
      });
    }

    // Calculate month summary
    const monthSummary = {
      totalScheduled: appointments.length,
      totalCompleted: appointments.filter((a) => a.status === 'COMPLETED').length,
      totalCancelled: appointments.filter((a) => a.status === 'CANCELLED').length,
      totalNoShow: appointments.filter((a) => a.status === 'NO_SHOW').length,
      avgPerDay: Math.round(appointments.length / daysInMonth),
      busiestDay: findBusiestDay(days),
      completionRate: appointments.length > 0
        ? Math.round((appointments.filter((a) => a.status === 'COMPLETED').length / appointments.length) * 100)
        : 0,
    };

    // Calculate weekly totals for trends
    const weeklyTrends = calculateWeeklyTrends(days);

    // Get providers active this month
    const providersThisMonth = await db.staffProfile.findMany({
      where: {
        ...clinicFilter,
        id: {
          in: [...new Set(appointments.map((a) => a.providerId))],
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        providerType: true,
      },
    });

    // Calculate provider-level stats
    const providerStats = providersThisMonth.map((provider) => {
      const providerApts = appointments.filter((a) => a.providerId === provider.id);
      return {
        provider,
        scheduled: providerApts.length,
        completed: providerApts.filter((a) => a.status === 'COMPLETED').length,
        cancelled: providerApts.filter((a) => a.status === 'CANCELLED').length,
        avgPerDay: Math.round(providerApts.length / daysInMonth * 10) / 10,
      };
    });

    // Get appointment type distribution
    const appointmentTypeStats = getAppointmentTypeStats(appointments);

    return NextResponse.json({
      success: true,
      data: {
        month,
        year,
        monthName: startDate.toLocaleDateString('en-US', { month: 'long' }),
        daysInMonth,
        days,
        monthSummary,
        weeklyTrends,
        providers: providersThisMonth,
        providerStats,
        appointmentTypeStats,
      },
    });
  },
  { permissions: ['ops:read'] }
);

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Find the busiest day in the month
 */
function findBusiestDay(days: Array<{ date: string; stats: { scheduled: number } }>): { date: string; count: number } | null {
  if (days.length === 0) return null;

  const busiest = days.reduce((max, day) =>
    day.stats.scheduled > max.stats.scheduled ? day : max
  );

  return {
    date: busiest.date,
    count: busiest.stats.scheduled,
  };
}

/**
 * Calculate weekly totals for trend analysis
 */
function calculateWeeklyTrends(days: Array<{ date: string; stats: { scheduled: number; completed: number } }>): Array<{ weekNumber: number; scheduled: number; completed: number }> {
  const weeks: Record<number, { scheduled: number; completed: number }> = {};

  days.forEach((day) => {
    const date = new Date(day.date);
    const weekNumber = getWeekNumber(date);

    if (!weeks[weekNumber]) {
      weeks[weekNumber] = { scheduled: 0, completed: 0 };
    }

    weeks[weekNumber].scheduled += day.stats.scheduled;
    weeks[weekNumber].completed += day.stats.completed;
  });

  return Object.entries(weeks)
    .map(([weekNumber, stats]) => ({
      weekNumber: parseInt(weekNumber),
      ...stats,
    }))
    .sort((a, b) => a.weekNumber - b.weekNumber);
}

/**
 * Get ISO week number for a date
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get appointment type distribution stats
 */
function getAppointmentTypeStats(appointments: Array<{ appointmentType: { id: string; name: string; code: string | null; color: string | null } | null }>): Array<{ type: { id: string; name: string; color: string | null }; count: number; percentage: number }> {
  const typeMap = new Map<string, { type: { id: string; name: string; color: string | null }; count: number }>();

  appointments.forEach((apt) => {
    if (!apt.appointmentType) return;

    const typeId = apt.appointmentType.id;
    if (!typeMap.has(typeId)) {
      typeMap.set(typeId, {
        type: {
          id: apt.appointmentType.id,
          name: apt.appointmentType.name,
          color: apt.appointmentType.color,
        },
        count: 0,
      });
    }

    const entry = typeMap.get(typeId)!;
    entry.count++;
  });

  const total = appointments.length;
  return Array.from(typeMap.values())
    .map((entry) => ({
      ...entry,
      percentage: total > 0 ? Math.round((entry.count / total) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}
