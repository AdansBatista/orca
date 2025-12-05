import type { SeedContext } from '../types';
import {
  getDefaultFloorPlan,
  generatePatientFlowStates,
  generateResourceOccupancy,
  generateStaffAssignments,
  generateOperationsTasks,
  generateDailyMetrics,
} from '../fixtures/ops.fixture';

/**
 * Seed Practice Orchestration data
 *
 * This creates:
 * 1. Floor plan configuration for each clinic
 * 2. Patient flow states for today's appointments
 * 3. Resource occupancy records for chairs/rooms
 * 4. Staff assignments for active appointments
 * 5. Operations tasks
 * 6. Daily metrics (historical)
 */
export async function seedOps(ctx: SeedContext): Promise<void> {
  const { db, config, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Practice Orchestration');

  let totalCreated = 0;

  for (const clinicId of clinicIds) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`Seeding ops data for clinic: ${clinic?.name || clinicId}`);

    // Get an admin user for ownership
    const adminUser = await db.user.findFirst({
      where: { clinicId, role: { in: ['clinic_admin', 'super_admin'] } },
    });
    const ownerId = adminUser?.id;

    if (!ownerId) {
      logger.warn(`  No admin user found for clinic ${clinicId}, skipping ops seeding`);
      continue;
    }

    // ============================================================================
    // 1. GET RELATED DATA
    // ============================================================================

    // Get rooms for this clinic
    const rooms = await db.room.findMany({
      where: { clinicId: clinicId },
      select: { id: true, name: true },
    });

    // Get chairs for this clinic (via rooms)
    const chairs = await db.treatmentChair.findMany({
      where: { room: { clinicId: clinicId } },
      select: { id: true, name: true, roomId: true },
    });

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const appointments = await db.appointment.findMany({
      where: {
        clinicId,
        startTime: { gte: today, lt: tomorrow },
        OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }],
      },
      select: {
        id: true,
        patientId: true,
        providerId: true,
        chairId: true,
        startTime: true,
        status: true,
      },
    });

    // Get staff members for assignments
    const staff = await db.staffProfile.findMany({
      where: { clinicId, status: 'ACTIVE' },
      select: { id: true, providerType: true },
    });

    const providers = staff.filter((s) => s.providerType !== null);
    const assistants = staff.filter((s) => s.providerType === null);

    logger.info(`  Found: ${rooms.length} rooms, ${chairs.length} chairs, ${appointments.length} today's appointments, ${staff.length} staff`);

    // ============================================================================
    // 2. SEED FLOOR PLAN CONFIGURATION
    // ============================================================================
    logger.info('  Seeding floor plan configuration...');

    const existingFloorPlan = await db.floorPlanConfig.findFirst({
      where: { clinicId },
    });

    if (!existingFloorPlan && rooms.length > 0 && chairs.length > 0) {
      const floorPlanLayout = getDefaultFloorPlan(rooms, chairs);

      await db.floorPlanConfig.create({
        data: {
          clinicId,
          name: 'Main Floor',
          isDefault: true,
          gridColumns: floorPlanLayout.gridColumns,
          gridRows: floorPlanLayout.gridRows,
          cellSize: floorPlanLayout.cellSize,
          layout: JSON.parse(JSON.stringify(floorPlanLayout.rooms)),
          updatedBy: ownerId,
        },
      });
      totalCreated++;
      logger.info('  Created floor plan configuration');
    }

    // Skip sample data in minimal mode
    if (config.mode === 'minimal') {
      continue;
    }

    // ============================================================================
    // 3. SEED PATIENT FLOW STATES
    // ============================================================================
    if (appointments.length > 0) {
      logger.info('  Seeding patient flow states...');

      const flowStatesData = generatePatientFlowStates(clinicId, appointments, chairs);

      let flowCount = 0;
      for (const flowData of flowStatesData) {
        // Check if flow state already exists for this appointment
        const existingFlow = await db.patientFlowState.findFirst({
          where: { appointmentId: flowData.appointmentId },
        });

        if (!existingFlow) {
          const flowState = await db.patientFlowState.create({
            data: {
              clinicId: flowData.clinicId,
              appointmentId: flowData.appointmentId,
              patientId: flowData.patientId,
              stage: flowData.stage,
              chairId: flowData.chairId,
              providerId: flowData.providerId,
              scheduledAt: flowData.scheduledAt,
              checkedInAt: flowData.checkedInAt,
              calledAt: flowData.calledAt,
              seatedAt: flowData.seatedAt,
              completedAt: flowData.completedAt,
              checkedOutAt: flowData.checkedOutAt,
              departedAt: flowData.departedAt,
              currentWaitStartedAt: flowData.currentWaitStartedAt,
              priority: flowData.priority,
              notes: flowData.notes,
              createdBy: ownerId,
            },
          });
          idTracker.add('PatientFlowState', flowState.id);
          flowCount++;
          totalCreated++;

          // Create stage history entry for current stage
          await db.flowStageHistory.create({
            data: {
              flowStateId: flowState.id,
              stage: flowData.stage,
              enteredAt: flowData.scheduledAt,
              triggeredBy: ownerId,
            },
          });
        }
      }

      logger.info(`  Created ${flowCount} patient flow states`);

      // ============================================================================
      // 4. SEED RESOURCE OCCUPANCY
      // ============================================================================
      if (chairs.length > 0) {
        logger.info('  Seeding resource occupancy...');

        const occupancyData = generateResourceOccupancy(clinicId, chairs, rooms, flowStatesData);

        let occupancyCount = 0;
        for (const occData of occupancyData) {
          // Check if occupancy already exists for this chair
          if (occData.chairId) {
            const existingOcc = await db.resourceOccupancy.findFirst({
              where: { clinicId, chairId: occData.chairId },
            });

            if (!existingOcc) {
              await db.resourceOccupancy.create({
                data: {
                  clinicId: occData.clinicId,
                  chairId: occData.chairId,
                  roomId: occData.roomId,
                  status: occData.status,
                  appointmentId: occData.appointmentId,
                  patientId: occData.patientId,
                  occupiedAt: occData.occupiedAt,
                  expectedFreeAt: occData.expectedFreeAt,
                  blockReason: occData.blockReason,
                },
              });
              occupancyCount++;
              totalCreated++;
            }
          }
        }

        logger.info(`  Created ${occupancyCount} resource occupancy records`);
      }

      // ============================================================================
      // 5. SEED STAFF ASSIGNMENTS
      // ============================================================================
      if (assistants.length > 0 || providers.length > 0) {
        logger.info('  Seeding staff assignments...');

        const assignmentsData = generateStaffAssignments(clinicId, flowStatesData, assistants);

        let assignmentCount = 0;
        for (const assignData of assignmentsData) {
          // Check if assignment already exists
          const existingAssignment = await db.staffAssignment.findFirst({
            where: {
              clinicId,
              staffId: assignData.staffId,
              appointmentId: assignData.appointmentId,
            },
          });

          if (!existingAssignment) {
            await db.staffAssignment.create({
              data: {
                clinicId: assignData.clinicId,
                staffId: assignData.staffId,
                appointmentId: assignData.appointmentId,
                role: assignData.role,
                notes: assignData.notes,
                assignedBy: ownerId,
              },
            });
            assignmentCount++;
            totalCreated++;
          }
        }

        logger.info(`  Created ${assignmentCount} staff assignments`);
      }
    }

    // ============================================================================
    // 6. SEED OPERATIONS TASKS
    // ============================================================================
    logger.info('  Seeding operations tasks...');

    const staffIds = staff.map((s) => s.id);
    const tasksData = generateOperationsTasks(clinicId, staffIds, ownerId);

    let taskCount = 0;
    for (const taskData of tasksData) {
      // Check for existing task with same title today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const existingTask = await db.operationsTask.findFirst({
        where: {
          clinicId,
          title: taskData.title,
          createdAt: { gte: today, lt: tomorrow },
        },
      });

      if (!existingTask) {
        const task = await db.operationsTask.create({
          data: {
            clinicId: taskData.clinicId,
            title: taskData.title,
            description: taskData.description,
            type: taskData.type,
            assigneeId: taskData.assigneeId,
            ownerId: taskData.ownerId,
            dueAt: taskData.dueAt,
            completedAt: taskData.completedAt,
            status: taskData.status,
            priority: taskData.priority,
            createdBy: ownerId,
          },
        });
        idTracker.add('OperationsTask', task.id);
        taskCount++;
        totalCreated++;
      }
    }

    logger.info(`  Created ${taskCount} operations tasks`);

    // ============================================================================
    // 7. SEED DAILY METRICS
    // ============================================================================
    logger.info('  Seeding daily metrics...');

    const metricsData = generateDailyMetrics(clinicId, 30);

    let metricsCount = 0;
    for (const metricData of metricsData) {
      // Check if metrics already exist for this date
      const existingMetric = await db.dailyMetrics.findFirst({
        where: {
          clinicId,
          date: metricData.date,
        },
      });

      if (!existingMetric) {
        await db.dailyMetrics.create({
          data: {
            clinicId: metricData.clinicId,
            date: metricData.date,
            scheduledCount: metricData.scheduledCount,
            checkedInCount: metricData.checkedInCount,
            completedCount: metricData.completedCount,
            noShowCount: metricData.noShowCount,
            cancelledCount: metricData.cancelledCount,
            walkInCount: metricData.walkInCount,
            avgWaitMinutes: metricData.avgWaitMinutes,
            avgChairMinutes: metricData.avgChairMinutes,
            onTimePercentage: metricData.onTimePercentage,
            chairUtilization: metricData.chairUtilization,
          },
        });
        metricsCount++;
        totalCreated++;
      }
    }

    logger.info(`  Created ${metricsCount} daily metrics records`);
  }

  logger.endArea('Practice Orchestration', totalCreated);
}

/**
 * Clear Practice Orchestration data
 * Removes all ops-related data
 */
export async function clearOps(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing ops data...');

  // Delete in reverse dependency order
  await db.dailyMetrics.deleteMany({});
  logger.info('  Cleared daily metrics');

  await db.operationsTask.deleteMany({});
  logger.info('  Cleared operations tasks');

  await db.staffAssignment.deleteMany({});
  logger.info('  Cleared staff assignments');

  await db.resourceOccupancy.deleteMany({});
  logger.info('  Cleared resource occupancy');

  await db.flowStageHistory.deleteMany({});
  logger.info('  Cleared flow stage history');

  await db.patientFlowState.deleteMany({});
  logger.info('  Cleared patient flow states');

  await db.floorPlanConfig.deleteMany({});
  logger.info('  Cleared floor plan configs');
}
