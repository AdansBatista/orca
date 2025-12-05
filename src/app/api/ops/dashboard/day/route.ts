import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { dayDashboardQuerySchema } from '@/lib/validations/ops';

/**
 * GET /api/ops/dashboard/day
 * Get day view dashboard data with hourly breakdown
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse and validate query params
    const result = dayDashboardQuerySchema.safeParse({
      date: searchParams.get('date') || undefined,
      providerId: searchParams.get('providerId') || undefined,
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

    const { date, providerId } = result.data;

    // Parse date (default to today)
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const clinicFilter = getClinicFilter(session);

    // Build appointment filter
    const appointmentWhere: Record<string, unknown> = {
      ...clinicFilter,
      startTime: {
        gte: targetDate,
        lt: nextDay,
      },
      deletedAt: null,
    };

    if (providerId) {
      appointmentWhere.providerId = providerId;
    }

    // Fetch appointments with related data
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
        chair: {
          select: {
            id: true,
            name: true,
            chairNumber: true,
          },
        },
        patientFlowState: {
          select: {
            id: true,
            stage: true,
            priority: true,
            checkedInAt: true,
            seatedAt: true,
            completedAt: true,
            currentWaitStartedAt: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Organize by hour for timeline view
    const hourlyBreakdown: Record<number, typeof appointments> = {};
    for (let hour = 7; hour <= 19; hour++) {
      hourlyBreakdown[hour] = [];
    }

    for (const apt of appointments) {
      const hour = apt.startTime.getHours();
      if (hourlyBreakdown[hour]) {
        hourlyBreakdown[hour].push(apt);
      }
    }

    // Calculate summary stats
    const stats = {
      totalScheduled: appointments.length,
      confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
      arrived: appointments.filter((a) => a.status === 'ARRIVED').length,
      inProgress: appointments.filter((a) => a.status === 'IN_PROGRESS').length,
      completed: appointments.filter((a) => a.status === 'COMPLETED').length,
      noShow: appointments.filter((a) => a.status === 'NO_SHOW').length,
      cancelled: appointments.filter((a) => a.status === 'CANCELLED').length,
    };

    // Get providers with appointments today
    const providersWithAppointments = await db.staffProfile.findMany({
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

    // Get flow summary by stage
    const flowSummary = {
      scheduled: appointments.filter((a) => a.patientFlowState?.stage === 'SCHEDULED' || !a.patientFlowState).length,
      checkedIn: appointments.filter((a) => a.patientFlowState?.stage === 'CHECKED_IN').length,
      waiting: appointments.filter((a) => a.patientFlowState?.stage === 'WAITING').length,
      called: appointments.filter((a) => a.patientFlowState?.stage === 'CALLED').length,
      inChair: appointments.filter((a) => a.patientFlowState?.stage === 'IN_CHAIR').length,
      completed: appointments.filter((a) => a.patientFlowState?.stage === 'COMPLETED').length,
      checkedOut: appointments.filter((a) => a.patientFlowState?.stage === 'CHECKED_OUT').length,
      departed: appointments.filter((a) => a.patientFlowState?.stage === 'DEPARTED').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        date: targetDate.toISOString().split('T')[0],
        appointments,
        hourlyBreakdown,
        stats,
        flowSummary,
        providers: providersWithAppointments,
      },
    });
  },
  { permissions: ['ops:read'] }
);
