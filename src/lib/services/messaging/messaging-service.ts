/**
 * Messaging Service
 *
 * Central orchestrator for all messaging operations.
 * Handles sending messages, processing webhooks, and managing delivery status.
 *
 * Features:
 * - Multi-channel message delivery (SMS, Email, Push, In-App)
 * - Template variable substitution
 * - Delivery tracking and status updates
 * - Bulk message sending
 * - Scheduled message support
 */

import { db } from '@/lib/db';
import type {
  MessageChannel,
  ProviderType,
  SendMessagePayload,
  SendResult,
  WebhookPayload,
  TemplateVariables,
  BulkMessageRequest,
  DeliveryStatus,
} from './types';
import { getTwilioProvider } from './providers/twilio';
import { getSendGridProvider } from './providers/sendgrid';
import { getFirebaseProvider } from './providers/firebase';
import type { BaseMessageProvider } from './providers/base';

/**
 * Message creation input
 */
export interface CreateMessageInput {
  clinicId: string;
  patientId: string;
  channel: MessageChannel;
  templateId?: string;
  subject?: string;
  body: string;
  htmlBody?: string;
  toAddress?: string;
  variables?: TemplateVariables;
  scheduledAt?: Date;
  relatedType?: string;
  relatedId?: string;
  tags?: string[];
  createdBy: string;
}

/**
 * Send message result
 */
export interface SendMessageResult {
  success: boolean;
  messageId?: string;
  deliveryId?: string;
  providerMessageId?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Messaging Service Class
 */
class MessagingService {
  private providers: Map<ProviderType, BaseMessageProvider> = new Map();

  constructor() {
    // Initialize providers lazily
  }

  /**
   * Get provider for a channel
   */
  private getProvider(channel: MessageChannel): BaseMessageProvider | null {
    const providerType = this.getProviderType(channel);

    if (providerType === 'internal') {
      return null; // In-app notifications handled differently
    }

    // Lazily initialize providers
    if (!this.providers.has(providerType)) {
      switch (providerType) {
        case 'twilio':
          this.providers.set('twilio', getTwilioProvider());
          break;
        case 'sendgrid':
          this.providers.set('sendgrid', getSendGridProvider());
          break;
        case 'firebase':
          this.providers.set('firebase', getFirebaseProvider());
          break;
      }
    }

    return this.providers.get(providerType) || null;
  }

  /**
   * Map channel to provider type
   */
  private getProviderType(channel: MessageChannel): ProviderType {
    switch (channel) {
      case 'SMS':
        return 'twilio';
      case 'EMAIL':
        return 'sendgrid';
      case 'PUSH':
        return 'firebase';
      case 'IN_APP':
        return 'internal';
      default:
        return 'internal';
    }
  }

