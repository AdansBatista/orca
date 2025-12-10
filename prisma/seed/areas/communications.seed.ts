import type { Message } from '@prisma/client';
import type { SeedContext } from '../types';
import {
  MESSAGE_TEMPLATES,
  generateSampleConversation,
  generateNotificationPreferences,
} from '../fixtures/communications.fixture';
import { withSoftDelete } from '../utils/soft-delete';
import { generateObjectId } from '../factories';

/**
 * Seed Patient Communications data for ALL clinics
 *
 * This creates:
 * 1. Message templates (system and custom)
 * 2. Sample messages and conversations
 * 3. Notification preferences for patients
 *
 * Dependencies: core, auth:users, patients
 */
export async function seedCommunications(ctx: SeedContext): Promise<void> {
  const { db, config, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Patient Communications');

  // Validate required dependencies
  if (clinicIds.length === 0) {
    logger.warn('No clinics found - core area must be seeded first. Skipping communications seeding.');
    logger.endArea('Patient Communications', 0);
    return;
  }

  let totalCreated = 0;

  for (let clinicIndex = 0; clinicIndex < clinicIds.length; clinicIndex++) {
    const clinicId = clinicIds[clinicIndex];
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`\n=== Seeding communications data for clinic ${clinicIndex + 1}/${clinicIds.length}: ${clinic?.name || clinicId} ===`);

    // Get an admin user for ownership
    const adminUser = await db.user.findFirst({
      where: { clinicId, role: { in: ['clinic_admin', 'super_admin'] } },
    });
    const ownerId = adminUser?.id;

    if (!ownerId) {
      logger.warn(`  No admin user found for clinic ${clinicId}, skipping communications seeding`);
      continue;
    }

    // ============================================================================
    // 1. SEED MESSAGE TEMPLATES
    // ============================================================================
    logger.info('  Seeding message templates...');

    let templateCount = 0;
    for (const templateData of MESSAGE_TEMPLATES) {
      // Check if template already exists
      const existingTemplate = await db.messageTemplate.findFirst({
        where: withSoftDelete({
          clinicId,
          name: templateData.name,
        }),
      });

      if (!existingTemplate) {
        const template = await db.messageTemplate.create({
          data: {
            clinicId,
            name: templateData.name,
            description: templateData.description,
            category: templateData.category,
            smsBody: templateData.smsBody,
            emailSubject: templateData.emailSubject,
            emailBody: templateData.emailBody,
            pushTitle: templateData.pushTitle,
            pushBody: templateData.pushBody,
            isSystem: templateData.isSystem,
            isActive: true,
            version: 1,
            createdBy: ownerId,
          },
        });
        idTracker.add('MessageTemplate', template.id, clinicId);
        templateCount++;
        totalCreated++;
      }
    }

    logger.info(`  Created ${templateCount} message templates`);

    // Skip sample data in minimal mode
    if (config.mode === 'minimal') {
      continue;
    }

    // ============================================================================
    // 2. GET PATIENTS FOR SAMPLE DATA
    // ============================================================================
    const patients = await db.patient.findMany({
      where: withSoftDelete({ clinicId }),
      select: { id: true, firstName: true, lastName: true, email: true, phone: true },
      take: 10, // Limit to 10 patients for sample messages
    });

    if (patients.length === 0) {
      logger.warn('  No patients found - skipping sample messages and preferences');
      continue;
    }

    logger.info(`  Found ${patients.length} patients for sample data`);

    // ============================================================================
    // 3. SEED NOTIFICATION PREFERENCES
    // ============================================================================
    logger.info('  Seeding notification preferences...');

    let preferencesCount = 0;
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];

      // Check if preferences already exist
      const existingPrefs = await db.notificationPreference.findFirst({
        where: { clinicId, patientId: patient.id },
      });

      if (!existingPrefs) {
        const prefs = generateNotificationPreferences(i);

        await db.notificationPreference.create({
          data: {
            clinicId,
            patientId: patient.id,
            smsEnabled: prefs.smsEnabled,
            emailEnabled: prefs.emailEnabled,
            pushEnabled: prefs.pushEnabled,
            appointmentReminders: prefs.appointmentReminders,
            treatmentUpdates: prefs.treatmentUpdates,
            billingNotifications: prefs.billingNotifications,
            marketingMessages: prefs.marketingMessages,
            channelPriority: prefs.channelPriority,
            quietHoursStart: prefs.quietHoursStart,
            quietHoursEnd: prefs.quietHoursEnd,
            timezone: prefs.timezone,
          },
        });
        preferencesCount++;
        totalCreated++;
      }
    }

    logger.info(`  Created ${preferencesCount} notification preferences`);

    // ============================================================================
    // 4. SEED SAMPLE MESSAGES (for first 3 patients)
    // ============================================================================
    logger.info('  Seeding sample messages...');

    const conversationPatients = patients.slice(0, 3);
    let messageCount = 0;

    for (const patient of conversationPatients) {
      // Check if patient already has messages
      const existingMessages = await db.message.count({
        where: { clinicId, patientId: patient.id },
      });

      if (existingMessages > 0) {
        continue;
      }

      // Generate a valid MongoDB ObjectId for the conversation thread
      const conversationId = generateObjectId();
      const sampleMessages = generateSampleConversation();
      const now = new Date();

      let previousMessageId: string | null = null;

      for (const msgData of sampleMessages) {
        const sentAt = new Date(now.getTime() - msgData.hoursAgo * 60 * 60 * 1000);

        const message: Message = await db.message.create({
          data: {
            clinicId,
            patientId: patient.id,
            channel: msgData.channel,
            direction: msgData.direction,
            status: msgData.status,
            subject: msgData.subject,
            body: msgData.body,
            sentAt,
            readAt: msgData.read ? new Date(sentAt.getTime() + 5 * 60 * 1000) : null,
            conversationId,
            replyToId: previousMessageId,
            createdBy: ownerId, // Always use admin user (for inbound, this is who logged/received it)
          },
        });

        idTracker.add('Message', message.id, clinicId);
        messageCount++;
        totalCreated++;

        // Create delivery record for outbound messages
        if (msgData.direction === 'OUTBOUND') {
          await db.messageDelivery.create({
            data: {
              messageId: message.id,
              provider: msgData.channel === 'SMS' ? 'twilio' : msgData.channel === 'EMAIL' ? 'sendgrid' : 'firebase',
              status: msgData.status === 'DELIVERED' ? 'DELIVERED' : 'SENT',
              sentAt,
              deliveredAt: msgData.status === 'DELIVERED' ? new Date(sentAt.getTime() + 2 * 1000) : null,
              providerMessageId: `prov-${message.id}`,
            },
          });
          totalCreated++;
        }

        previousMessageId = message.id;
      }
    }

    logger.info(`  Created ${messageCount} sample messages`);
  }

  logger.success(`\nCommunications seeding complete: ${totalCreated} records created across ${clinicIds.length} clinics`);
  logger.endArea('Patient Communications', totalCreated);
}

/**
 * Clear Patient Communications data
 * Removes all communications-related data
 */
export async function clearCommunications(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing communications data...');

  // Delete in reverse dependency order
  await db.messageDelivery.deleteMany({});
  logger.info('  Cleared message deliveries');

  // Clear self-referential replyToId before deleting messages
  await db.message.updateMany({
    where: { replyToId: { not: null } },
    data: { replyToId: null },
  });
  await db.message.deleteMany({});
  logger.info('  Cleared messages');

  await db.notificationPreference.deleteMany({});
  logger.info('  Cleared notification preferences');

  await db.messageTemplate.deleteMany({});
  logger.info('  Cleared message templates');
}
