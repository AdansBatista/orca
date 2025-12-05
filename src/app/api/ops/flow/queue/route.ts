import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/ops/flow/queue
 * Get waiting room queue (patients in CHECKED_IN, WAITING, or CALLED stages)
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);
    const stagesParam = searchParams.get('stages');

    // Default stages for the queue
    let stages = ['CHECKED_IN', 'WAITING', 'CALLED'];

    if (stagesParam) {
      stages = stagesParam.split(',').filter((s) =>
        ['CHECKED_IN', 'WAITING', 'CALLED'].includes(s)
      );
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch queue entries
    const queue = await db.patientFlowState.findMany({
      where: {
        ...getClinicFilter(session),
        stage: { in: stages as ['CHECKED_IN' | 'WAITING' | 'CALLED'] },
        scheduledAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            providerType: true,
          },
        },
        chair: {
          select: {
            id: true,
            name: true,
            chairNumber: true,
          },
        },
        appointment: {
          include: {
            appointmentType: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
                defaultDuration: true,
              },
            },
          },
        },
      },
      orderBy: [
        { priority: 'desc' }, // URGENT first
        { checkedInAt: 'asc' }, // Then by check-in time (FIFO)
      ],
    });

    // Calculate wait times
    const now = new Date();
    const queueWithWaitTimes = queue.map((entry) => {
      let waitMinutes = 0;

      if (entry.currentWaitStartedAt) {
        waitMinutes = Math.floor(
          (now.getTime() - entry.currentWaitStartedAt.getTime()) / 60000
        );
      } else if (entry.checkedInAt) {
        waitMinutes = Math.floor(
          (now.getTime() - entry.checkedInAt.getTime()) / 60000
        );
      }

      // Determine wait status for UI color coding
      let waitStatus: 'normal' | 'warning' | 'critical' = 'normal';
      if (waitMinutes > 30) {
        waitStatus = 'critical';
      } else if (waitMinutes > 15) {
        waitStatus = 'warning';
      }

      return {
        ...entry,
        waitMinutes,
        waitStatus,
      };
    });

    // Group by stage for easier UI consumption
    const grouped = {
      checkedIn: queueWithWaitTimes.filter((e) => e.stage === 'CHECKED_IN'),
      waiting: queueWithWaitTimes.filter((e) => e.stage === 'WAITING'),
      called: queueWithWaitTimes.filter((e) => e.stage === 'CALLED'),
    };

    // Calculate summary stats
    const summary = {
      total: queue.length,
      checkedIn: grouped.checkedIn.length,
      waiting: grouped.waiting.length,
      called: grouped.called.length,
      avgWaitMinutes:
        queue.length > 0
          ? Math.round(
              queueWithWaitTimes.reduce((sum, e) => sum + e.waitMinutes, 0) /
                queue.length
            )
          : 0,
      longestWaitMinutes:
        queue.length > 0
          ? Math.max(...queueWithWaitTimes.map((e) => e.waitMinutes))
          : 0,
      urgentCount: queue.filter((e) => e.priority === 'URGENT').length,
      highPriorityCount: queue.filter((e) => e.priority === 'HIGH').length,
    };

    return NextResponse.json({
      success: true,
      data: {
        queue: queueWithWaitTimes,
        grouped,
        summary,
      },
    });
  },
  { permissions: ['ops:read'] }
);
