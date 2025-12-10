/**
 * Portal Treatment API
 *
 * GET /api/portal/treatment - Get patient's treatment plans and progress
 *
 * Returns all treatment plans for the logged-in patient with phases,
 * milestones, and progress photos.
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getPortalSession } from '@/lib/services/portal';

/**
 * GET /api/portal/treatment
 * Get patient's treatment plans with progress details
 */
export async function GET() {
  try {
    const session = await getPortalSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Please log in to continue' },
        },
        { status: 401 }
      );
    }

    // Get all treatment plans for this patient
    const basePlans = await db.treatmentPlan.findMany({
      where: {
        patientId: session.patientId,
        clinicId: session.clinicId,
        deletedAt: null,
      },
      include: {
        phases: {
          orderBy: {
            phaseNumber: 'asc',
          },
        },
        milestones: {
          where: {
            visibleToPatient: true, // Only show patient-visible milestones
          },
          orderBy: {
            targetDate: 'asc',
          },
        },
        progressPhotos: {
          where: {
            visibleToPatient: true, // Only show patient-visible photos
          },
          orderBy: {
            takenDate: 'desc',
          },
          take: 10, // Limit to most recent 10 photos
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get provider info separately if needed
    const treatmentPlans = await Promise.all(
      basePlans.map(async (plan) => {
        let primaryProvider: { id: string; firstName: string; lastName: string } | null = null;
        if (plan.primaryProviderId) {
          primaryProvider = await db.staffProfile.findUnique({
            where: { id: plan.primaryProviderId },
            select: { id: true, firstName: true, lastName: true },
          });
        }
        return { ...plan, primaryProvider };
      })
    );

    // Transform the data for portal consumption
    const plans = treatmentPlans.map((plan) => {
      // Calculate overall progress
      const totalMilestones = plan.milestones.length;
      const completedMilestones = plan.milestones.filter(
        (m) => m.status === 'ACHIEVED'
      ).length;

      // Get current phase (first non-completed phase)
      const currentPhase = plan.phases.find(
        (p) => p.status === 'IN_PROGRESS' || p.status === 'NOT_STARTED'
      );

      // Get next upcoming milestone
      const nextMilestone = plan.milestones
        .filter((m) => m.status === 'PENDING' || m.status === 'IN_PROGRESS')
        .sort((a, b) => {
          if (!a.targetDate) return 1;
          if (!b.targetDate) return -1;
          return a.targetDate.getTime() - b.targetDate.getTime();
        })[0];

      // Calculate overall progress from phases
      const overallProgress =
        plan.phases.length > 0
          ? Math.round(
              plan.phases.reduce((sum, p) => sum + p.progressPercent, 0) /
                plan.phases.length
            )
          : 0;

      return {
        id: plan.id,
        name: plan.planName,
        status: plan.status,
        description: plan.treatmentDescription,
        estimatedDuration: plan.estimatedDuration,
        startDate: plan.startDate?.toISOString() || null,
        estimatedEndDate: plan.estimatedEndDate?.toISOString() || null,
        actualEndDate: plan.actualEndDate?.toISOString() || null,
        progress: {
          overall: overallProgress,
          milestonesCompleted: completedMilestones,
          milestonesTotal: totalMilestones,
        },
        currentPhase: currentPhase
          ? {
              id: currentPhase.id,
              name: currentPhase.phaseName,
              type: currentPhase.phaseType,
              progress: currentPhase.progressPercent,
              description: currentPhase.description,
            }
          : null,
        nextMilestone: nextMilestone
          ? {
              id: nextMilestone.id,
              title: nextMilestone.milestoneName,
              description: nextMilestone.patientDescription || nextMilestone.description,
              targetDate: nextMilestone.targetDate?.toISOString() || null,
              status: nextMilestone.status,
            }
          : null,
        phases: plan.phases.map((phase) => ({
          id: phase.id,
          name: phase.phaseName,
          type: phase.phaseType,
          status: phase.status,
          order: phase.phaseNumber,
          progress: phase.progressPercent,
          description: phase.description,
          startDate: phase.actualStartDate?.toISOString() || null,
          endDate: phase.actualEndDate?.toISOString() || null,
        })),
        milestones: plan.milestones.map((m) => ({
          id: m.id,
          title: m.milestoneName,
          description: m.patientDescription || m.description,
          status: m.status,
          targetDate: m.targetDate?.toISOString() || null,
          achievedAt: m.achievedDate?.toISOString() || null,
        })),
        photos: plan.progressPhotos.map((photo) => ({
          id: photo.id,
          type: photo.photoType,
          caption: photo.description,
          takenAt: photo.takenDate?.toISOString() || null,
          thumbnailUrl: photo.thumbnailUrl,
        })),
        doctor: plan.primaryProvider
          ? {
              id: plan.primaryProvider.id,
              name: `${plan.primaryProvider.firstName} ${plan.primaryProvider.lastName}`,
            }
          : null,
      };
    });

    // Log portal activity
    await db.portalActivityLog.create({
      data: {
        accountId: session.accountId,
        activityType: 'TREATMENT_VIEW',
        description: 'Viewed treatment progress',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        plans,
        summary: {
          totalPlans: plans.length,
          activePlans: plans.filter((p) => p.status === 'ACTIVE').length,
          completedPlans: plans.filter((p) => p.status === 'COMPLETED').length,
        },
      },
    });
  } catch (error) {
    console.error('[Portal Treatment] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    );
  }
}
