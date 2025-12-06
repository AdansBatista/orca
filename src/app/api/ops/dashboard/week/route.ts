import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { weekDashboardQuerySchema } from '@/lib/validations/ops';

/**
 * GET /api/ops/dashboard/week
 * Get week view dashboard data with daily breakdown
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse and validate query params
    const result = weekDashboardQuerySchema.safeParse({
      weekStart: searchParams.get('weekStart') || undefined,
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

    const { weekStart } = result.data;

    // Calculate week boundaries (Monday to Sunday)
    const startDate = weekStart ? new Date(weekStart) : getMonday(new Date());
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const clinicFilter = getClinicFilter(session);

    // Build appointment filter with standardized soft delete
    const appointmentWhere = withSoftDelete({
      ...clinicFilter,
      startTime: {
        gte: startDate,
        lt: endDate,
      },
    });

    // Fetch appointments for the week
    const appointments = await db.appointment.findMany({
      where: appointmentWhere,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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
            id: true,
            stage: true,
            checkedInAt: true,
            completedAt: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Organize appointments by day
    const days = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(dayDate.getDate() + i);
      const nextDay = new Date(dayDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const dayAppointments = appointments.filter((apt) => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= dayDate && aptDate < nextDay;
      });

      // Calculate day stats
      const stats = {
        scheduled: dayAppointments.length,
        confirmed: dayAppointments.filter((a) => a.status === 'CONFIRMED').length,
        completed: dayAppointments.filter((a) => a.status === 'COMPLETED').length,
        cancelled: dayAppointments.filter((a) => a.status === 'CANCELLED').length,
        noShow: dayAppointments.filter((a) => a.status === 'NO_SHOW').length,
      };

      // Calculate appointment density per hour (for heatmap)
      const hourlyDensity: Record<number, number> = {};
      for (let hour = 7; hour <= 19; hour++) {
        hourlyDensity[hour] = dayAppointments.filter(
          (apt) => new Date(apt.startTime).getHours() === hour
        ).length;
      }

      days.push({
        date: dayDate.toISOString().split('T')[0],
        dayOfWeek: dayDate.toLocaleDateString('en-US', { weekday: 'short' }),
        isToday: isSameDay(dayDate, new Date()),
        isWeekend: dayDate.getDay() === 0 || dayDate.getDay() === 6,
        appointments: dayAppointments,
        stats,
        hourlyDensity,
      });
    }

    // Calculate week summary
    const weekSummary = {
      totalScheduled: appointments.length,
      totalCompleted: appointments.filter((a) => a.status === 'COMPLETED').length,
      totalCancelled: appointments.filter((a) => a.status === 'CANCELLED').length,
      totalNoShow: appointments.filter((a) => a.status === 'NO_SHOW').length,
      completionRate: appointments.length > 0
        ? Math.round((appointments.filter((a) => a.status === 'COMPLETED').length / appointments.length) * 100)
        : 0,
    };

    // Get daily comparison for trends
    const dailyTrends = days.map((day) => ({
      date: day.date,
      dayOfWeek: day.dayOfWeek,
      scheduled: day.stats.scheduled,
      completed: day.stats.completed,
    }));

    // Get providers active this week
    const providersThisWeek = await db.staffProfile.findMany({
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
    const providerStats = providersThisWeek.map((provider) => {
      const providerApts = appointments.filter((a) => a.providerId === provider.id);
      return {
        provider,
        scheduled: providerApts.length,
        completed: providerApts.filter((a) => a.status === 'COMPLETED').length,
        cancelled: providerApts.filter((a) => a.status === 'CANCELLED').length,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        weekStart: startDate.toISOString().split('T')[0],
        weekEnd: new Date(endDate.getTime() - 1).toISOString().split('T')[0],
        days,
        weekSummary,
        dailyTrends,
        providers: providersThisWeek,
        providerStats,
      },
    });
  },
  { permissions: ['ops:read'] }
);

/**
 * Get the Monday of the week containing the given date
 */
function getMonday(date: Date): Date {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  return monday;
}

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
