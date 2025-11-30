import type { SeedContext } from '../types';
import { createStaffFactory } from '../factories/staff.factory';
import { createFactoryContext } from '../factories/base.factory';

/**
 * Seed staff profiles for each clinic.
 * Creates StaffProfiles linked to existing auth users (created by auth.seed).
 *
 * This ensures data consistency:
 * - Users created by auth.seed have RoleAssignments
 * - This seed creates StaffProfiles linked to those same users
 * - Result: all users have both RoleAssignments AND StaffProfiles
 */
export async function seedStaff(ctx: SeedContext): Promise<void> {
  const { db, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Staff Profiles');

  let totalStaff = 0;

  for (const clinicId of clinicIds) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`Seeding staff profiles for clinic: ${clinic?.name || clinicId}`);

    // Get existing users from this clinic (created by auth.seed)
    const existingUserIds = idTracker.getByClinic('User', clinicId);

    if (existingUserIds.length === 0) {
      logger.info(`  No users found for clinic ${clinicId}, skipping...`);
      continue;
    }

    // Fetch the actual user data to get their roles and names
    const users = await db.user.findMany({
      where: { id: { in: existingUserIds } },
    });

    // Get a user to use as createdBy (prefer clinic_admin)
    const adminUser = users.find((u) => u.role === 'clinic_admin') || users[0];
    const createdBy = adminUser?.id;

    // Create factory context
    const factoryCtx = createFactoryContext(db, idTracker, clinicId, createdBy);
    const staffFactory = createStaffFactory(factoryCtx);

    // Map user roles to staff traits
    const roleToTraits: Record<string, string[]> = {
      clinic_admin: ['frontOffice', 'fullTime'], // Admins are typically management
      doctor: ['orthodontist', 'fullTime'],
      clinical_staff: ['assistant', 'fullTime'], // Default, will vary
      front_desk: ['frontOffice', 'fullTime'],
      billing: ['billing', 'fullTime'],
    };

    let clinicalStaffIndex = 0;

    for (const user of users) {
      // Skip super_admin - they're system users, not staff
      if (user.role === 'super_admin') {
        continue;
      }

      // Get traits based on role
      let traits = roleToTraits[user.role] || ['frontOffice', 'fullTime'];

      // For clinical_staff, alternate between hygienist and assistant
      if (user.role === 'clinical_staff') {
        const staffType = clinicalStaffIndex % 2 === 0 ? 'hygienist' : 'assistant';
        const employment = Math.random() < 0.7 ? 'fullTime' : 'partTime';
        traits = [staffType, employment];
        clinicalStaffIndex++;
      }

      // Create staff profile linked to existing user
      await staffFactory.createComplete({
        traits: traits as ['orthodontist' | 'hygienist' | 'assistant' | 'frontOffice' | 'billing', 'fullTime' | 'partTime'],
        overrides: {
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      });

      totalStaff++;
    }

    logger.info(`  Created ${users.filter((u) => u.role !== 'super_admin').length} staff profile(s)`);
  }

  logger.endArea('Staff Profiles', totalStaff);
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
