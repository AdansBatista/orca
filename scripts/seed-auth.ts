/**
 * Quick seed script for auth testing
 * Run with: npx tsx scripts/seed-auth.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

// Default password for all seed users
const DEFAULT_PASSWORD = 'Password1';

// Permissions for each role
const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  clinic_admin: [
    'patients:full',
    'appointments:full',
    'treatments:full',
    'billing:full',
    'reports:full',
    'documents:full',
    'messages:full',
    'settings:full',
    'users:full',
    'audit:view',
  ],
  doctor: [
    'patients:full',
    'appointments:full',
    'treatments:full',
    'billing:view',
    'reports:view',
    'documents:full',
    'messages:full',
  ],
  clinical_staff: [
    'patients:edit',
    'appointments:edit',
    'treatments:view',
    'documents:edit',
    'messages:view',
  ],
  front_desk: [
    'patients:edit',
    'appointments:full',
    'billing:view',
    'documents:view',
    'messages:full',
  ],
  billing: [
    'patients:view',
    'appointments:view',
    'billing:full',
    'reports:view',
    'documents:view',
  ],
  read_only: [
    'patients:view',
    'appointments:view',
    'treatments:view',
    'billing:view',
    'reports:view',
    'documents:view',
  ],
};

async function main() {
  console.log('🌱 Seeding auth data...\n');

  // Hash password
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  console.log(`📝 Default password for all users: ${DEFAULT_PASSWORD}\n`);

  // Create roles
  console.log('Creating roles...');
  const roles = await Promise.all([
    db.role.upsert({
      where: { code: 'super_admin' },
      update: {},
      create: {
        code: 'super_admin',
        name: 'Super Admin',
        description: 'Full system access across all clinics',
        isSystem: true,
        permissions: ROLE_PERMISSIONS.super_admin,
      },
    }),
    db.role.upsert({
      where: { code: 'clinic_admin' },
      update: {},
      create: {
        code: 'clinic_admin',
        name: 'Clinic Admin',
        description: 'Full access within assigned clinic(s)',
        isSystem: true,
        permissions: ROLE_PERMISSIONS.clinic_admin,
      },
    }),
    db.role.upsert({
      where: { code: 'doctor' },
      update: {},
      create: {
        code: 'doctor',
        name: 'Doctor',
        description: 'Clinical access with treatment authority',
        isSystem: true,
        permissions: ROLE_PERMISSIONS.doctor,
      },
    }),
    db.role.upsert({
      where: { code: 'clinical_staff' },
      update: {},
      create: {
        code: 'clinical_staff',
        name: 'Clinical Staff',
        description: 'Patient care support',
        isSystem: true,
        permissions: ROLE_PERMISSIONS.clinical_staff,
      },
    }),
    db.role.upsert({
      where: { code: 'front_desk' },
      update: {},
      create: {
        code: 'front_desk',
        name: 'Front Desk',
        description: 'Scheduling and communications',
        isSystem: true,
        permissions: ROLE_PERMISSIONS.front_desk,
      },
    }),
    db.role.upsert({
      where: { code: 'billing' },
      update: {},
      create: {
        code: 'billing',
        name: 'Billing',
        description: 'Financial operations',
        isSystem: true,
        permissions: ROLE_PERMISSIONS.billing,
      },
    }),
    db.role.upsert({
      where: { code: 'read_only' },
      update: {},
      create: {
        code: 'read_only',
        name: 'Read Only',
        description: 'View-only access',
        isSystem: true,
        permissions: ROLE_PERMISSIONS.read_only,
      },
    }),
  ]);
  console.log(`✅ Created ${roles.length} roles\n`);

  // Create demo clinic
  console.log('Creating demo clinic...');
  const clinic = await db.clinic.upsert({
    where: { slug: 'smile-orthodontics' },
    update: {},
    create: {
      name: 'Smile Orthodontics',
      slug: 'smile-orthodontics',
      address: '123 Main Street, Toronto, ON M5V 1A1',
      phone: '(416) 555-0123',
      email: 'info@smileortho.com',
      timezone: 'America/Toronto',
      isActive: true,
    },
  });
  console.log(`✅ Created clinic: ${clinic.name}\n`);

  // Create users
  console.log('Creating users...');

  // Super Admin
  const superAdmin = await db.user.upsert({
    where: { email: 'admin@orca.local' },
    update: { passwordHash },
    create: {
      email: 'admin@orca.local',
      passwordHash,
      firstName: 'System',
      lastName: 'Admin',
      role: 'super_admin',
      clinicId: clinic.id,
      clinicIds: [clinic.id],
      isActive: true,
    },
  });
  console.log(`  👤 Super Admin: admin@orca.local`);

  // Clinic Admin
  const clinicAdmin = await db.user.upsert({
    where: { email: 'manager@smileortho.com' },
    update: { passwordHash },
    create: {
      email: 'manager@smileortho.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'clinic_admin',
      clinicId: clinic.id,
      clinicIds: [clinic.id],
      isActive: true,
    },
  });
  console.log(`  👤 Clinic Admin: manager@smileortho.com`);

  // Doctor
  const doctor = await db.user.upsert({
    where: { email: 'dr.smith@smileortho.com' },
    update: { passwordHash },
    create: {
      email: 'dr.smith@smileortho.com',
      passwordHash,
      firstName: 'Michael',
      lastName: 'Smith',
      role: 'doctor',
      clinicId: clinic.id,
      clinicIds: [clinic.id],
      isActive: true,
    },
  });
  console.log(`  �� Doctor: dr.smith@smileortho.com`);

  // Clinical Staff
  const clinicalStaff = await db.user.upsert({
    where: { email: 'nurse@smileortho.com' },
    update: { passwordHash },
    create: {
      email: 'nurse@smileortho.com',
      passwordHash,
      firstName: 'Emily',
      lastName: 'Davis',
      role: 'clinical_staff',
      clinicId: clinic.id,
      clinicIds: [clinic.id],
      isActive: true,
    },
  });
  console.log(`  👤 Clinical Staff: nurse@smileortho.com`);

  // Front Desk
  const frontDesk = await db.user.upsert({
    where: { email: 'reception@smileortho.com' },
    update: { passwordHash },
    create: {
      email: 'reception@smileortho.com',
      passwordHash,
      firstName: 'Jessica',
      lastName: 'Wilson',
      role: 'front_desk',
      clinicId: clinic.id,
      clinicIds: [clinic.id],
      isActive: true,
    },
  });
  console.log(`  👤 Front Desk: reception@smileortho.com`);

  // Billing
  const billingUser = await db.user.upsert({
    where: { email: 'billing@smileortho.com' },
    update: { passwordHash },
    create: {
      email: 'billing@smileortho.com',
      passwordHash,
      firstName: 'Robert',
      lastName: 'Brown',
      role: 'billing',
      clinicId: clinic.id,
      clinicIds: [clinic.id],
      isActive: true,
    },
  });
  console.log(`  👤 Billing: billing@smileortho.com`);

  console.log('\n✅ Auth seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Email: admin@orca.local`);
  console.log(`  Password: ${DEFAULT_PASSWORD}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