  /**
   * Send a message
   *
   * Creates the message record and attempts delivery through the appropriate provider.
   */
  async sendMessage(input: CreateMessageInput): Promise<SendMessageResult> {
    const {
      clinicId,
      patientId,
      channel,
      templateId,
      subject,
      body,
      htmlBody,
      toAddress,
      variables,
      scheduledAt,
      relatedType,
      relatedId,
      tags,
      createdBy,
    } = input;

    try {
      // Get patient contact info if not provided
      let recipient: string | undefined = toAddress;
      if (!recipient) {
        const patient = await db.patient.findUnique({
          where: { id: patientId },
          select: { email: true, phone: true },
        });

        if (!patient) {
          return {
            success: false,
            error: {
              code: 'PATIENT_NOT_FOUND',
              message: 'Patient not found',
            },
          };
        }

        recipient = (channel === 'EMAIL' ? patient.email : patient.phone) || undefined;
      }

      if (!recipient && channel !== 'IN_APP') {
        return {
          success: false,
          error: {
            code: 'NO_RECIPIENT',
            message: `Patient has no ${channel === 'EMAIL' ? 'email' : 'phone number'} on file`,
          },
        };
      }

      // Process template variables if needed
      let processedBody = body;
      let processedSubject = subject;
      let processedHtmlBody = htmlBody;

      if (variables && Object.keys(variables).length > 0) {
        processedBody = this.substituteVariables(body, variables);
        if (subject) {
          processedSubject = this.substituteVariables(subject, variables);
        }
        if (htmlBody) {
          processedHtmlBody = this.substituteVariables(htmlBody, variables);
        }
      }

      // Determine initial status
      const isScheduled = scheduledAt && scheduledAt > new Date();
      const status = isScheduled ? 'SCHEDULED' : 'PENDING';

      // Create the message record
      const message = await db.message.create({
        data: {
          clinicId,
          patientId,
          channel,
          direction: 'OUTBOUND',
          templateId,
          subject: processedSubject,
          body: processedBody,
          htmlBody: processedHtmlBody,
          toAddress: recipient,
          status,
          scheduledAt,
          relatedType,
          relatedId,
          tags: tags || [],
          createdBy,
        },
      });

      // If scheduled for later, don't send now
      if (isScheduled) {
        return {
          success: true,
          messageId: message.id,
        };
      }

      // Handle in-app notifications differently
      if (channel === 'IN_APP') {
        await db.message.update({
          where: { id: message.id },
          data: {
            status: 'DELIVERED',
            sentAt: new Date(),
            deliveredAt: new Date(),
          },
        });

        return {
          success: true,
          messageId: message.id,
        };
      }

      // Get the provider and send
      const provider = this.getProvider(channel);
      if (!provider) {
        await db.message.update({
          where: { id: message.id },
          data: {
            status: 'FAILED',
          },
        });

        return {
          success: false,
          messageId: message.id,
          error: {
            code: 'PROVIDER_NOT_AVAILABLE',
            message: `No provider available for ${channel}`,
          },
        };
      }

      // Create delivery record
      const delivery = await db.messageDelivery.create({
        data: {
          messageId: message.id,
          provider: this.getProviderType(channel),
          status: 'PENDING',
        },
      });

      // Attempt to send
      const payload: SendMessagePayload = {
        messageId: message.id,
        channel,
        to: recipient!,
        subject: processedSubject,
        body: processedBody,
        htmlBody: processedHtmlBody,
        metadata: {
          clinicId,
          patientId,
          deliveryId: delivery.id,
        },
      };

      const result = await provider.send(payload);

      // Update records based on result
      if (result.success) {
        await Promise.all([
          db.message.update({
            where: { id: message.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
            },
          }),
          db.messageDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              providerMessageId: result.providerMessageId,
            },
          }),
        ]);

