/**
 * Treatment Management seeder - Creates treatment plans, appliances, progress notes
 *
 * This seeder creates comprehensive treatment data including:
 * - Treatment plans with phases and milestones
 * - Appliance records (brackets, wires, retainers)
 * - Progress notes in SOAP format
 * - Clinical findings and measurements
 *
 * Dependencies: core, patients, auth:users, staff
 */

import type { SeedContext } from '../types';
import { withSoftDelete } from '../utils/soft-delete';

// Wire sequence for typical orthodontic treatment
const WIRE_SEQUENCE = [
  { type: 'ROUND', material: 'NITI', size: '0.014', description: 'Initial leveling wire' },
  { type: 'ROUND', material: 'NITI', size: '0.016', description: 'Continued leveling' },
  { type: 'ROUND', material: 'NITI_HEAT', size: '0.018', description: 'Heat-activated alignment' },
  { type: 'RECTANGULAR', material: 'NITI', size: '0.016x0.022', description: 'Torque expression' },
  { type: 'RECTANGULAR', material: 'STAINLESS_STEEL', size: '0.017x0.025', description: 'Working wire' },
  { type: 'RECTANGULAR', material: 'STAINLESS_STEEL', size: '0.019x0.025', description: 'Finishing wire' },
];

// Progress note templates
const PROGRESS_NOTE_TEMPLATES = {
  BONDING: {
    subjective: 'Patient presents for bracket bonding appointment. No complaints.',
    objective: 'Full upper and lower brackets bonded. Initial wire placed.',
    assessment: 'Treatment initiated successfully. Patient tolerating appliances well.',
    plan: 'Return in 6 weeks for first adjustment. Reviewed oral hygiene instructions.',
  },
  ADJUSTMENT: {
    subjective: 'Patient reports mild discomfort after last adjustment, resolved within 3 days.',
    objective: 'Good oral hygiene. Teeth showing expected movement. No bracket failures.',
    assessment: 'Treatment progressing as planned.',
    plan: 'Wire change to next in sequence. Continue current mechanics.',
  },
  EMERGENCY: {
    subjective: 'Patient presents with broken bracket on tooth #9.',
    objective: 'Bracket debonded from #9. Wire intact. No soft tissue trauma.',
    assessment: 'Bracket failure, likely due to biting on hard food.',
    plan: 'Bracket rebonded. Patient counseled on dietary restrictions.',
  },
};

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

    // Get patients for this clinic (first 8 patients get treatment plans)
    const patients = await db.patient.findMany({
      where: withSoftDelete({ clinicId }),
      take: 8,
      orderBy: { createdAt: 'asc' },
    });

    // Get providers for this clinic
    const providers = await db.staffProfile.findMany({
      where: withSoftDelete({ clinicId, isProvider: true }),
      take: 3,
    });

    const provider = providers[0];

    let planCount = 0;
    let applianceCount = 0;
    let wireCount = 0;
    let noteCount = 0;

    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];

      // Check if treatment plan already exists
      const existingPlan = await db.treatmentPlan.findFirst({
        where: { clinicId, patientId: patient.id },
      });

      if (existingPlan) {
        idTracker.add('TreatmentPlan', existingPlan.id, clinicId);
        continue;
      }

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

      // Create appliances and wires for active braces patients
      if (planData.status === 'ACTIVE' && planData.planType === 'Comprehensive' && planData.startDate) {
        const applianceResults = await createAppliancesAndWires(
          db,
          clinicId,
          patient.id,
          plan.id,
          provider?.id,
          planData.startDate
        );
        applianceCount += applianceResults.appliances;
        wireCount += applianceResults.wires;
        totalCreated += applianceResults.appliances + applianceResults.wires;
      }

      // Create progress notes for active and completed plans
      if (['ACTIVE', 'COMPLETED'].includes(planData.status) && planData.startDate) {
        const noteResults = await createProgressNotes(
          db,
          clinicId,
          patient.id,
          plan.id,
          provider?.id,
          planData.status,
          planData.startDate
        );
        noteCount += noteResults;
        totalCreated += noteResults;
      }
    }

    logger.info(`  Created ${planCount} plans, ${applianceCount} appliances, ${wireCount} wires, ${noteCount} notes`);
  }

  logger.success(`Treatment seeding complete: ${totalCreated} records created`);
  logger.endArea('Treatment', totalCreated);
}

