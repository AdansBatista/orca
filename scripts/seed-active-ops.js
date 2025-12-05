/**
 * Seed active ops data for testing
 *
 * Creates realistic orthodontic patient flow matching typical clinic workflow:
 *
 * CLINIC LAYOUT:
 * - Main Treatment Room: 5 chairs (Chair 1-5) in open bay
 * - Consultation Room: For new patients, X-rays, treatment plans
 *
 * WORKFLOW:
 * 1. Patient checks in at front desk → CHECKED_IN
 * 2. Patient waits in reception → WAITING
 * 3. Assistant calls patient to specific chair → CALLED
 * 4. Patient seated in chair, assistant works → IN_CHAIR
 * 5. Assistant calls orthodontist (chair shows "calling") → IN_CHAIR with needsDoctor flag
 * 6. Orthodontist checks patient → IN_CHAIR
 * 7. Treatment complete → COMPLETED
 * 8. Patient checks out at front desk → CHECKED_OUT
 *
 * This seed creates a realistic mid-morning scenario where:
 * - Some chairs have patients being worked on
 * - Some chairs have patients waiting for the doctor
 * - Some patients are waiting in reception
 * - Some patients are scheduled for later
 */
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function seedActiveOps() {
  console.log('=== SEEDING ACTIVE OPS DATA ===');
  console.log('Creating realistic orthodontic clinic scenario...\n');

  // Get clinic
  const clinic = await db.clinic.findFirst();
  if (!clinic) {
    console.error('No clinic found!');
    return;
  }
  console.log('Clinic:', clinic.name);

  // Get admin user
  const adminUser = await db.user.findFirst({
    where: { clinicId: clinic.id, role: { in: ['clinic_admin', 'super_admin'] } },
  });
  if (!adminUser) {
    console.error('No admin user found!');
    return;
  }

  // Get all 5 chairs from Main Treatment Room
  const chairs = await db.treatmentChair.findMany({
    where: { room: { clinicId: clinic.id, roomNumber: 'TREATMENT' } },
    orderBy: { chairNumber: 'asc' },
  });

  if (chairs.length < 5) {
    console.log('WARNING: Expected 5 chairs in Treatment Room, found', chairs.length);
    console.log('Run "npm run db:seed" first to create the room/chair structure');
  }
  console.log('Treatment Chairs:', chairs.map((c) => c.name).join(', '));

  // Get patients
  const patients = await db.patient.findMany({
    where: { clinicId: clinic.id },
    take: 20,
  });
  console.log('Patients available:', patients.length);

  // Get providers (orthodontist and assistants)
  const providers = await db.staffProfile.findMany({
    where: { clinicId: clinic.id, providerType: { not: null } },
    take: 4,
  });
  console.log('Providers:', providers.length);

  // Get appointment types
  const adjustmentType = await db.appointmentType.findFirst({
    where: { clinicId: clinic.id, code: { contains: 'ADJ' } },
  });
  const newPatientType = await db.appointmentType.findFirst({
    where: { clinicId: clinic.id, code: { contains: 'NEW' } },
  });
  const defaultType = await db.appointmentType.findFirst({
    where: { clinicId: clinic.id },
  });

  // Clear existing flow states
  await db.flowStageHistory.deleteMany({});
  await db.patientFlowState.deleteMany({});
  await db.resourceOccupancy.deleteMany({});
  console.log('\nCleared existing flow data');

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // ============================================================================
  // REALISTIC MID-MORNING SCENARIO
  // Time: ~10:30 AM on a busy day
  //
  // Chair 1: Patient in chair, assistant working (wire change)
  // Chair 2: Patient in chair, NEEDS DOCTOR (assistant called orthodontist)
  // Chair 3: Patient in chair, NEEDS DOCTOR (waiting for doctor)
  // Chair 4: Available - just finished, being cleaned
  // Chair 5: Patient in chair, assistant working (bracket repair)
  //
  // Reception: 2 patients waiting to be called
  // Coming up: 3 more patients scheduled
  // ============================================================================

  const flowData = [
    // === CHAIR 1: Assistant working on wire change ===
    {
      stage: 'IN_CHAIR',
      chairIndex: 0,
      checkedInMinutesAgo: 20,
      seatedMinutesAgo: 15,
      needsDoctor: false,
      appointmentType: adjustmentType || defaultType,
      notes: 'Wire change in progress - 16 NiTi to 18 SS',
      // Sub-stage tracking
      activitySubStage: 'ASSISTANT_WORKING',
      subStageMinutesAgo: 12, // Been in this stage for 12 min
    },

    // === CHAIR 2: Assistant finished, CALLING DOCTOR ===
    {
      stage: 'IN_CHAIR',
      chairIndex: 1,
      checkedInMinutesAgo: 25,
      seatedMinutesAgo: 18,
      needsDoctor: true, // <-- Key flag: This chair is calling the orthodontist
      appointmentType: adjustmentType || defaultType,
      notes: 'Ready for doctor - bracket adjustment needed on #11',
      priority: 'HIGH', // Marks as needing attention
      // Sub-stage tracking - READY FOR DOCTOR
      activitySubStage: 'READY_FOR_DOCTOR',
      subStageMinutesAgo: 2, // Been waiting for doctor 2 min
    },

    // === CHAIR 3: Waiting for doctor (called 3 min ago) ===
    {
      stage: 'IN_CHAIR',
      chairIndex: 2,
      checkedInMinutesAgo: 30,
      seatedMinutesAgo: 22,
      needsDoctor: true,
      appointmentType: adjustmentType || defaultType,
      notes: 'Waiting for Dr. - power chain replacement',
      priority: 'URGENT', // Been waiting longer
      // Sub-stage tracking - READY FOR DOCTOR (waiting longer)
      activitySubStage: 'READY_FOR_DOCTOR',
      subStageMinutesAgo: 5, // Been waiting for doctor 5 min - more urgent
    },

    // === CHAIR 4: Available (patient just left) ===
    // No flow state - chair is being prepared for next patient (CLEANING sub-stage set separately)

    // === CHAIR 5: Just seated - Setup phase ===
    {
      stage: 'IN_CHAIR',
      chairIndex: 4,
      checkedInMinutesAgo: 35,
      seatedMinutesAgo: 3, // Just seated
      needsDoctor: false,
      appointmentType: adjustmentType || defaultType,
      notes: 'Emergency - broken bracket on #8',
      // Sub-stage tracking - Still in setup
      activitySubStage: 'SETUP',
      subStageMinutesAgo: 3,
    },

    // === RECEPTION: Patients waiting ===
    {
      stage: 'WAITING',
      checkedInMinutesAgo: 8,
      appointmentType: adjustmentType || defaultType,
      notes: 'Waiting for Chair 4',
    },
    {
      stage: 'WAITING',
      checkedInMinutesAgo: 3,
      appointmentType: adjustmentType || defaultType,
    },

    // === JUST CHECKED IN ===
    {
      stage: 'CHECKED_IN',
      checkedInMinutesAgo: 1,
      appointmentType: adjustmentType || defaultType,
    },

    // === CALLED: Being escorted to chair ===
    {
      stage: 'CALLED',
      checkedInMinutesAgo: 10,
      calledMinutesAgo: 1,
      targetChairIndex: 3, // Being called to Chair 4
      appointmentType: adjustmentType || defaultType,
      notes: 'Going to Chair 4',
    },

    // === COMPLETED: Just finished, heading to checkout ===
    {
      stage: 'COMPLETED',
      checkedInMinutesAgo: 45,
      completedMinutesAgo: 2,
      appointmentType: adjustmentType || defaultType,
    },

    // === CHECKED OUT: Earlier patient ===
    {
      stage: 'CHECKED_OUT',
      checkedInMinutesAgo: 90,
      completedMinutesAgo: 50,
      checkedOutMinutesAgo: 45,
      appointmentType: adjustmentType || defaultType,
    },

    // === SCHEDULED: Coming later today ===
    { stage: 'SCHEDULED', scheduledMinutesFromNow: 15, appointmentType: adjustmentType || defaultType },
    { stage: 'SCHEDULED', scheduledMinutesFromNow: 30, appointmentType: adjustmentType || defaultType },
    { stage: 'SCHEDULED', scheduledMinutesFromNow: 45, appointmentType: adjustmentType || defaultType },
    { stage: 'SCHEDULED', scheduledMinutesFromNow: 60, appointmentType: newPatientType || defaultType, notes: 'New patient consultation' },
    { stage: 'SCHEDULED', scheduledMinutesFromNow: 90, appointmentType: adjustmentType || defaultType },
  ];

  console.log('\n--- PATIENT FLOW ---');

  for (let i = 0; i < flowData.length && i < patients.length; i++) {
    const data = flowData[i];
    const patient = patients[i];
    const provider = providers[i % providers.length];
    const chair = data.chairIndex !== undefined ? chairs[data.chairIndex] : null;
    const targetChair = data.targetChairIndex !== undefined ? chairs[data.targetChairIndex] : null;

    // Calculate times
    const scheduledAt = data.scheduledMinutesFromNow
      ? new Date(now.getTime() + data.scheduledMinutesFromNow * 60000)
      : new Date(now.getTime() - (data.checkedInMinutesAgo || 0) * 60000 - 10 * 60000);

    const checkedInAt = data.checkedInMinutesAgo
      ? new Date(now.getTime() - data.checkedInMinutesAgo * 60000)
      : undefined;

    const calledAt = data.calledMinutesAgo
      ? new Date(now.getTime() - data.calledMinutesAgo * 60000)
      : undefined;

    const seatedAt = data.seatedMinutesAgo
      ? new Date(now.getTime() - data.seatedMinutesAgo * 60000)
      : undefined;

    const completedAt = data.completedMinutesAgo
      ? new Date(now.getTime() - data.completedMinutesAgo * 60000)
      : undefined;

    const checkedOutAt = data.checkedOutMinutesAgo
      ? new Date(now.getTime() - data.checkedOutMinutesAgo * 60000)
      : undefined;

    const currentWaitStartedAt =
      data.stage === 'WAITING' || data.stage === 'CHECKED_IN'
        ? checkedInAt
        : data.stage === 'CALLED'
          ? calledAt
          : undefined;

    // Create or find appointment
    let appointment = await db.appointment.findFirst({
      where: {
        patientId: patient.id,
        startTime: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    });

    if (!appointment) {
      appointment = await db.appointment.create({
        data: {
          clinicId: clinic.id,
          patientId: patient.id,
          providerId: provider.id,
          appointmentTypeId: data.appointmentType?.id,
          chairId: chair?.id || targetChair?.id,
          startTime: scheduledAt,
          endTime: new Date(scheduledAt.getTime() + 30 * 60000),
          duration: 30,
          status:
            data.stage === 'IN_CHAIR'
              ? 'IN_PROGRESS'
              : data.stage === 'COMPLETED' || data.stage === 'CHECKED_OUT'
                ? 'COMPLETED'
                : data.stage === 'SCHEDULED'
                  ? 'SCHEDULED'
                  : 'ARRIVED',
          bookedBy: adminUser.id,
        },
      });
    } else {
      await db.appointment.update({
        where: { id: appointment.id },
        data: {
          status:
            data.stage === 'IN_CHAIR'
              ? 'IN_PROGRESS'
              : data.stage === 'COMPLETED' || data.stage === 'CHECKED_OUT'
                ? 'COMPLETED'
                : data.stage === 'SCHEDULED'
                  ? 'SCHEDULED'
                  : 'ARRIVED',
          chairId: chair?.id || targetChair?.id,
        },
      });
    }

    // Build notes with context
    let fullNotes = data.notes || '';
    if (data.needsDoctor) {
      fullNotes = fullNotes
        ? `🔔 NEEDS DOCTOR - ${fullNotes}`
        : '🔔 NEEDS DOCTOR - Assistant called for orthodontist';
    }

    // Create flow state
    const flowState = await db.patientFlowState.create({
      data: {
        clinicId: clinic.id,
        appointmentId: appointment.id,
        patientId: patient.id,
        stage: data.stage,
        chairId: data.stage === 'IN_CHAIR' ? chair?.id : undefined,
        providerId: provider.id,
        scheduledAt,
        checkedInAt,
        calledAt,
        seatedAt,
        completedAt,
        checkedOutAt,
        currentWaitStartedAt,
        priority: data.priority || 'NORMAL',
        notes: fullNotes || undefined,
        createdBy: adminUser.id,
      },
    });

    // Format output
    const chairInfo = chair ? ` → ${chair.name}` : targetChair ? ` → ${targetChair.name}` : '';
    const doctorFlag = data.needsDoctor ? ' 🔔' : '';
    console.log(
      `  ${data.stage.padEnd(11)} ${patient.firstName} ${patient.lastName}${chairInfo}${doctorFlag}`
    );

    // Create stage history
    await db.flowStageHistory.create({
      data: {
        flowStateId: flowState.id,
        stage: data.stage,
        enteredAt: checkedInAt || scheduledAt,
        triggeredBy: adminUser.id,
      },
    });
  }

  // ============================================================================
  // CHAIR STATUS (ResourceOccupancy) with Sub-Stage Tracking
  // ============================================================================
  console.log('\n--- CHAIR STATUS ---');

  // Map flow data to chairs for sub-stage info
  const chairSubStageMap = {};
  for (const data of flowData) {
    if (data.chairIndex !== undefined && data.activitySubStage) {
      chairSubStageMap[data.chairIndex] = {
        subStage: data.activitySubStage,
        subStageMinutesAgo: data.subStageMinutesAgo || 0,
      };
    }
  }

  for (let i = 0; i < chairs.length; i++) {
    const chair = chairs[i];

    // Check if this chair has someone in it
    const occupiedFlow = await db.patientFlowState.findFirst({
      where: { chairId: chair.id, stage: 'IN_CHAIR' },
      include: { patient: true },
    });

    const isOccupied = !!occupiedFlow;

    // Determine status based on scenario
    // Chair 4 (index 3) is being cleaned
    const status = isOccupied ? 'OCCUPIED' : i === 3 ? 'CLEANING' : 'AVAILABLE';

    // Get sub-stage data
    const subStageData = chairSubStageMap[i];
    const subStageStartedAt = subStageData
      ? new Date(now.getTime() - subStageData.subStageMinutesAgo * 60000)
      : isOccupied
        ? occupiedFlow.seatedAt
        : undefined;

    // Get an assistant for assignment (first provider as placeholder)
    const assignedStaffId = isOccupied && providers.length > 0 ? providers[0].id : undefined;

    await db.resourceOccupancy.create({
      data: {
        clinicId: clinic.id,
        chairId: chair.id,
        status,
        appointmentId: occupiedFlow?.appointmentId,
        patientId: occupiedFlow?.patientId,
        occupiedAt: isOccupied ? occupiedFlow.seatedAt : undefined,
        expectedFreeAt: isOccupied ? new Date(now.getTime() + 15 * 60000) : undefined,
        // Sub-stage tracking
        activitySubStage: isOccupied && subStageData ? subStageData.subStage : (i === 3 ? 'CLEANING' : null),
        subStageStartedAt: subStageStartedAt,
        assignedStaffId: isOccupied ? assignedStaffId : undefined,
        procedureNotes: isOccupied && occupiedFlow?.notes ? occupiedFlow.notes : undefined,
      },
    });

    const patientInfo = occupiedFlow
      ? ` - ${occupiedFlow.patient.firstName} ${occupiedFlow.patient.lastName}`
      : '';
    const subStageInfo = subStageData ? ` [${subStageData.subStage}]` : (i === 3 ? ' [CLEANING]' : '');
    const needsDoctor =
      occupiedFlow?.priority === 'HIGH' || occupiedFlow?.priority === 'URGENT' ? ' 🔔' : '';
    console.log(`  ${chair.name}: ${status}${subStageInfo}${patientInfo}${needsDoctor}`);
  }

  // ============================================================================
  // OPERATIONS TASKS
  // ============================================================================
  console.log('\n--- TASKS ---');

  await db.operationsTask.deleteMany({ where: { clinicId: clinic.id } });

  const taskData = [
    {
      title: 'Chair 4 needs cleaning',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueMinutes: 5,
      description: 'Patient just left Chair 4 - prepare for next patient',
    },
    {
      title: 'Confirm 2:00 PM appointments',
      priority: 'NORMAL',
      status: 'PENDING',
      dueMinutes: 60,
      description: 'Call to confirm afternoon appointments',
    },
    {
      title: 'New patient paperwork ready',
      priority: 'HIGH',
      status: 'PENDING',
      dueMinutes: 55,
      description: 'Prepare intake forms for new patient consultation at 11:30',
    },
    {
      title: 'Restock brackets in treatment room',
      priority: 'NORMAL',
      status: 'PENDING',
      dueMinutes: 120,
      description: 'Running low on .022 brackets',
    },
    {
      title: 'Morning huddle completed',
      priority: 'NORMAL',
      status: 'COMPLETED',
      dueMinutes: -120,
    },
    {
      title: 'Autoclave cycle check',
      priority: 'HIGH',
      status: 'COMPLETED',
      dueMinutes: -90,
    },
  ];

  for (const task of taskData) {
    const dueAt = new Date(now.getTime() + task.dueMinutes * 60000);
    await db.operationsTask.create({
      data: {
        clinicId: clinic.id,
        title: task.title,
        description: task.description,
        type: 'MANUAL',
        status: task.status,
        priority: task.priority,
        ownerId: adminUser.id,
        assigneeId: task.status === 'IN_PROGRESS' ? providers[0]?.id : undefined,
        dueAt,
        completedAt: task.status === 'COMPLETED' ? new Date(dueAt.getTime() + 10 * 60000) : undefined,
        createdBy: adminUser.id,
      },
    });
    const statusIcon =
      task.status === 'COMPLETED' ? '✓' : task.status === 'IN_PROGRESS' ? '→' : '○';
    console.log(`  ${statusIcon} [${task.priority}] ${task.title}`);
  }

  console.log('\n=== SEEDING COMPLETE ===');
  console.log('\nSCENARIO SUMMARY (with Sub-Stages):');
  console.log('  • Chair 1: [ASSISTANT_WORKING] Wire change in progress');
  console.log('  • Chair 2: [READY_FOR_DOCTOR] 🔔 Waiting 2 min for doctor');
  console.log('  • Chair 3: [READY_FOR_DOCTOR] 🔔 Waiting 5 min for doctor (URGENT)');
  console.log('  • Chair 4: [CLEANING] Being prepared for next patient');
  console.log('  • Chair 5: [SETUP] Just seated - emergency bracket repair');
  console.log('  • Reception: 2 patients waiting');
  console.log('  • 1 patient being called to chair');
  console.log('  • 5 more appointments scheduled');
  console.log('\nSub-Stage Color Coding on Floor Plan:');
  console.log('  • SETUP: Gray/Slate border');
  console.log('  • ASSISTANT_WORKING: Purple border');
  console.log('  • READY_FOR_DOCTOR: 🔔 Amber PULSING (prominent!)');
  console.log('  • DOCTOR_CHECKING: Green border');
  console.log('  • FINISHING: Blue border');
  console.log('  • CLEANING: Yellow border\n');

  await db.$disconnect();
}

seedActiveOps().catch(console.error);
