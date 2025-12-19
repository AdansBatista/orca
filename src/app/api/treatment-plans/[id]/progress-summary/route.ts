import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

// GET /api/treatment-plans/[id]/progress-summary - Get comprehensive progress summary
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    // Fetch treatment plan with related data
    const treatmentPlan = await db.treatmentPlan.findFirst({
      where: withSoftDelete({
        id,
        ...clinicFilter,
      }),
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        phases: {
          where: { deletedAt: null },
          orderBy: { phaseNumber: 'asc' },
        },
        milestones: {
          orderBy: { targetDate: 'asc' },
        },
      },
    });

    if (!treatmentPlan) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Treatment plan not found' } },
        { status: 404 }
      );
    }

    // Calculate phase progress
    const totalPhases = treatmentPlan.phases.length;
    const completedPhases = treatmentPlan.phases.filter(
      (p) => p.status === 'COMPLETED'
    ).length;
    const activePhase = treatmentPlan.phases.find((p) => p.status === 'IN_PROGRESS');

    // Calculate milestone progress
    const totalMilestones = treatmentPlan.milestones.length;
    const achievedMilestones = treatmentPlan.milestones.filter(
      (m) => m.status === 'ACHIEVED'
    ).length;
    const upcomingMilestones = treatmentPlan.milestones.filter(
      (m) => m.status === 'PENDING' && m.targetDate && new Date(m.targetDate) > new Date()
    );
    const overdueMilestones = treatmentPlan.milestones.filter(
      (m) => m.status === 'PENDING' && m.targetDate && new Date(m.targetDate) < new Date()
    );

    // Calculate time progress
    const startDate = treatmentPlan.startDate ? new Date(treatmentPlan.startDate) : null;
    const estimatedEndDate = treatmentPlan.estimatedEndDate
      ? new Date(treatmentPlan.estimatedEndDate)
      : null;
    const today = new Date();

    let timeProgress = null;
    let daysElapsed = null;
    let daysRemaining = null;
    let totalDays = null;
    let isOverdue = false;

    if (startDate && estimatedEndDate) {
      totalDays = Math.ceil(
        (estimatedEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      daysRemaining = Math.max(
        0,
        Math.ceil((estimatedEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      );
      timeProgress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
      isOverdue = today > estimatedEndDate && treatmentPlan.status !== 'COMPLETED';
    }

    // Fetch recent progress notes count
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentNotesCount = await db.progressNote.count({
      where: withSoftDelete({
        patientId: treatmentPlan.patientId,
        noteDate: { gte: thirtyDaysAgo },
        ...clinicFilter,
      }),
    });

    // Fetch appointments count (if model exists)
    let appointmentsCompleted = 0;
    let appointmentsScheduled = 0;

    try {
      appointmentsCompleted = await db.appointment.count({
        where: {
          patientId: treatmentPlan.patientId,
          status: 'COMPLETED',
          ...clinicFilter,
        },
      });

      appointmentsScheduled = await db.appointment.count({
        where: {
          patientId: treatmentPlan.patientId,
          status: 'SCHEDULED',
          startTime: { gte: today },
          ...clinicFilter,
        },
      });
    } catch {
      // Appointment model may not exist
    }

    // Calculate overall progress score
    const phaseWeight = 0.4;
    const milestoneWeight = 0.4;
    const timeWeight = 0.2;

    const phaseProgress = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;
    const milestoneProgress = totalMilestones > 0 ? (achievedMilestones / totalMilestones) * 100 : 0;

    const overallProgress = Math.round(
      phaseProgress * phaseWeight +
        milestoneProgress * milestoneWeight +
        (timeProgress || 0) * timeWeight
    );

    // Determine status indicators
    let statusIndicator: 'on_track' | 'slightly_behind' | 'behind' | 'ahead' | 'completed' = 'on_track';

    if (treatmentPlan.status === 'COMPLETED') {
      statusIndicator = 'completed';
    } else if (isOverdue) {
      statusIndicator = 'behind';
    } else if (overdueMilestones.length > 0) {
      statusIndicator = 'slightly_behind';
    } else if (timeProgress && phaseProgress > timeProgress + 10) {
      statusIndicator = 'ahead';
    }

    const summary = {
      treatmentPlanId: id,
      patientId: treatmentPlan.patientId,
      patientName: `${treatmentPlan.patient.firstName} ${treatmentPlan.patient.lastName}`,
      status: treatmentPlan.status,
      statusIndicator,

      // Overall progress
      overallProgress,
      treatmentProgress: phaseProgress,

      // Phase progress
      phases: {
        total: totalPhases,
        completed: completedPhases,
        progress: phaseProgress,
        currentPhase: activePhase
          ? {
              id: activePhase.id,
              name: activePhase.phaseName,
              progress: activePhase.progressPercent || 0,
            }
          : null,
      },

      // Milestone progress
      milestones: {
        total: totalMilestones,
        achieved: achievedMilestones,
        progress: milestoneProgress,
        upcoming: upcomingMilestones.slice(0, 3).map((m) => ({
          id: m.id,
          name: m.milestoneName,
          targetDate: m.targetDate,
        })),
        overdue: overdueMilestones.length,
      },

      // Time tracking
      timeline: {
        startDate: treatmentPlan.startDate,
        estimatedEndDate: treatmentPlan.estimatedEndDate,
        actualEndDate: treatmentPlan.actualEndDate,
        daysElapsed,
        daysRemaining,
        totalDays,
        timeProgress,
        isOverdue,
      },

      // Activity metrics
      activity: {
        recentNotes: recentNotesCount,
        appointmentsCompleted,
        appointmentsScheduled,
        lastUpdated: treatmentPlan.updatedAt,
      },

      // Alerts
      alerts: [
        ...(isOverdue
          ? [{ type: 'warning' as const, message: 'Treatment is past estimated end date' }]
          : []),
        ...(overdueMilestones.length > 0
          ? [
              {
                type: 'warning' as const,
                message: `${overdueMilestones.length} milestone(s) overdue`,
              },
            ]
          : []),
        ...(appointmentsScheduled === 0 && treatmentPlan.status === 'ACTIVE'
          ? [{ type: 'info' as const, message: 'No upcoming appointments scheduled' }]
          : []),
      ],
    };

    return NextResponse.json({ success: true, data: summary });
  },
  { permissions: ['treatment:read'] }
);
