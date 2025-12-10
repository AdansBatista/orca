import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const db = new PrismaClient();

async function createPortalAccount() {
  // Find Emma's patient record
  const patient = await db.patient.findFirst({
    where: { email: 'emma.parent@example.com' }
  });

  if (!patient) {
    console.log('Patient not found');
    return;
  }

  console.log('Found patient:', patient.firstName, patient.lastName);

  // Check if account already exists
  const existing = await db.portalAccount.findFirst({
    where: { patientId: patient.id }
  });

  if (existing) {
    console.log('Portal account already exists');
    return;
  }

  // Create password hash
  const passwordHash = await bcrypt.hash('Portal123!', 12);

  // Create portal account
  const account = await db.portalAccount.create({
    data: {
      clinicId: patient.clinicId,
      patientId: patient.id,
      email: patient.email!,
      passwordHash,
      status: 'ACTIVE',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      termsAcceptedAt: new Date(),
      privacyAcceptedAt: new Date(),
    }
  });

  console.log('Created portal account:', account.id);
  console.log('Email:', account.email);
  console.log('Password: Portal123!');

  await db.$disconnect();
}

createPortalAccount().catch(console.error);
