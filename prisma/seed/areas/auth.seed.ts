import type { SeedContext } from '../types';
import { SYSTEM_ROLES, CUSTOM_ROLES, getPermissionsForRole } from '../fixtures';
import { orthoGenerator } from '../generators';
// import bcrypt from 'bcryptjs';  // Uncomment when bcrypt is installed

/**
 * Seed roles and permissions.
 * These are system-wide (not clinic-scoped).
 */
export async function seedRoles(ctx: SeedContext): Promise<void> {
  const { db, idTracker, logger } = ctx;

  logger.startArea('Roles & Permissions');

  // Create system roles
  for (const roleData of SYSTEM_ROLES) {
    const permissions = getPermissionsForRole(roleData.code);

    const role = await db.role.create({
      data: {
        code: roleData.code,
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem,
        permissions: permissions,
      },
    });

    idTracker.add('Role', role.id);
    logger.info(`Created system role: ${role.name}`);
  }

  // Create custom roles (demo/example roles)
  for (const roleData of CUSTOM_ROLES) {
    const role = await db.role.create({
      data: {
        code: roleData.code,
        name: roleData.name,
        description: roleData.description,
        isSystem: roleData.isSystem,
        permissions: roleData.permissions,
      },
    });

    idTracker.add('Role', role.id);
    logger.info(`Created custom role: ${role.name}`);
  }

  logger.endArea('Roles & Permissions', SYSTEM_ROLES.length + CUSTOM_ROLES.length);
}

/**
 * Seed users for each clinic.
 */
