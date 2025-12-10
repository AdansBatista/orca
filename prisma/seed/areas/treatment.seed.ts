/**
 * Treatment Management seeder - Creates treatment plans and progress data
 *
 * This seeder creates sample treatment plans for testing the patient portal
 * treatment progress feature.
 *
 * Dependencies: core, patients
 */

import type { SeedContext } from '../types';
import { withSoftDelete } from '../utils/soft-delete';
import { generateObjectId } from '../factories';

/**
 * Seed treatment plans and progress data
 */
export async function seedTreatment(ctx: SeedContext): Promise<void> {
  const { db, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Treatment');

  if (clinicIds.length === 0) {
    logger.warn('No clinics found, skipping treatment seeding');
    logger.endArea('Treatment', 0);
    return;
  }

  let totalCreated = 0;

  for (const clinicId of clinicIds) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`Seeding treatment data for clinic: ${clinic?.name || clinicId}`);

    // Get patients for this clinic (first 5 patients get treatment plans)
    const patients = await db.patient.findMany({
      where: withSoftDelete({ clinicId }),
      take: 5,
      orderBy: { createdAt: 'asc' },
    });

    // Get a provider for this clinic
    const provider = await db.staffProfile.findFirst({
      where: { clinicId, isProvider: true },
    });

    let planCount = 0;

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];

      // Check if treatment plan already exists
      const existingPlan = await db.treatmentPlan.findFirst({
        where: { clinicId, patientId: patient.id },
      });

      if (existingPlan) continue;

      // Create treatment plan based on patient index
      const planData = getTreatmentPlanData(i, clinicId, patient.id, provider?.id);

      const plan = await db.treatmentPlan.create({
        data: planData,
      });

      idTracker.add('TreatmentPlan', plan.id, clinicId);
      planCount++;
      totalCreated++;

      // Create phases for the plan
      const phases = getTreatmentPhases(plan.id, clinicId, planData.status);
      for (const phaseData of phases) {
        await db.treatmentPhase.create({ data: phaseData });
        totalCreated++;
      }

      // Create milestones for the plan
      const milestones = getTreatmentMilestones(plan.id, clinicId, planData.status);
      for (const milestoneData of milestones) {
        await db.treatmentMilestone.create({ data: milestoneData });
        totalCreated++;
      }

      // Create sample photos for active/completed plans
      if (['ACTIVE', 'COMPLETED'].includes(planData.status)) {
        const photos = getTreatmentPhotos(plan.id, clinicId, patient.id, planData.status);
        for (const photoData of photos) {
          await db.treatmentPhoto.create({ data: photoData });
          totalCreated++;
        }
      }
    }

    logger.info(`  Created ${planCount} treatment plans`);
  }

  logger.success(`Treatment seeding complete: ${totalCreated} records created`);
  logger.endArea('Treatment', totalCreated);
}

/**
 * Get treatment plan data based on index
 */
