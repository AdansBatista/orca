import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function check() {
  // Check if portal account exists
  const account = await db.portalAccount.findFirst({
    where: { email: 'emma.parent@example.com' },
    include: { patient: true }
  });

  console.log('Portal Account:', account ? 'Found' : 'NOT FOUND');
  if (account) {
    console.log('  ID:', account.id);
    console.log('  Email:', account.email);
    console.log('  Status:', account.status);
    console.log('  Email Verified:', account.emailVerified);
    console.log('  Has Password:', !!account.passwordHash);
    console.log('  Patient:', account.patient?.firstName, account.patient?.lastName);
  }

  // Check if patient exists
  const patient = await db.patient.findFirst({
    where: { email: 'emma.parent@example.com' }
  });
  console.log('\nPatient:', patient ? 'Found' : 'NOT FOUND');
  if (patient) {
    console.log('  ID:', patient.id);
    console.log('  Name:', patient.firstName, patient.lastName);
  }

  // Count all portal accounts
  const accountCount = await db.portalAccount.count();
  console.log('\nTotal portal accounts:', accountCount);

  await db.$disconnect();
}

check().catch(console.error);
