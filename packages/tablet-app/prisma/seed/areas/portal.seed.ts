/**
 * Portal Account seeder - Creates portal accounts for patients
 *
 * This seeder creates portal accounts for a subset of patients to enable
 * testing of the patient portal functionality.
 *
 * Test credentials:
 * - Email: emma.parent@example.com (or any seeded patient email)
 * - Password: Portal123!
 */

import bcrypt from 'bcryptjs';
import type { SeedContext } from '../types';
import { withSoftDelete } from '../utils/soft-delete';
import { generateObjectId } from '../factories';

/**
 * Default test password for all seeded portal accounts
 * In production, each patient would set their own password
 */
const TEST_PASSWORD = 'Portal123!';

/**
 * Number of patients per clinic to create portal accounts for
 */
const PORTAL_ACCOUNTS_PER_CLINIC = 5;

/**
 * Seed portal accounts for patients
 */
export async function seedPortal(ctx: SeedContext): Promise<void> {
  const { db, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Portal');

  if (clinicIds.length === 0) {
    logger.warn('No clinics found, skipping portal seeding');
    logger.endArea('Portal', 0);
    return;
  }

  // Pre-hash the test password (same hash for all accounts for efficiency)
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  let totalCreated = 0;

  for (const clinicId of clinicIds) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`Seeding portal accounts for clinic: ${clinic?.name || clinicId}`);

    // Get patients for this clinic (first N patients)
    const patients = await db.patient.findMany({
      where: withSoftDelete({ clinicId }),
      take: PORTAL_ACCOUNTS_PER_CLINIC,
      orderBy: { createdAt: 'asc' },
    });

    let clinicAccountCount = 0;

    for (const patient of patients) {
      // Check if portal account already exists
      const existing = await db.portalAccount.findFirst({
        where: { patientId: patient.id },
      });

      if (!existing && patient.email) {
        await db.portalAccount.create({
          data: {
            clinicId,
            patientId: patient.id,
            email: patient.email,
            passwordHash,
            status: 'ACTIVE',
            emailVerified: true,
            emailVerifiedAt: new Date(),
            termsAcceptedAt: new Date(),
            privacyAcceptedAt: new Date(),
            deletedAt: null, // Explicit for MongoDB null queries
          },
        });
        clinicAccountCount++;
        totalCreated++;
      }
    }

    logger.info(`  Created ${clinicAccountCount} portal accounts`);
  }

  // Create unread messages for the first patient (Emma) to test portal notifications
  const firstClinicId = clinicIds[0];
  const emmaPatient = await db.patient.findFirst({
    where: withSoftDelete({
      clinicId: firstClinicId,
      email: { contains: 'emma' },
    }),
  });

  if (emmaPatient) {
    // Check if we already have unread messages for this patient
    const existingUnread = await db.message.count({
      where: {
        patientId: emmaPatient.id,
        direction: 'INBOUND',
        readAt: null,
      },
    });

    if (existingUnread === 0) {
      logger.info('Creating sample unread messages for portal testing...');

      const adminUser = await db.user.findFirst({
        where: { clinicId: firstClinicId, role: { in: ['clinic_admin', 'super_admin'] } },
      });

      const sampleUnreadMessages = [
        {
          subject: 'Appointment Reminder',
          body: 'This is a reminder for your upcoming appointment on Monday at 10:00 AM. Please arrive 15 minutes early.',
          channel: 'EMAIL',
          hoursAgo: 2,
        },
        {
          subject: 'Treatment Update',
          body: 'Your treatment plan has been updated. Please log in to view the details.',
          channel: 'IN_APP',
          hoursAgo: 5,
        },
        {
          subject: null,
          body: 'Hi! Just checking in - how are you feeling after your last adjustment?',
          channel: 'SMS',
          hoursAgo: 24,
        },
      ];

      const conversationId = generateObjectId();
      const now = new Date();

      for (const msgData of sampleUnreadMessages) {
        const sentAt = new Date(now.getTime() - msgData.hoursAgo * 60 * 60 * 1000);

        await db.message.create({
          data: {
            clinicId: firstClinicId,
            patientId: emmaPatient.id,
            channel: msgData.channel as 'SMS' | 'EMAIL' | 'IN_APP' | 'PUSH',
            direction: 'INBOUND', // From clinic TO patient (appears as unread in portal)
            status: 'DELIVERED',
            subject: msgData.subject,
            body: msgData.body,
            sentAt,
            readAt: null, // Unread!
            conversationId,
            createdBy: adminUser?.id || '',
          },
        });
        totalCreated++;
      }

      logger.info(`  Created ${sampleUnreadMessages.length} unread messages for Emma`);
    }
  }

  // Log test credentials
  logger.info('');
  logger.info('╔════════════════════════════════════════════════════════════╗');
  logger.info('║               PORTAL TEST CREDENTIALS                      ║');
  logger.info('╠════════════════════════════════════════════════════════════╣');
  logger.info('║  URL:      http://localhost:3000/portal/login              ║');
  logger.info('║  Email:    emma.parent@example.com                         ║');
  logger.info('║  Password: Portal123!                                      ║');
  logger.info('║                                                            ║');
  logger.info('║  (Any seeded patient email works with this password)       ║');
  logger.info('╚════════════════════════════════════════════════════════════╝');
  logger.info('');

  logger.success(`Total portal accounts created: ${totalCreated}`);
  logger.endArea('Portal', totalCreated);
}

/**
 * Clear portal data
 */
export async function clearPortal(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing portal data...');

  // Clear in order: sessions → activity logs → accounts
  await db.portalSession.deleteMany({});
  await db.portalActivityLog.deleteMany({});
  await db.portalAccount.deleteMany({});

  logger.info('  Portal data cleared');
}
