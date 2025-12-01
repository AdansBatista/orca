import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const users = await db.user.findMany({
    select: { id: true, email: true, role: true, clinicId: true, firstName: true, lastName: true },
    take: 10,
  });
  console.log('Users:');
  users.forEach((u) =>
    console.log(`  ${u.email} | role: ${u.role} | clinicId: ${u.clinicId || 'NULL'}`)
  );

  const equipment = await db.equipment.findMany({
    take: 3,
    select: { id: true, name: true, clinicId: true },
  });
  console.log('\nEquipment:');
  equipment.forEach((e) => console.log(`  ${e.name} | clinicId: ${e.clinicId}`));

  const suppliers = await db.supplier.findMany({
    take: 3,
    select: { id: true, name: true, clinicId: true },
  });
  console.log('\nSuppliers:');
  suppliers.forEach((s) => console.log(`  ${s.name} | clinicId: ${s.clinicId}`));

  const clinics = await db.clinic.findMany({ select: { id: true, name: true } });
  console.log('\nClinics:');
  clinics.forEach((c) => console.log(`  ${c.id} | ${c.name}`));

  // Check role permissions
  const roles = await db.role.findMany({
    select: { name: true, permissions: true },
  });
  console.log('\nRoles and equipment permissions:');
  roles.forEach((r) => {
    const equipPerms = r.permissions.filter((p) => p.includes('equipment'));
    console.log(
      '  ' + r.name + ': ' + (equipPerms.length ? equipPerms.join(', ') : 'NO EQUIPMENT PERMS')
    );
  });
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
