import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/ops/dashboard/metrics
 * Get today's real-time operational metrics
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const clinicId = session.user.clinicId;

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch today's appointments with standardized soft delete
    const appointments = await db.appointment.findMany({
      where: withSoftDelete({
        ...getClinicFilter(session),
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      }),
      include: {
        patientFlowState: true,
      },
    });

    // Fetch flow states for wait time calculations
    const flowStates = await db.patientFlowState.findMany({
      where: {
        clinicId,
        scheduledAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Calculate metrics
    const now = new Date();
    const scheduledCount = appointments.length;
    const arrivedCount = appointments.filter((a) =>
      ['ARRIVED', 'IN_PROGRESS', 'COMPLETED'].includes(a.status)
    ).length;
    const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
    const noShowCount = appointments.filter((a) => a.status === 'NO_SHOW').length;
    const cancelledCount = appointments.filter((a) => a.status === 'CANCELLED').length;
    const inProgressCount = appointments.filter((a) => a.status === 'IN_PROGRESS').length;

    // Calculate wait times from flow states
    const waitingPatients = flowStates.filter((f) =>
      ['CHECKED_IN', 'WAITING', 'CALLED'].includes(f.stage)
    );

    const waitTimes = waitingPatients.map((f) => {
      const waitStart = f.currentWaitStartedAt || f.checkedInAt;
      if (!waitStart) return 0;
      return Math.floor((now.getTime() - waitStart.getTime()) / 60000);
    });

    const avgWaitMinutes =
      waitTimes.length > 0
        ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
        : 0;

    const maxWaitMinutes = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;

    // Calculate chair time for completed appointments
    const completedFlows = flowStates.filter(
      (f) => f.stage === 'COMPLETED' || f.stage === 'CHECKED_OUT' || f.stage === 'DEPARTED'
    );
    const chairTimes = completedFlows
      .filter((f) => f.seatedAt && f.completedAt)
      .map((f) =>
        Math.floor((f.completedAt!.getTime() - f.seatedAt!.getTime()) / 60000)
      );

    const avgChairMinutes =
      chairTimes.length > 0
        ? Math.round(chairTimes.reduce((a, b) => a + b, 0) / chairTimes.length)
        : 0;

    // Calculate on-time percentage
    // An appointment is on-time if treatment started within 15 minutes of scheduled time
    const onTimeAppointments = completedFlows.filter((f) => {
      if (!f.seatedAt) return false;
      const scheduledTime = f.scheduledAt.getTime();
      const seatedTime = f.seatedAt.getTime();
      const delayMinutes = (seatedTime - scheduledTime) / 60000;
      return delayMinutes <= 15;
    });

    const onTimePercentage =
      completedFlows.length > 0
        ? Math.round((onTimeAppointments.length / completedFlows.length) * 100)
        : 100;

    // Calculate chair utilization
    // Get chairs for this clinic
    const chairs = await db.treatmentChair.findMany({
      where: {
        room: {
          clinicId,
        },
        status: 'ACTIVE',
      },
    });

    const occupiedChairs = await db.resourceOccupancy.count({
      where: {
        clinicId,
        status: 'OCCUPIED',
      },
    });

    const chairUtilization =
      chairs.length > 0
        ? Math.round((occupiedChairs / chairs.length) * 100)
        : 0;

    // Patients currently waiting
    const waitingCount = waitingPatients.length;

    // Patients with extended wait (> 15 min)
    const extendedWaitCount = waitTimes.filter((t) => t > 15).length;

    // Get flow state counts by stage
    const stageBreakdown = {
      scheduled: flowStates.filter((f) => f.stage === 'SCHEDULED').length,
      checkedIn: flowStates.filter((f) => f.stage === 'CHECKED_IN').length,
      waiting: flowStates.filter((f) => f.stage === 'WAITING').length,
      called: flowStates.filter((f) => f.stage === 'CALLED').length,
      inChair: flowStates.filter((f) => f.stage === 'IN_CHAIR').length,
      completed: flowStates.filter((f) => f.stage === 'COMPLETED').length,
      checkedOut: flowStates.filter((f) => f.stage === 'CHECKED_OUT').length,
      departed: flowStates.filter((f) => f.stage === 'DEPARTED').length,
      noShow: flowStates.filter((f) => f.stage === 'NO_SHOW').length,
      cancelled: flowStates.filter((f) => f.stage === 'CANCELLED').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        timestamp: now.toISOString(),
        appointments: {
          scheduled: scheduledCount,
          arrived: arrivedCount,
          inProgress: inProgressCount,
          completed: completedCount,
          noShow: noShowCount,
          cancelled: cancelledCount,
          remaining: scheduledCount - completedCount - noShowCount - cancelledCount,
        },
        waitTime: {
          average: avgWaitMinutes,
          max: maxWaitMinutes,
          patientsWaiting: waitingCount,
          extendedWait: extendedWaitCount,
        },
        chairTime: {
          average: avgChairMinutes,
        },
        performance: {
          onTimePercentage,
          chairUtilization,
        },
        flow: stageBreakdown,
        resources: {
          totalChairs: chairs.length,
          occupiedChairs,
          availableChairs: chairs.length - occupiedChairs,
        },
      },
    });
  },
  { permissions: ['ops:read'] }
);