function getTreatmentPlanData(
  index: number,
  clinicId: string,
  patientId: string,
  providerId?: string
) {
  const now = new Date();
  const plans = [
    {
      // Emma - Active treatment, 60% complete
      planNumber: `TP-${now.getFullYear()}-001`,
      planName: 'Full Orthodontic Treatment - Braces',
      planType: 'Comprehensive',
      status: 'ACTIVE' as const,
      chiefComplaint: 'Crowded teeth and overbite',
      diagnosis: ['Class II malocclusion', 'Upper and lower crowding'],
      treatmentGoals: [
        'Correct overbite',
        'Align crowded teeth',
        'Achieve proper bite relationship',
        'Improve smile aesthetics',
      ],
      treatmentDescription:
        'Comprehensive orthodontic treatment with traditional braces to correct crowding and bite issues.',
      estimatedDuration: 18,
      estimatedVisits: 24,
      startDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000), // Started 6 months ago
      estimatedEndDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000), // 12 months from now
    },
    {
      // Patient 2 - Recently started
      planNumber: `TP-${now.getFullYear()}-002`,
      planName: 'Invisalign Clear Aligner Treatment',
      planType: 'Clear Aligners',
      status: 'ACTIVE' as const,
      chiefComplaint: 'Spacing between front teeth',
      diagnosis: ['Mild spacing', 'Midline deviation'],
      treatmentGoals: ['Close anterior spacing', 'Correct midline'],
      treatmentDescription: 'Clear aligner therapy to close spacing and align teeth discreetly.',
      estimatedDuration: 12,
      estimatedVisits: 14,
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), // Started 1 month ago
      estimatedEndDate: new Date(now.getTime() + 330 * 24 * 60 * 60 * 1000),
    },
    {
      // Patient 3 - Completed treatment
      planNumber: `TP-${now.getFullYear() - 1}-015`,
      planName: 'Phase I Early Treatment',
      planType: 'Phase I',
      status: 'COMPLETED' as const,
      chiefComplaint: 'Crossbite',
      diagnosis: ['Posterior crossbite', 'Narrow upper arch'],
      treatmentGoals: ['Expand upper arch', 'Correct crossbite'],
      treatmentDescription: 'Early intervention to correct crossbite and guide jaw development.',
      estimatedDuration: 12,
      estimatedVisits: 12,
      startDate: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000),
      estimatedEndDate: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000),
      actualEndDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    },
    {
      // Patient 4 - Presented but not started
      planNumber: `TP-${now.getFullYear()}-003`,
      planName: 'Full Orthodontic Treatment',
      planType: 'Comprehensive',
      status: 'PRESENTED' as const,
      chiefComplaint: 'Crooked teeth',
      diagnosis: ['Moderate crowding'],
      treatmentGoals: ['Straighten teeth', 'Improve smile'],
      treatmentDescription: 'Standard orthodontic treatment with braces.',
      estimatedDuration: 20,
      estimatedVisits: 26,
      presentedDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      // Patient 5 - On hold
      planNumber: `TP-${now.getFullYear()}-004`,
      planName: 'Retention Phase',
      planType: 'Retention',
      status: 'ON_HOLD' as const,
      chiefComplaint: 'Retainer check',
      diagnosis: ['Post-treatment retention'],
      treatmentGoals: ['Maintain alignment', 'Monitor retention'],
      treatmentDescription: 'Retention monitoring phase.',
      estimatedDuration: 24,
      estimatedVisits: 4,
      startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
    },
  ];

  const plan = plans[index] || plans[0];

  return {
    clinicId,
    patientId,
    primaryProviderId: providerId,
    ...plan,
  };
}

/**
 * Get treatment phases based on status
 */
function getTreatmentPhases(planId: string, clinicId: string, status: string) {
  const now = new Date();
  const phases = [];

  if (status === 'ACTIVE') {
    phases.push(
      {
        clinicId,
        treatmentPlanId: planId,
        phaseNumber: 1,
        phaseName: 'Initial Alignment',
        phaseType: 'INITIAL_ALIGNMENT' as const,
        description: 'Begin tooth movement and initial alignment',
        objectives: ['Bond brackets', 'Start leveling wire', 'Address major crowding'],
        status: 'COMPLETED' as const,
        plannedStartDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        plannedEndDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        actualStartDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        actualEndDate: new Date(now.getTime() - 85 * 24 * 60 * 60 * 1000),
        estimatedVisits: 6,
        completedVisits: 6,
        progressPercent: 100,
      },
      {
        clinicId,
        treatmentPlanId: planId,
        phaseNumber: 2,
        phaseName: 'Space Closure',
        phaseType: 'SPACE_CLOSURE' as const,
        description: 'Close extraction spaces and continue alignment',
        objectives: ['Close spaces', 'Continue leveling', 'Address bite'],
        status: 'IN_PROGRESS' as const,
        plannedStartDate: new Date(now.getTime() - 85 * 24 * 60 * 60 * 1000),
        plannedEndDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        actualStartDate: new Date(now.getTime() - 85 * 24 * 60 * 60 * 1000),
        estimatedVisits: 8,
        completedVisits: 4,
        progressPercent: 50,
      },
      {
        clinicId,
        treatmentPlanId: planId,
        phaseNumber: 3,
        phaseName: 'Finishing & Detailing',
        phaseType: 'FINISHING' as const,
        description: 'Final adjustments and positioning',
        objectives: ['Perfect alignment', 'Finalize bite', 'Prepare for debond'],
        status: 'NOT_STARTED' as const,
        plannedStartDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        plannedEndDate: new Date(now.getTime() + 270 * 24 * 60 * 60 * 1000),
        estimatedVisits: 6,
        completedVisits: 0,
        progressPercent: 0,
      },
      {
        clinicId,
        treatmentPlanId: planId,
        phaseNumber: 4,
        phaseName: 'Retention',
        phaseType: 'RETENTION' as const,
        description: 'Post-treatment retention phase',
        objectives: ['Debond', 'Fit retainers', 'Monitor stability'],
        status: 'NOT_STARTED' as const,
        plannedStartDate: new Date(now.getTime() + 270 * 24 * 60 * 60 * 1000),
        plannedEndDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
        estimatedVisits: 4,
        completedVisits: 0,
        progressPercent: 0,
      }
    );
  } else if (status === 'COMPLETED') {
    phases.push(
      {
        clinicId,
        treatmentPlanId: planId,
        phaseNumber: 1,
        phaseName: 'Expansion',
        phaseType: 'CUSTOM' as const,
        description: 'Upper arch expansion',
        objectives: ['Widen upper arch', 'Correct crossbite'],
        status: 'COMPLETED' as const,
        progressPercent: 100,
        completedVisits: 6,
        estimatedVisits: 6,
      },
      {
        clinicId,
        treatmentPlanId: planId,
        phaseNumber: 2,
        phaseName: 'Retention',
        phaseType: 'RETENTION' as const,
        description: 'Maintain expansion results',
        objectives: ['Monitor stability'],
        status: 'COMPLETED' as const,
        progressPercent: 100,
        completedVisits: 6,
        estimatedVisits: 6,
      }
    );
  }

  return phases;
}

