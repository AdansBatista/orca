/**
 * Patient seeder - Seeds patients for ALL clinics
 *
 * NOTE: This is a basic patient seeder created for testing booking functionality.
 * When the Patient Management area is implemented (Phase 2), this seeder should be
 * significantly expanded to include:
 *
 * - Full patient demographics (address, SSN/ID, emergency contacts)
 * - Insurance information
 * - Medical/dental history
 * - Treatment plans and progress
 * - Responsible party/guarantor information
 * - Referral tracking
 * - Communication preferences
 * - Document attachments
 *
 * @see docs/areas/patients/README.md (when created)
 * @todo Expand this seeder when implementing Patient Management area
 */

import type { SeedContext } from '../types';
import { generatePatientsForClinic } from '../fixtures/patients.fixture';
import { withSoftDelete } from '../utils/soft-delete';

/**
 * Seed patient data for ALL clinics.
 * Each clinic gets an equal number of patients.
 */
export async function seedPatients(ctx: SeedContext): Promise<void> {
  const { db, config, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Patients');

  if (clinicIds.length === 0) {
    logger.warn('No clinics found, skipping patient seeding');
    logger.endArea('Patients', 0);
    return;
  }

  let totalCreated = 0;
  const patientsPerClinic = config.counts.patientsPerClinic;

  // Seed patients for EVERY clinic (not just primary!)
  for (let clinicIndex = 0; clinicIndex < clinicIds.length; clinicIndex++) {
    const clinicId = clinicIds[clinicIndex];
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`Seeding patients for clinic ${clinicIndex + 1}/${clinicIds.length}: ${clinic?.name || clinicId}`);

    // Get an admin user for createdBy
    const adminUser = await db.user.findFirst({
      where: { clinicId, role: { in: ['clinic_admin', 'super_admin'] } },
    });

    if (!adminUser) {
      logger.warn(`  No admin user found for clinic ${clinicId}, using null for createdBy`);
    }

    // Generate patients specific to this clinic
    const patientsData = generatePatientsForClinic(clinicIndex, patientsPerClinic);
    let clinicPatientCount = 0;

    for (const patientData of patientsData) {
      // Check if patient already exists (by email in this clinic)
      const existing = await db.patient.findFirst({
        where: withSoftDelete({
          clinicId,
          email: patientData.email,
        }),
      });

      if (!existing) {
        const patient = await db.patient.create({
          data: {
            clinicId,
            firstName: patientData.firstName,
            lastName: patientData.lastName,
            email: patientData.email,
            phone: patientData.phone,
            dateOfBirth: patientData.dateOfBirth,
            isActive: true,
            createdBy: adminUser?.id,
            deletedAt: null, // Explicit for soft-delete queries
          },
        });
        idTracker.add('Patient', patient.id, clinicId);
        clinicPatientCount++;
        totalCreated++;
      } else {
        // Track existing patient ID
        idTracker.add('Patient', existing.id, clinicId);
      }
    }

    logger.info(`  Created ${clinicPatientCount} patients (${patientsData.length - clinicPatientCount} already existed)`);
  }

  logger.success(`Total patients created: ${totalCreated} across ${clinicIds.length} clinics`);
  logger.endArea('Patients', totalCreated);
}

/**
 * Clear patient data
 */
export async function clearPatients(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing patient data...');

  // Note: Appointments reference patients, so they should be cleared first
  // The booking.seed.ts clearBooking should run before this
  await db.patient.deleteMany({});

  logger.info('  Patient data cleared');
}
