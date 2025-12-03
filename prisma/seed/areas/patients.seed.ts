/**
 * Patient seeder - TEMPORARY/BASIC implementation
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
import { SAMPLE_PATIENTS } from '../fixtures/patients.fixture';

/**
 * Seed basic patient data for testing
 */
export async function seedPatients(ctx: SeedContext): Promise<void> {
  const { db, config, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Patients (Basic)');

  let totalCreated = 0;

  // Seed patients for primary clinic only
  const primaryClinicId = clinicIds[0];

  if (!primaryClinicId) {
    logger.warn('No clinic found, skipping patient seeding');
    logger.endArea('Patients (Basic)', 0);
    return;
  }

  // Get an admin user for createdBy
  const adminUser = await db.user.findFirst({
    where: { clinicId: primaryClinicId, role: { in: ['clinic_admin', 'super_admin'] } },
  });

  logger.info('Creating sample patients for booking testing...');

  for (const patientData of SAMPLE_PATIENTS) {
    // Check if patient already exists (by email in this clinic)
    const existing = await db.patient.findFirst({
      where: {
        clinicId: primaryClinicId,
        email: patientData.email,
        deletedAt: null,
      },
    });

    if (!existing) {
      const patient = await db.patient.create({
        data: {
          clinicId: primaryClinicId,
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          email: patientData.email,
          phone: patientData.phone,
          dateOfBirth: patientData.dateOfBirth,
          isActive: true,
          createdBy: adminUser?.id,
        },
      });
      idTracker.add('Patient', patient.id);
      totalCreated++;
    } else {
      idTracker.add('Patient', existing.id);
    }
  }

  logger.info(`  Created ${totalCreated} sample patients`);
  logger.endArea('Patients (Basic)', totalCreated);
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