/**
 * Create appliance and wire records for a treatment plan
 */
async function createAppliancesAndWires(
  db: SeedContext['db'],
  clinicId: string,
  patientId: string,
  treatmentPlanId: string,
  providerId: string | undefined,
  startDate: Date
) {
  let appliances = 0;
  let wires = 0;

  // Create upper brackets
  const upperBrackets = await db.applianceRecord.create({
    data: {
      clinicId,
      patientId,
      treatmentPlanId,
      applianceType: 'BRACKETS',
      applianceSystem: 'Damon Q',
      manufacturer: 'Ormco',
      arch: 'UPPER',
      toothNumbers: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      placedDate: startDate,
      status: 'ACTIVE',
      placedById: providerId,
      specification: {
        bracketType: 'Self-ligating',
        prescription: 'Damon Standard',
        bondingMaterial: 'Transbond XT',
      },
      notes: 'Full upper bonding. Good moisture control.',
    },
  });
  appliances++;

  // Create lower brackets
  const lowerBrackets = await db.applianceRecord.create({
    data: {
      clinicId,
      patientId,
      treatmentPlanId,
      applianceType: 'BRACKETS',
      applianceSystem: 'Damon Q',
      manufacturer: 'Ormco',
      arch: 'LOWER',
      toothNumbers: [19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
      placedDate: startDate,
      status: 'ACTIVE',
      placedById: providerId,
      specification: {
        bracketType: 'Self-ligating',
        prescription: 'Damon Standard',
        bondingMaterial: 'Transbond XT',
      },
      notes: 'Full lower bonding.',
    },
  });
  appliances++;

  // Create wire sequence for upper arch
  const now = new Date();
  const treatmentMonths = Math.floor((now.getTime() - startDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
  const wiresPlaced = Math.min(treatmentMonths + 1, 4); // Max 4 wires in sequence

  // Only create wires if we have a provider
  if (!providerId) {
    return { appliances, wires };
  }

  for (let i = 0; i < wiresPlaced; i++) {
    const wireInfo = WIRE_SEQUENCE[i];
    const wireDate = new Date(startDate.getTime() + i * 6 * 7 * 24 * 60 * 60 * 1000); // Every 6 weeks
    const isCurrentWire = i === wiresPlaced - 1;

    await db.wireRecord.create({
      data: {
        clinic: { connect: { id: clinicId } },
        applianceRecord: { connect: { id: upperBrackets.id } },
        wireType: wireInfo.type as 'ROUND' | 'RECTANGULAR' | 'SQUARE',
        wireMaterial: wireInfo.material as 'NITI' | 'NITI_HEAT' | 'STAINLESS_STEEL' | 'TMA' | 'BETA_TITANIUM' | 'COPPER_NITI',
        wireSize: wireInfo.size,
        arch: 'UPPER',
        sequenceNumber: i + 1,
        placedDate: wireDate,
        removedDate: isCurrentWire ? null : new Date(wireDate.getTime() + 6 * 7 * 24 * 60 * 60 * 1000),
        status: isCurrentWire ? 'ACTIVE' : 'REMOVED',
        placedBy: { connect: { id: providerId } },
        notes: wireInfo.description,
      },
    });
    wires++;

    // Also create for lower arch
    await db.wireRecord.create({
      data: {
        clinic: { connect: { id: clinicId } },
        applianceRecord: { connect: { id: lowerBrackets.id } },
        wireType: wireInfo.type as 'ROUND' | 'RECTANGULAR' | 'SQUARE',
        wireMaterial: wireInfo.material as 'NITI' | 'NITI_HEAT' | 'STAINLESS_STEEL' | 'TMA' | 'BETA_TITANIUM' | 'COPPER_NITI',
        wireSize: wireInfo.size,
        arch: 'LOWER',
        sequenceNumber: i + 1,
        placedDate: wireDate,
        removedDate: isCurrentWire ? null : new Date(wireDate.getTime() + 6 * 7 * 24 * 60 * 60 * 1000),
        status: isCurrentWire ? 'ACTIVE' : 'REMOVED',
        placedBy: { connect: { id: providerId } },
        notes: wireInfo.description,
      },
    });
    wires++;
  }

  return { appliances, wires };
}

/**
 * Create progress notes for a treatment plan
 */
async function createProgressNotes(
  db: SeedContext['db'],
  clinicId: string,
  patientId: string,
  treatmentPlanId: string,
  providerId: string | undefined,
  status: string,
  startDate: Date
) {
  let noteCount = 0;
  const now = new Date();

  // Bonding note (at start of treatment)
  await db.progressNote.create({
    data: {
      clinicId,
      patientId,
      treatmentPlanId,
      noteDate: startDate,
      noteType: 'BONDING',
      chiefComplaint: 'Initial bracket bonding appointment',
      subjective: PROGRESS_NOTE_TEMPLATES.BONDING.subjective,
      objective: PROGRESS_NOTE_TEMPLATES.BONDING.objective,
      assessment: PROGRESS_NOTE_TEMPLATES.BONDING.assessment,
      plan: PROGRESS_NOTE_TEMPLATES.BONDING.plan,
      proceduresSummary: 'D8080 - Comprehensive orthodontic treatment bonding',
      providerId: providerId || '',
      status: 'SIGNED',
      signedAt: startDate,
      signedById: providerId,
    },
  });
  noteCount++;

  // Adjustment notes every 6 weeks
  const treatmentWeeks = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const adjustmentCount = Math.floor(treatmentWeeks / 6);

  for (let i = 1; i <= Math.min(adjustmentCount, 5); i++) {
    const adjustmentDate = new Date(startDate.getTime() + i * 6 * 7 * 24 * 60 * 60 * 1000);

    await db.progressNote.create({
      data: {
        clinicId,
        patientId,
        treatmentPlanId,
        noteDate: adjustmentDate,
        noteType: 'ADJUSTMENT',
        chiefComplaint: `Routine adjustment visit #${i}`,
        subjective: PROGRESS_NOTE_TEMPLATES.ADJUSTMENT.subjective,
        objective: `${PROGRESS_NOTE_TEMPLATES.ADJUSTMENT.objective} Wire change performed.`,
        assessment: PROGRESS_NOTE_TEMPLATES.ADJUSTMENT.assessment,
        plan: `${PROGRESS_NOTE_TEMPLATES.ADJUSTMENT.plan} Next visit in 6 weeks.`,
        proceduresSummary: 'D8670 - Periodic orthodontic treatment visit',
        providerId: providerId || '',
        status: 'SIGNED',
        signedAt: adjustmentDate,
        signedById: providerId,
      },
    });
    noteCount++;
  }

  // Add one emergency note for some patients
  if (Math.random() > 0.5 && treatmentWeeks > 8) {
    const emergencyDate = new Date(startDate.getTime() + 8 * 7 * 24 * 60 * 60 * 1000);

    await db.progressNote.create({
      data: {
        clinicId,
        patientId,
        treatmentPlanId,
        noteDate: emergencyDate,
        noteType: 'EMERGENCY',
        chiefComplaint: 'Broken bracket',
        subjective: PROGRESS_NOTE_TEMPLATES.EMERGENCY.subjective,
        objective: PROGRESS_NOTE_TEMPLATES.EMERGENCY.objective,
        assessment: PROGRESS_NOTE_TEMPLATES.EMERGENCY.assessment,
        plan: PROGRESS_NOTE_TEMPLATES.EMERGENCY.plan,
        proceduresSummary: 'D8680 - Orthodontic retention',
        providerId: providerId || '',
        status: 'SIGNED',
        signedAt: emergencyDate,
        signedById: providerId,
      },
    });
    noteCount++;
  }

  return noteCount;
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

  // Aligner-related models
  await db.alignerDelivery.deleteMany({});
  await db.alignerRecord.deleteMany({});

  // Appliance-related models
  await db.applianceActivation.deleteMany({});
  await db.wireRecord.deleteMany({});
  await db.applianceRecord.deleteMany({});

  // Clinical documentation
  await db.clinicalMeasurement.deleteMany({});
  await db.clinicalFinding.deleteMany({});
  await db.progressNote.deleteMany({});

  // Treatment progress and outcomes
  await db.treatmentOutcome.deleteMany({});
  await db.treatmentProgress.deleteMany({});

  // Treatment photos, milestones, phases
  await db.treatmentPhoto.deleteMany({});
  await db.treatmentMilestone.deleteMany({});
  await db.treatmentPhase.deleteMany({});
  await db.treatmentOption.deleteMany({});
  await db.treatmentPlan.deleteMany({});

  logger.info('  Treatment data cleared');
}