export async function seedUsers(ctx: SeedContext): Promise<void> {
  const { db, config, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');
  const { usersPerClinic } = config.counts;

  logger.startArea('Users');

  // Get role IDs for assignment
  const roles = await db.role.findMany();
  const roleMap = new Map(roles.map((r: any) => [r.code, r.id]));

  // Password hash for "Password123!" - generated with bcrypt
  const passwordHash = '$2b$10$GrGlAYs4z/F5A2CVCEZO0OXe5zUfD50zyl.t4ubR9DWBiJmoVYnli';

  let totalUsers = 0;

  // Create super admin (system-wide, primary clinic is first one)
  const superAdmin = await db.user.create({
    data: {
      email: 'admin@system.local',
      firstName: 'System',
      lastName: 'Administrator',
      passwordHash,
      role: 'super_admin',
      isActive: true,
      clinicId: clinicIds[0], // Primary clinic (required)
      clinicIds: clinicIds, // Access to all clinics
    },
  });
  idTracker.add('User', superAdmin.id);
  totalUsers++;

  // Create role assignment for super admin
  await db.roleAssignment.create({
    data: {
      userId: superAdmin.id,
      roleId: roleMap.get('super_admin')!,
      clinicId: clinicIds[0], // Primary clinic
      assignedAt: new Date(),
      assignedBy: superAdmin.id, // Self-assigned for system bootstrap
    },
  });

  logger.info(`Created super admin: ${superAdmin.email}`);

  // Create users for each clinic
  for (const clinicId of clinicIds) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    const clinicSlug = clinic?.slug?.replace(/-/g, '') || 'clinic';

    // Distribution of users by role
    const userDistribution = calculateUserDistribution(usersPerClinic);

    // Create clinic admin
    const adminProfile = orthoGenerator.patientName(35);
    const clinicAdmin = await db.user.create({
      data: {
        email: `admin@${clinicSlug}.smileortho.com`,
        firstName: adminProfile.firstName,
        lastName: adminProfile.lastName,
        passwordHash,
        role: 'clinic_admin',
        isActive: true,
        clinicId,
        clinicIds: [clinicId],
      },
    });
    idTracker.add('User', clinicAdmin.id, clinicId);

    await db.roleAssignment.create({
      data: {
        userId: clinicAdmin.id,
        roleId: roleMap.get('clinic_admin')!,
        clinicId,
        assignedAt: new Date(),
        assignedBy: superAdmin.id,
      },
    });
    totalUsers++;
    logger.info(`Created clinic admin: ${clinicAdmin.email}`);

    // Create doctors
    for (let i = 0; i < userDistribution.doctors; i++) {
      const profile = orthoGenerator.patientName(40);
      const user = await db.user.create({
        data: {
          email: `dr.${profile.lastName.toLowerCase()}${i > 0 ? i + 1 : ''}@${clinicSlug}.smileortho.com`,
          firstName: profile.firstName,
          lastName: profile.lastName,
          passwordHash,
          role: 'doctor',
          isActive: true,
          clinicId,
          clinicIds: [clinicId],
        },
      });
      idTracker.add('User', user.id, clinicId);

      await db.roleAssignment.create({
        data: {
          userId: user.id,
          roleId: roleMap.get('doctor')!,
          clinicId,
          assignedAt: new Date(),
          assignedBy: clinicAdmin.id,
        },
      });
      totalUsers++;
    }

    // Create clinical staff
    for (let i = 0; i < userDistribution.clinicalStaff; i++) {
      const profile = orthoGenerator.patientName(30);
      const user = await db.user.create({
        data: {
          email: `${profile.firstName.toLowerCase()}.${profile.lastName.toLowerCase()}${i > 0 ? i + 1 : ''}@${clinicSlug}.smileortho.com`,
          firstName: profile.firstName,
          lastName: profile.lastName,
          passwordHash,
          role: 'clinical_staff',
          isActive: true,
          clinicId,
          clinicIds: [clinicId],
        },
      });
      idTracker.add('User', user.id, clinicId);

      await db.roleAssignment.create({
        data: {
          userId: user.id,
          roleId: roleMap.get('clinical_staff')!,
          clinicId,
          assignedAt: new Date(),
          assignedBy: clinicAdmin.id,
        },
      });
      totalUsers++;
    }

    // Create front desk staff
    for (let i = 0; i < userDistribution.frontDesk; i++) {
      const profile = orthoGenerator.patientName(28);
      const user = await db.user.create({
        data: {
          email: `frontdesk${i > 0 ? i + 1 : ''}@${clinicSlug}.smileortho.com`,
          firstName: profile.firstName,
          lastName: profile.lastName,
          passwordHash,
          role: 'front_desk',
          isActive: true,
          clinicId,
          clinicIds: [clinicId],
        },
      });
      idTracker.add('User', user.id, clinicId);

      await db.roleAssignment.create({
        data: {
          userId: user.id,
          roleId: roleMap.get('front_desk')!,
          clinicId,
          assignedAt: new Date(),
          assignedBy: clinicAdmin.id,
        },
      });
      totalUsers++;
    }

    // Create billing staff
    for (let i = 0; i < userDistribution.billing; i++) {
      const profile = orthoGenerator.patientName(32);
      const user = await db.user.create({
        data: {
          email: `billing${i > 0 ? i + 1 : ''}@${clinicSlug}.smileortho.com`,
          firstName: profile.firstName,
          lastName: profile.lastName,
          passwordHash,
          role: 'billing',
          isActive: true,
          clinicId,
          clinicIds: [clinicId],
        },
      });
      idTracker.add('User', user.id, clinicId);

      await db.roleAssignment.create({
        data: {
          userId: user.id,
          roleId: roleMap.get('billing')!,
          clinicId,
          assignedAt: new Date(),
          assignedBy: clinicAdmin.id,
        },
      });
      totalUsers++;
    }
  }

  logger.endArea('Users', totalUsers);
}

/**
 * Calculate user distribution by role based on total user count.
 */
function calculateUserDistribution(totalUsers: number): {
  doctors: number;
  clinicalStaff: number;
  frontDesk: number;
  billing: number;
} {
  // Subtract 1 for clinic admin
  const remaining = Math.max(totalUsers - 1, 0);

  // Distribution: ~10% doctors, ~40% clinical, ~30% front desk, ~20% billing
  const doctors = Math.max(Math.floor(remaining * 0.1), 1);
  const clinicalStaff = Math.max(Math.floor(remaining * 0.4), 1);
  const frontDesk = Math.max(Math.floor(remaining * 0.3), 1);
  const billing = Math.max(remaining - doctors - clinicalStaff - frontDesk, 1);

  return { doctors, clinicalStaff, frontDesk, billing };
}

/**
 * Clear auth data (users, roles, role assignments).
 */
export async function clearAuth(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing auth data...');

  // Clear in correct order due to foreign keys
  await db.roleAssignment.deleteMany({});
  await db.user.deleteMany({});
  await db.role.deleteMany({});

  logger.info('Auth data cleared');
}