/**
 * Get treatment milestones based on status
 */
function getTreatmentMilestones(planId: string, clinicId: string, status: string) {
  const now = new Date();
  const milestones = [];

  if (status === 'ACTIVE') {
    milestones.push(
      {
        clinicId,
        treatmentPlanId: planId,
        milestoneName: 'Treatment Started',
        milestoneType: 'TREATMENT_START',
        description: 'Braces bonded and treatment officially began',
        status: 'ACHIEVED' as const,
        targetDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        achievedDate: new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000),
        visibleToPatient: true,
        patientDescription: 'Your braces were placed and treatment started!',
      },
      {
        clinicId,
        treatmentPlanId: planId,
        milestoneName: 'Initial Alignment Complete',
        milestoneType: 'INITIAL_ALIGNMENT',
        description: 'Major crowding addressed and teeth beginning to align',
        status: 'ACHIEVED' as const,
        targetDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        achievedDate: new Date(now.getTime() - 85 * 24 * 60 * 60 * 1000),
        visibleToPatient: true,
        patientDescription: 'Great progress! Your teeth are moving into better alignment.',
      },
      {
        clinicId,
        treatmentPlanId: planId,
        milestoneName: 'Halfway Point',
        milestoneType: 'PROGRESS',
        description: 'Treatment is 50% complete',
        status: 'IN_PROGRESS' as const,
        targetDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        visibleToPatient: true,
        patientDescription: "You're almost at the halfway mark! Keep up the good work.",
      },
      {
        clinicId,
        treatmentPlanId: planId,
        milestoneName: 'Ready for Debond',
        milestoneType: 'DEBOND_READY',
        description: 'Treatment goals achieved, ready to remove braces',
        status: 'PENDING' as const,
        targetDate: new Date(now.getTime() + 270 * 24 * 60 * 60 * 1000),
        visibleToPatient: true,
        patientDescription: 'The finish line! Your braces will be ready to come off.',
      },
      {
        clinicId,
        treatmentPlanId: planId,
        milestoneName: 'Treatment Complete',
        milestoneType: 'TREATMENT_COMPLETE',
        description: 'Braces removed and retainers delivered',
        status: 'PENDING' as const,
        targetDate: new Date(now.getTime() + 300 * 24 * 60 * 60 * 1000),
        visibleToPatient: true,
        patientDescription: 'Congratulations! Your beautiful new smile is complete!',
      }
    );
  } else if (status === 'COMPLETED') {
    milestones.push(
      {
        clinicId,
        treatmentPlanId: planId,
        milestoneName: 'Treatment Started',
        milestoneType: 'TREATMENT_START',
        status: 'ACHIEVED' as const,
        achievedDate: new Date(now.getTime() - 400 * 24 * 60 * 60 * 1000),
        visibleToPatient: true,
        patientDescription: 'Treatment started',
      },
      {
        clinicId,
        treatmentPlanId: planId,
        milestoneName: 'Expansion Complete',
        milestoneType: 'PROGRESS',
        status: 'ACHIEVED' as const,
        achievedDate: new Date(now.getTime() - 250 * 24 * 60 * 60 * 1000),
        visibleToPatient: true,
        patientDescription: 'Expansion goals achieved',
      },
      {
        clinicId,
        treatmentPlanId: planId,
        milestoneName: 'Treatment Complete',
        milestoneType: 'TREATMENT_COMPLETE',
        status: 'ACHIEVED' as const,
        achievedDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        visibleToPatient: true,
        patientDescription: 'Congratulations! Phase I complete!',
      }
    );
  }

  return milestones;
}

