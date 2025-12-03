import type { SeedContext } from '../types';
import { DEFAULT_APPOINTMENT_TYPES, generateSampleAppointments } from '../fixtures/booking.fixture';

/**
 * Seed booking data: Appointment types and sample appointments
 *
 * This creates:
 * 1. Default appointment types for each clinic
 * 2. Sample appointments for testing (standard/full mode only)
 */
export async function seedBooking(ctx: SeedContext): Promise<void> {
  const { db, config, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Booking');

  let totalTypesCreated = 0;
  let totalAppointmentsCreated = 0;

  // ============================================================================
  // 1. SEED APPOINTMENT TYPES FOR EACH CLINIC
  // ============================================================================
  for (const clinicId of clinicIds) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`Seeding appointment types for clinic: ${clinic?.name || clinicId}`);

    // Get a user from this clinic to use as createdBy
    const adminUser = await db.user.findFirst({
      where: { clinicId, role: { in: ['clinic_admin', 'super_admin'] } },
    });
    const createdBy = adminUser?.id;

    for (const typeData of DEFAULT_APPOINTMENT_TYPES) {
      // Check if type already exists for this clinic
      const existingType = await db.appointmentType.findFirst({
        where: { clinicId, code: typeData.code },
      });

      if (!existingType) {
        const appointmentType = await db.appointmentType.create({
          data: {
            clinicId,
            code: typeData.code,
            name: typeData.name,
            description: typeData.description,
            defaultDuration: typeData.defaultDuration,
            minDuration: typeData.minDuration,
            maxDuration: typeData.maxDuration,
            color: typeData.color,
            icon: typeData.icon,
            requiresChair: typeData.requiresChair,
            requiresRoom: typeData.requiresRoom,
            prepTime: typeData.prepTime,
            cleanupTime: typeData.cleanupTime,
            isActive: typeData.isActive,
            allowOnline: typeData.allowOnline,
            sortOrder: typeData.sortOrder,
            createdBy,
          },
        });
        idTracker.add('AppointmentType', appointmentType.id);
        totalTypesCreated++;
      } else {
        idTracker.add('AppointmentType', existingType.id);
      }
    }

    logger.info(`  Created ${DEFAULT_APPOINTMENT_TYPES.length} appointment types`);
  }

  // ============================================================================
  // 2. SEED SAMPLE APPOINTMENTS (only in standard/full mode)
  // ============================================================================
  if (config.mode !== 'minimal') {
    logger.info('Seeding sample appointments...');

    // For the primary clinic, create sample appointments
    const primaryClinicId = clinicIds[0];

    if (primaryClinicId) {
      // Get patients from this clinic (not soft-deleted)
      // Note: MongoDB requires OR with isSet:false for null checks
      const patients = await db.patient.findMany({
        where: {
          clinicId: primaryClinicId,
          OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }],
        },
        take: 20,
        select: { id: true },
      });

      // Get providers (staff with provider role) from this clinic
      const providers = await db.staffProfile.findMany({
        where: {
          clinicId: primaryClinicId,
          status: 'ACTIVE',
          providerType: { not: null },
        },
        take: 5,
        select: { id: true },
      });

      // Get chairs from this clinic
      const chairs = await db.treatmentChair.findMany({
        where: {
          room: { clinicId: primaryClinicId },
        },
        take: 10,
        select: { id: true },
      });

      // Get appointment types for this clinic
      const appointmentTypes = await db.appointmentType.findMany({
        where: { clinicId: primaryClinicId, isActive: true },
        select: { id: true, code: true },
      });

      logger.info(`  Found: ${patients.length} patients, ${providers.length} providers, ${appointmentTypes.length} types, ${chairs.length} chairs`);

      if (patients.length > 0 && providers.length > 0 && appointmentTypes.length > 0) {
        const patientIds = patients.map((p) => p.id);
        const providerIds = providers.map((p) => p.id);
        const chairIds = chairs.map((c) => c.id);
        const appointmentTypeMap = new Map(appointmentTypes.map((t) => [t.code, t.id]));

        // Get a booking user (front desk or admin)
        const bookingUser = await db.user.findFirst({
          where: {
            clinicId: primaryClinicId,
            role: { in: ['front_desk', 'clinic_admin', 'super_admin'] },
          },
        });

        const sampleAppointments = generateSampleAppointments(
          patientIds,
          providerIds,
          appointmentTypeMap,
          chairIds
        );

        for (const apptData of sampleAppointments) {
          // Calculate end time
          const endTime = new Date(apptData.startTime.getTime() + apptData.duration * 60 * 1000);

          // Check for conflicts before creating
          // Note: MongoDB null check requires AND + OR combination
          const conflict = await db.appointment.findFirst({
            where: {
              providerId: apptData.providerId,
              status: { notIn: ['CANCELLED', 'NO_SHOW'] },
              AND: [
                { OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }] },
                {
                  OR: [
                    {
                      startTime: { lte: apptData.startTime },
                      endTime: { gt: apptData.startTime },
                    },
                    {
                      startTime: { lt: endTime },
                      endTime: { gte: endTime },
                    },
                  ],
                },
              ],
            },
          });

          if (!conflict) {
            const appointment = await db.appointment.create({
              data: {
                clinicId: primaryClinicId,
                patientId: apptData.patientId,
                providerId: apptData.providerId,
                appointmentTypeId: apptData.appointmentTypeId,
                chairId: apptData.chairId,
                startTime: apptData.startTime,
                endTime,
                duration: apptData.duration,
                status: apptData.status,
                confirmationStatus: apptData.status === 'CONFIRMED' ? 'CONFIRMED' : 'UNCONFIRMED',
                source: apptData.source,
                bookedBy: bookingUser?.id || providerIds[0],
                notes: apptData.notes,
              },
            });
            idTracker.add('Appointment', appointment.id);
            totalAppointmentsCreated++;
          }
        }

        logger.info(`  Created ${totalAppointmentsCreated} sample appointments`);
      } else {
        logger.info('  Skipping appointments - missing required data (patients, providers, or types)');
      }
    }
  }

  logger.endArea('Booking', totalTypesCreated + totalAppointmentsCreated);
}

/**
 * Clear booking data
 * Removes appointments and appointment types
 */
export async function clearBooking(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing booking data...');

  // Delete appointments first (depends on appointment types)
  await db.appointment.deleteMany({});
  logger.info('  Cleared appointments');

  // Delete appointment types
  await db.appointmentType.deleteMany({});
  logger.info('  Cleared appointment types');
}
