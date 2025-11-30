import type { UserRole } from '@prisma/client';
import type { SeedContext } from '../types';
import { createStaffFactory } from '../factories/staff.factory';
import { createFactoryContext } from '../factories/base.factory';
import { orthoGenerator } from '../generators';

// Password hash for "Password123!" - generated with bcrypt
const DEV_PASSWORD_HASH = '$2b$10$GrGlAYs4z/F5A2CVCEZO0OXe5zUfD50zyl.t4ubR9DWBiJmoVYnli';

/**
 * Seed staff profiles for each clinic.
 * Creates a realistic mix of providers and non-providers with
 * credentials, certifications, and emergency contacts.
 *
 * Each staff profile links to a User account, so we create users first.
 */
export async function seedStaff(ctx: SeedContext): Promise<void> {
  const { db, config, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');
  const { staffPerClinic } = config.counts;

  logger.startArea('Staff Profiles');

  let totalStaff = 0;

  for (const clinicId of clinicIds) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    const clinicSlug = clinic?.slug?.replace(/-/g, '') || 'clinic';
    logger.info(`Seeding staff for clinic: ${clinic?.name || clinicId}`);

    // Get a user from this clinic to use as createdBy
    const existingUserIds = idTracker.getByClinic('User', clinicId);
    const createdBy = existingUserIds.length > 0 ? existingUserIds[0] : undefined;

    // Create factory context
    const factoryCtx = createFactoryContext(db, idTracker, clinicId, createdBy);
    const staffFactory = createStaffFactory(factoryCtx);

    // Distribution: create specific role types for realism
    const distribution = calculateStaffDistribution(staffPerClinic);

    // Helper to create a user for staff
    async function createStaffUser(
      firstName: string,
      lastName: string,
      role: UserRole,
      emailPrefix: string,
      index: number
    ): Promise<string> {
      const email = `${emailPrefix}${index > 0 ? index + 1 : ''}@${clinicSlug}.staff.local`;
      const user = await db.user.create({
        data: {
          email,
          firstName,
          lastName,
          passwordHash: DEV_PASSWORD_HASH,
          role,
          isActive: true,
          clinicId,
          clinicIds: [clinicId],
        },
      });
      idTracker.add('User', user.id, clinicId);
      return user.id;
    }

    // Create orthodontists (providers)
    for (let i = 0; i < distribution.orthodontists; i++) {
      const { firstName, lastName } = orthoGenerator.patientName(40);
      const userId = await createStaffUser(firstName, lastName, 'doctor', `dr.${lastName.toLowerCase()}`, i);
      await staffFactory.createComplete({
        traits: ['orthodontist', 'fullTime'],
        overrides: { userId, firstName, lastName },
      });
      totalStaff++;
    }
    logger.info(`  Created ${distribution.orthodontists} orthodontist(s)`);

    // Create hygienists
    for (let i = 0; i < distribution.hygienists; i++) {
      const { firstName, lastName } = orthoGenerator.patientName(30);
      const userId = await createStaffUser(firstName, lastName, 'clinical_staff', `${firstName.toLowerCase()}.${lastName.toLowerCase()}`, i);
      const trait = Math.random() < 0.7 ? 'fullTime' : 'partTime';
      await staffFactory.createComplete({
        traits: ['hygienist', trait],
        overrides: { userId, firstName, lastName },
      });
      totalStaff++;
    }
    logger.info(`  Created ${distribution.hygienists} hygienist(s)`);

    // Create dental assistants
    for (let i = 0; i < distribution.assistants; i++) {
      const { firstName, lastName } = orthoGenerator.patientName(28);
      const userId = await createStaffUser(firstName, lastName, 'clinical_staff', `${firstName.toLowerCase()}.${lastName.toLowerCase()}`, i);
      const trait = Math.random() < 0.8 ? 'fullTime' : 'partTime';
      await staffFactory.createComplete({
        traits: ['assistant', trait],
        overrides: { userId, firstName, lastName },
      });
      totalStaff++;
    }
    logger.info(`  Created ${distribution.assistants} dental assistant(s)`);

    // Create front office staff
    for (let i = 0; i < distribution.frontOffice; i++) {
      const { firstName, lastName } = orthoGenerator.patientName(32);
      const userId = await createStaffUser(firstName, lastName, 'front_desk', `frontoffice.${lastName.toLowerCase()}`, i);
      await staffFactory.createComplete({
        traits: ['frontOffice', 'fullTime'],
        overrides: { userId, firstName, lastName },
      });
      totalStaff++;
    }
    logger.info(`  Created ${distribution.frontOffice} front office staff`);

    // Create billing staff
    for (let i = 0; i < distribution.billing; i++) {
      const { firstName, lastName } = orthoGenerator.patientName(35);
      const userId = await createStaffUser(firstName, lastName, 'billing', `billing.${lastName.toLowerCase()}`, i);
      const trait = Math.random() < 0.6 ? 'fullTime' : 'partTime';
      await staffFactory.createComplete({
        traits: ['billing', trait],
        overrides: { userId, firstName, lastName },
      });
      totalStaff++;
    }
    logger.info(`  Created ${distribution.billing} billing staff`);
  }

  logger.endArea('Staff Profiles', totalStaff);
}

/**
 * Calculate staff distribution by role based on total staff count.
 * Realistic orthodontic practice typically has:
 * - 1-3 orthodontists
 * - 2-4 hygienists
 * - 3-6 dental assistants
 * - 2-4 front office
 * - 1-2 billing
 */
function calculateStaffDistribution(totalStaff: number): {
  orthodontists: number;
  hygienists: number;
  assistants: number;
  frontOffice: number;
  billing: number;
} {
  // Minimum distribution
  if (totalStaff <= 5) {
    return {
      orthodontists: 1,
      hygienists: 1,
      assistants: 1,
      frontOffice: 1,
      billing: 1,
    };
  }

  // Standard distribution ratios
  const orthodontists = Math.max(1, Math.floor(totalStaff * 0.1)); // ~10%
  const hygienists = Math.max(2, Math.floor(totalStaff * 0.2)); // ~20%
  const assistants = Math.max(2, Math.floor(totalStaff * 0.35)); // ~35%
  const frontOffice = Math.max(2, Math.floor(totalStaff * 0.2)); // ~20%
  const billing = Math.max(1, totalStaff - orthodontists - hygienists - assistants - frontOffice); // Remainder

  return { orthodontists, hygienists, assistants, frontOffice, billing };
}

/**
 * Clear all staff data.
 */
export async function clearStaff(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing staff data...');

  // Clear in correct order due to foreign keys
  await db.emergencyContact.deleteMany({});
  await db.employmentRecord.deleteMany({});
  await db.staffDocument.deleteMany({});
  await db.certification.deleteMany({});
  await db.credential.deleteMany({});
  await db.staffProfile.deleteMany({});

  logger.info('Staff data cleared');
}