/**
 * Get sample treatment photos
 */
function getTreatmentPhotos(
  planId: string,
  clinicId: string,
  patientId: string,
  status: string
) {
  const now = new Date();
  const photos = [];

  // Before photos
  photos.push(
    {
      clinicId,
      treatmentPlanId: planId,
      patientId,
      photoType: 'BEFORE',
      photoCategory: 'FRONTAL',
      description: 'Initial frontal view',
      fileUrl: '/placeholder/treatment-before-frontal.jpg',
      thumbnailUrl: '/placeholder/treatment-before-frontal-thumb.jpg',
      fileName: 'before-frontal.jpg',
      takenDate: new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000),
      visibleToPatient: true,
    },
    {
      clinicId,
      treatmentPlanId: planId,
      patientId,
      photoType: 'BEFORE',
      photoCategory: 'SMILE',
      description: 'Initial smile',
      fileUrl: '/placeholder/treatment-before-smile.jpg',
      thumbnailUrl: '/placeholder/treatment-before-smile-thumb.jpg',
      fileName: 'before-smile.jpg',
      takenDate: new Date(now.getTime() - 200 * 24 * 60 * 60 * 1000),
      visibleToPatient: true,
    }
  );

  // Progress photos for active plans
  if (status === 'ACTIVE') {
    photos.push(
      {
        clinicId,
        treatmentPlanId: planId,
        patientId,
        photoType: 'PROGRESS',
        photoCategory: 'FRONTAL',
        description: '3-month progress',
        fileUrl: '/placeholder/treatment-progress-frontal.jpg',
        thumbnailUrl: '/placeholder/treatment-progress-frontal-thumb.jpg',
        fileName: 'progress-3mo-frontal.jpg',
        takenDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        visibleToPatient: true,
      },
      {
        clinicId,
        treatmentPlanId: planId,
        patientId,
        photoType: 'PROGRESS',
        photoCategory: 'SMILE',
        description: '3-month progress smile',
        fileUrl: '/placeholder/treatment-progress-smile.jpg',
        thumbnailUrl: '/placeholder/treatment-progress-smile-thumb.jpg',
        fileName: 'progress-3mo-smile.jpg',
        takenDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        visibleToPatient: true,
      }
    );
  }

  // After photos for completed plans
  if (status === 'COMPLETED') {
    photos.push(
      {
        clinicId,
        treatmentPlanId: planId,
        patientId,
        photoType: 'AFTER',
        photoCategory: 'FRONTAL',
        description: 'Final result frontal',
        fileUrl: '/placeholder/treatment-after-frontal.jpg',
        thumbnailUrl: '/placeholder/treatment-after-frontal-thumb.jpg',
        fileName: 'after-frontal.jpg',
        takenDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        visibleToPatient: true,
      },
      {
        clinicId,
        treatmentPlanId: planId,
        patientId,
        photoType: 'AFTER',
        photoCategory: 'SMILE',
        description: 'Final smile',
        fileUrl: '/placeholder/treatment-after-smile.jpg',
        thumbnailUrl: '/placeholder/treatment-after-smile-thumb.jpg',
        fileName: 'after-smile.jpg',
        takenDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        visibleToPatient: true,
      }
    );
  }

  return photos;
}

/**
 * Clear treatment data
 */
export async function clearTreatment(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing treatment data...');

  // Delete in reverse dependency order
  await db.treatmentPhoto.deleteMany({});
  await db.treatmentMilestone.deleteMany({});
  await db.treatmentPhase.deleteMany({});
  await db.treatmentPlan.deleteMany({});

  logger.info('  Treatment data cleared');
}