        return {
          success: true,
          messageId: message.id,
          deliveryId: delivery.id,
          providerMessageId: result.providerMessageId,
        };
      } else {
        await Promise.all([
          db.message.update({
            where: { id: message.id },
            data: {
              status: 'FAILED',
            },
          }),
          db.messageDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'FAILED',
              statusDetails: result.error?.message,
              failedAt: new Date(),
            },
          }),
        ]);

        return {
          success: false,
          messageId: message.id,
          deliveryId: delivery.id,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('[MessagingService] Send error:', error);
      return {
        success: false,
        error: {
          code: 'SEND_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  /**
   * Process a delivery webhook
   *
   * Updates message and delivery status based on webhook data.
   */
  async processWebhook(webhookPayload: WebhookPayload): Promise<boolean> {
    const { providerMessageId, status, statusDetails, timestamp, rawData } = webhookPayload;

    try {
      // Find the delivery record by provider message ID
      const delivery = await db.messageDelivery.findFirst({
        where: { providerMessageId },
        include: { message: true },
      });

      if (!delivery) {
        console.warn(
          `[MessagingService] No delivery found for provider message: ${providerMessageId}`
        );
        return false;
      }

      // Build update data for delivery
      const deliveryUpdate: Record<string, unknown> = {
        status,
        statusDetails,
        webhookData: rawData,
        updatedAt: new Date(),
      };

      // Set timestamp fields based on status
      switch (status) {
        case 'SENT':
          deliveryUpdate.sentAt = timestamp;
          break;
        case 'DELIVERED':
          deliveryUpdate.deliveredAt = timestamp;
          break;
        case 'OPENED':
          deliveryUpdate.openedAt = timestamp;
          break;
        case 'CLICKED':
          deliveryUpdate.clickedAt = timestamp;
          break;
        case 'BOUNCED':
          deliveryUpdate.bouncedAt = timestamp;
          break;
        case 'FAILED':
          deliveryUpdate.failedAt = timestamp;
          break;
      }

      // Update delivery record
      await db.messageDelivery.update({
        where: { id: delivery.id },
        data: deliveryUpdate,
      });

      // Update message status for terminal states
      const terminalStatuses = ['DELIVERED', 'FAILED', 'BOUNCED'] as const;

      if (terminalStatuses.includes(status as (typeof terminalStatuses)[number])) {
        await db.message.update({
          where: { id: delivery.messageId },
          data: {
            status: status as 'DELIVERED' | 'FAILED' | 'BOUNCED',
            ...(status === 'DELIVERED' ? { deliveredAt: timestamp } : {}),
          },
        });
      }

      return true;
    } catch (error) {
      console.error('[MessagingService] Webhook processing error:', error);
      return false;
    }
  }

  /**
   * Send bulk messages using a template
   */
  async sendBulkMessages(request: BulkMessageRequest, createdBy: string): Promise<{
    success: boolean;
    total: number;
    sent: number;
    failed: number;
    results: { patientId: string; success: boolean; messageId?: string; error?: string }[];
  }> {
    const { templateId, channel, recipients, commonVariables, scheduledAt, tags } = request;

    // Load template
    const template = await db.messageTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return {
        success: false,
        total: recipients.length,
        sent: 0,
        failed: recipients.length,
        results: recipients.map((r) => ({
          patientId: r.patientId,
          success: false,
          error: 'Template not found',
        })),
      };
    }

    // Get template content for channel
    const { body, subject, htmlBody } = this.getTemplateContent(template, channel);

    if (!body) {
      return {
        success: false,
        total: recipients.length,
        sent: 0,
        failed: recipients.length,
        results: recipients.map((r) => ({
          patientId: r.patientId,
          success: false,
          error: `Template has no content for ${channel} channel`,
        })),
      };
    }

    // Send to each recipient
    const results = await Promise.all(
      recipients.map(async (recipient) => {
        // Merge common and recipient-specific variables
        const variables = { ...commonVariables, ...recipient.variables };

        const result = await this.sendMessage({
          clinicId: template.clinicId,
          patientId: recipient.patientId,
          channel,
          templateId,
          subject,
          body,
          htmlBody,
          toAddress: recipient.to,
          variables,
          scheduledAt,
          tags,
          createdBy,
        });

        return {
          patientId: recipient.patientId,
          success: result.success,
          messageId: result.messageId,
          error: result.error?.message,
        };
      })
    );

    const sent = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return {
      success: sent > 0,
      total: recipients.length,
      sent,
      failed,
      results,
    };
  }

  /**
   * Process scheduled messages that are due
   *
   * Should be called by a cron job or background worker.
   */
  async processScheduledMessages(): Promise<{ processed: number; failed: number }> {
    const now = new Date();

    // Find messages scheduled for now or earlier
    const scheduledMessages = await db.message.findMany({
      where: {
        status: 'SCHEDULED',
        scheduledAt: { lte: now },
      },
      include: {
        patient: {
          select: { email: true, phone: true },
        },
      },
      take: 100, // Process in batches
    });

    let processed = 0;
    let failed = 0;

    for (const message of scheduledMessages) {
      const recipient =
        message.toAddress ||
        (message.channel === 'EMAIL' ? message.patient.email : message.patient.phone);

      if (!recipient) {
        await db.message.update({
          where: { id: message.id },
          data: { status: 'FAILED' },
        });
        failed++;
        continue;
      }

      // Get provider and send
      const provider = this.getProvider(message.channel as MessageChannel);
      if (!provider) {
        await db.message.update({
          where: { id: message.id },
          data: { status: 'FAILED' },
        });
        failed++;
        continue;
      }

      // Create delivery record
      const delivery = await db.messageDelivery.create({
        data: {
          messageId: message.id,
          provider: this.getProviderType(message.channel as MessageChannel),
          status: 'PENDING',
        },
      });

      const result = await provider.send({
        messageId: message.id,
        channel: message.channel as MessageChannel,
        to: recipient,
        subject: message.subject || undefined,
        body: message.body,
        htmlBody: message.htmlBody || undefined,
      });

      if (result.success) {
        await Promise.all([
          db.message.update({
            where: { id: message.id },
            data: { status: 'SENT', sentAt: new Date() },
          }),
          db.messageDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              providerMessageId: result.providerMessageId,
            },
          }),
        ]);
        processed++;
      } else {
        await Promise.all([
          db.message.update({
            where: { id: message.id },
            data: { status: 'FAILED' },
          }),
          db.messageDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'FAILED',
              statusDetails: result.error?.message,
              failedAt: new Date(),
            },
          }),
        ]);
        failed++;
      }
    }

    return { processed, failed };
  }

  /**
   * Get provider health status
   */
  async getProviderStatus(): Promise<Record<ProviderType, { healthy: boolean; message?: string }>> {
    const twilio = getTwilioProvider();
    const sendgrid = getSendGridProvider();
    const firebase = getFirebaseProvider();

    return {
      twilio: await twilio.getStatus(),
      sendgrid: await sendgrid.getStatus(),
      firebase: await firebase.getStatus(),
      internal: { healthy: true, message: 'In-app notifications available' },
    };
  }

  /**
   * Process an inbound message (e.g., SMS reply from patient)
   *
   * Looks up the patient by phone number and creates a message record.
   * If found, links to existing conversation if recent messages exist.
   */
  async processInboundMessage(params: {
    channel: MessageChannel;
    fromAddress: string;
    toAddress: string;
    body: string;
    providerMessageId: string;
    mediaUrls?: string[];
    metadata?: Record<string, unknown>;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const { channel, fromAddress, toAddress, body, providerMessageId, mediaUrls, metadata } = params;

    try {
      // Find clinic by the "To" phone number (should be clinic's Twilio number)
      // For now, we look up the patient by their phone number
      // In production, you'd map Twilio numbers to specific clinics

      // Normalize phone number for lookup
      const normalizedPhone = fromAddress.replace(/[^\d]/g, '').slice(-10);

      // Find patient by phone number
      const patient = await db.patient.findFirst({
        where: {
          OR: [
            { phone: { contains: normalizedPhone } },
            { phone: fromAddress },
          ],
          deletedAt: null,
        },
        select: {
          id: true,
          clinicId: true,
          firstName: true,
          lastName: true,
        },
      });

      if (!patient) {
        console.warn('[MessagingService] Inbound message from unknown number:', fromAddress);
        // Still create a record for unknown senders - might want to track these
        // For now, return an error but log the message
        return {
          success: false,
          error: 'Patient not found for phone number',
        };
      }

      // Find existing conversation thread (recent messages within 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentConversation = await db.message.findFirst({
        where: {
          clinicId: patient.clinicId,
          patientId: patient.id,
          channel: 'SMS',
          createdAt: { gte: sevenDaysAgo },
          conversationId: { not: null },
        },
        orderBy: { createdAt: 'desc' },
        select: { conversationId: true },
      });

      // Create the inbound message record
      const message = await db.message.create({
        data: {
          clinicId: patient.clinicId,
          patientId: patient.id,
          channel,
          direction: 'INBOUND',
          status: 'DELIVERED',
          body,
          fromAddress,
          toAddress,
          sentAt: new Date(),
          deliveredAt: new Date(),
          conversationId: recentConversation?.conversationId || null,
          metadata: {
            providerMessageId,
            mediaUrls: mediaUrls || [],
            ...metadata,
          },
          // Inbound messages are "created by" the system
          createdBy: 'system',
        },
      });

      // Create delivery record for tracking
      await db.messageDelivery.create({
        data: {
          messageId: message.id,
          provider: this.getProviderType(channel),
          status: 'DELIVERED',
          providerMessageId,
          deliveredAt: new Date(),
        },
      });

      console.log('[MessagingService] Inbound message processed:', {
        messageId: message.id,
        patientId: patient.id,
        from: fromAddress,
      });

      return {
        success: true,
        messageId: message.id,
      };
    } catch (error) {
      console.error('[MessagingService] Error processing inbound message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Retry failed messages with exponential backoff
   *
   * Should be called by a cron job or background worker.
   * Only retries messages that:
   * - Have status FAILED
   * - Have retryCount < maxRetries (3)
   * - Were last attempted longer ago than the backoff delay
   */
  async retryFailedMessages(): Promise<{ retried: number; succeeded: number; failed: number; skipped: number }> {
    const MAX_RETRIES = 3;
    const BASE_DELAY_MS = 60 * 1000; // 1 minute
    const now = new Date();

    // Find failed messages eligible for retry
    const failedMessages = await db.message.findMany({
      where: {
        status: 'FAILED',
        retryCount: { lt: MAX_RETRIES },
        channel: { in: ['SMS', 'EMAIL'] }, // Only retry external channels
      },
      include: {
        patient: {
          select: { email: true, phone: true },
        },
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      take: 50, // Process in smaller batches for retries
    });

    let retried = 0;
    let succeeded = 0;
    let failed = 0;
    let skipped = 0;

    for (const message of failedMessages) {
      // Calculate exponential backoff delay
      // Delay: 1min, 4min, 16min for retries 0, 1, 2
      const backoffDelay = BASE_DELAY_MS * Math.pow(4, message.retryCount);
      const lastAttempt = message.deliveries[0]?.failedAt || message.updatedAt;
      const nextRetryTime = new Date(lastAttempt.getTime() + backoffDelay);

      // Skip if not enough time has passed
      if (now < nextRetryTime) {
        skipped++;
        continue;
      }

      const recipient =
        message.toAddress ||
        (message.channel === 'EMAIL' ? message.patient.email : message.patient.phone);

      if (!recipient) {
        // Mark as permanently failed - no contact info
        await db.message.update({
          where: { id: message.id },
          data: {
            retryCount: MAX_RETRIES, // Prevent further retries
            errorMessage: 'No contact information available',
          },
        });
        skipped++;
        continue;
      }

      // Get provider and attempt send
      const provider = this.getProvider(message.channel as MessageChannel);
      if (!provider) {
        skipped++;
        continue;
      }

      retried++;

      // Create new delivery record for this attempt
      const delivery = await db.messageDelivery.create({
        data: {
          messageId: message.id,
          provider: this.getProviderType(message.channel as MessageChannel),
          status: 'PENDING',
        },
      });

      const result = await provider.send({
        messageId: message.id,
        channel: message.channel as MessageChannel,
        to: recipient,
        subject: message.subject || undefined,
        body: message.body,
        htmlBody: message.htmlBody || undefined,
      });

      if (result.success) {
        await Promise.all([
          db.message.update({
            where: { id: message.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              retryCount: message.retryCount + 1,
              errorMessage: null,
            },
          }),
          db.messageDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'SENT',
              sentAt: new Date(),
              providerMessageId: result.providerMessageId,
            },
          }),
        ]);
        succeeded++;
      } else {
        const newRetryCount = message.retryCount + 1;
        const isFinalAttempt = newRetryCount >= MAX_RETRIES;
        const isRetryable = result.error?.retryable !== false;

        await Promise.all([
          db.message.update({
            where: { id: message.id },
            data: {
              status: 'FAILED',
              retryCount: newRetryCount,
              errorMessage: result.error?.message || 'Unknown error',
              // If not retryable or max retries reached, keep as FAILED permanently
              ...(isFinalAttempt || !isRetryable
                ? { retryCount: MAX_RETRIES }
                : {}),
            },
          }),
          db.messageDelivery.update({
            where: { id: delivery.id },
            data: {
              status: 'FAILED',
              statusDetails: result.error?.message,
              failedAt: new Date(),
            },
          }),
        ]);
        failed++;
      }
    }

    console.log('[MessagingService] Retry results:', {
      retried,
      succeeded,
      failed,
      skipped,
    });

    return { retried, succeeded, failed, skipped };
  }

  /**
   * Substitute template variables
   */
  private substituteVariables(text: string, variables: TemplateVariables): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      return variables[key] ?? `{{${key}}}`;
    });
  }

  /**
   * Get template content for a specific channel
   */
  private getTemplateContent(
    template: {
      smsBody: string | null;
      emailSubject: string | null;
      emailBody: string | null;
      emailHtmlBody: string | null;
      pushTitle: string | null;
      pushBody: string | null;
      inAppTitle: string | null;
      inAppBody: string | null;
    },
    channel: MessageChannel
  ): { body: string | null; subject?: string; htmlBody?: string } {
    switch (channel) {
      case 'SMS':
        return { body: template.smsBody };
      case 'EMAIL':
        return {
          body: template.emailBody,
          subject: template.emailSubject || undefined,
          htmlBody: template.emailHtmlBody || undefined,
        };
      case 'PUSH':
        return { body: template.pushBody, subject: template.pushTitle || undefined };
      case 'IN_APP':
        return { body: template.inAppBody, subject: template.inAppTitle || undefined };
      default:
        return { body: null };
    }
  }
}

// Singleton instance
let messagingService: MessagingService | null = null;

/**
 * Get messaging service instance
 */
export function getMessagingService(): MessagingService {
  if (!messagingService) {
    messagingService = new MessagingService();
  }
  return messagingService;
}

// Export the class for testing
export { MessagingService };
