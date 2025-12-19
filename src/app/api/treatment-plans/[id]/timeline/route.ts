import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

interface TimelineEvent {
  id: string;
  type: 'milestone' | 'phase' | 'progress' | 'note' | 'appointment' | 'debond' | 'retention';
  title: string;
  description?: string;
  date: Date;
  status?: string;
  metadata?: Record<string, unknown>;
}

/**
 * GET /api/treatment-plans/[id]/timeline
 * Get a treatment plan's timeline of events
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Verify treatment plan exists and belongs to clinic
    const treatmentPlan = await db.treatmentPlan.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!treatmentPlan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Treatment plan not found',
          },
        },
        { status: 404 }
      );
    }

    const events: TimelineEvent[] = [];

    // Add treatment plan creation
    events.push({
      id: `plan-created-${treatmentPlan.id}`,
      type: 'milestone',
      title: 'Treatment Plan Created',
      description: treatmentPlan.planName || `Plan ${treatmentPlan.planNumber}`,
      date: treatmentPlan.createdAt,
      status: 'completed',
      metadata: {
        planNumber: treatmentPlan.planNumber,
        status: treatmentPlan.status,
      },
    });

    // Add treatment start if available
    if (treatmentPlan.startDate) {
      events.push({
        id: `plan-started-${treatmentPlan.id}`,
        type: 'milestone',
        title: 'Treatment Started',
        date: treatmentPlan.startDate,
        status: 'completed',
      });
    }

    // Fetch phases
    const phases = await db.treatmentPhase.findMany({
      where: { treatmentPlanId: id },
      orderBy: { createdAt: 'asc' },
    });

    for (const phase of phases) {
      events.push({
        id: `phase-${phase.id}`,
        type: 'phase',
        title: `Phase: ${phase.phaseName}`,
        description: phase.description || undefined,
        date: phase.actualStartDate || phase.createdAt,
        status: phase.status,
        metadata: {
          phaseId: phase.id,
          phaseType: phase.phaseType,
          progress: phase.progressPercent,
        },
      });
    }

    // Fetch milestones
    const milestones = await db.treatmentMilestone.findMany({
      where: { treatmentPlanId: id },
      orderBy: { targetDate: 'asc' },
    });

    for (const milestone of milestones) {
      events.push({
        id: `milestone-${milestone.id}`,
        type: 'milestone',
        title: milestone.milestoneName,
        description: milestone.description || undefined,
        date: milestone.achievedDate || milestone.targetDate || milestone.createdAt,
        status: milestone.status,
        metadata: {
          milestoneId: milestone.id,
          targetDate: milestone.targetDate,
          achievedDate: milestone.achievedDate,
          visibleToPatient: milestone.visibleToPatient,
        },
      });
    }

    // Fetch progress snapshots (limited to last 10)
    const progressSnapshots = await db.treatmentProgress.findMany({
      where: { treatmentPlanId: id },
      orderBy: { snapshotDate: 'desc' },
      take: 10,
    });

    for (const progress of progressSnapshots) {
      events.push({
        id: `progress-${progress.id}`,
        type: 'progress',
        title: `Progress Update: ${progress.percentComplete}%`,
        description: progress.clinicalProgress || undefined,
        date: progress.snapshotDate,
        status: progress.status,
        metadata: {
          progressId: progress.id,
          percentComplete: progress.percentComplete,
          currentPhase: progress.currentPhase,
          complianceScore: progress.complianceScore,
        },
      });
    }

    // Fetch debond readiness assessments
    const debondAssessments = await db.debondReadiness.findMany({
      where: { treatmentPlanId: id },
      orderBy: { assessmentDate: 'desc' },
    });

    for (const debond of debondAssessments) {
      events.push({
        id: `debond-${debond.id}`,
        type: 'debond',
        title: debond.isReady ? 'Ready for Debond' : 'Debond Assessment',
        description: debond.clinicalNotes || undefined,
        date: debond.assessmentDate,
        status: debond.debondCompleted ? 'completed' : debond.isReady ? 'ready' : 'pending',
        metadata: {
          debondId: debond.id,
          isReady: debond.isReady,
          readinessScore: debond.readinessScore,
          scheduledDebondDate: debond.scheduledDebondDate,
          debondCompletedDate: debond.debondCompletedDate,
        },
      });
    }

    // Fetch retention protocols
    const retentionProtocols = await db.retentionProtocol.findMany({
      where: { treatmentPlanId: id },
      orderBy: { startDate: 'desc' },
    });

    for (const protocol of retentionProtocols) {
      events.push({
        id: `retention-${protocol.id}`,
        type: 'retention',
        title: `Retention Protocol Started`,
        description: `Phase: ${protocol.currentPhase}, Schedule: ${protocol.wearSchedule}`,
        date: protocol.startDate,
        status: protocol.isActive ? 'active' : 'completed',
        metadata: {
          protocolId: protocol.id,
          currentPhase: protocol.currentPhase,
          wearSchedule: protocol.wearSchedule,
          complianceStatus: protocol.complianceStatus,
          stabilityStatus: protocol.stabilityStatus,
        },
      });
    }

    // Add treatment end if completed
    if (treatmentPlan.actualEndDate) {
      events.push({
        id: `plan-completed-${treatmentPlan.id}`,
        type: 'milestone',
        title: 'Treatment Completed',
        date: treatmentPlan.actualEndDate,
        status: 'completed',
      });
    }

    // Sort all events by date
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate summary stats
    const stats = {
      totalMilestones: milestones.length,
      achievedMilestones: milestones.filter((m) => m.status === 'ACHIEVED').length,
      totalPhases: phases.length,
      completedPhases: phases.filter((p) => p.status === 'COMPLETED').length,
      latestProgress: progressSnapshots[0]?.percentComplete || 0,
      hasDebondAssessment: debondAssessments.length > 0,
      isReadyForDebond: debondAssessments.some((d) => d.isReady),
      hasRetentionProtocol: retentionProtocols.length > 0,
      treatmentDuration: treatmentPlan.startDate
        ? Math.floor(
            ((treatmentPlan.actualEndDate || new Date()).getTime() - treatmentPlan.startDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : null,
    };

    return NextResponse.json({
      success: true,
      data: {
        treatmentPlan: {
          id: treatmentPlan.id,
          planNumber: treatmentPlan.planNumber,
          planName: treatmentPlan.planName,
          status: treatmentPlan.status,
          startDate: treatmentPlan.startDate,
          actualEndDate: treatmentPlan.actualEndDate,
          patient: treatmentPlan.patient,
        },
        events,
        stats,
      },
    });
  },
  { permissions: ['treatment:read'] }
);
