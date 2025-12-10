/**
 * SendGrid Email Provider
 *
 * Handles email delivery through SendGrid's API.
 * Supports sending messages and processing delivery webhooks.
 *
 * Required environment variables:
 * - SENDGRID_API_KEY: SendGrid API key
 * - SENDGRID_FROM_EMAIL: Default sender email address
 * - SENDGRID_FROM_NAME: Default sender name (optional)
 *
 * @see https://docs.sendgrid.com/api-reference/mail-send/mail-send
 */

import crypto from 'crypto';
import type { SendMessagePayload, SendResult, WebhookPayload, DeliveryStatus } from '../types';
import { BaseMessageProvider } from './base';

/**
 * SendGrid API response for sending email
 */
interface SendGridResponse {
  statusCode?: number;
  headers?: {
    'x-message-id'?: string;
  };
}

/**
 * SendGrid webhook event structure
 */
interface SendGridWebhookEvent {
  email: string;
  event: string;
  sg_message_id?: string;
  timestamp?: number;
  url?: string;
  reason?: string;
  bounce_classification?: string;
  'smtp-id'?: string;
}

/**
 * Map SendGrid event to our delivery status
 */
function mapSendGridStatus(event: string): DeliveryStatus {
  switch (event.toLowerCase()) {
    case 'processed':
      return 'PENDING';
    case 'deferred':
      return 'PENDING';
    case 'delivered':
      return 'DELIVERED';
    case 'open':
      return 'OPENED';
    case 'click':
      return 'CLICKED';
    case 'bounce':
      return 'BOUNCED';
    case 'dropped':
    case 'blocked':
      return 'FAILED';
    case 'unsubscribe':
    case 'group_unsubscribe':
      return 'UNSUBSCRIBED';
    case 'spamreport':
      return 'COMPLAINED';
    default:
      return 'SENT';
  }
}

/**
 * SendGrid Email Provider Implementation
 */
export class SendGridProvider extends BaseMessageProvider {
  readonly name = 'sendgrid';

  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly webhookVerificationKey: string;
  private readonly apiUrl = 'https://api.sendgrid.com/v3/mail/send';

  constructor() {
    super();
    this.apiKey = process.env.SENDGRID_API_KEY || '';
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || '';
    this.fromName = process.env.SENDGRID_FROM_NAME || 'Orca Practice';
    this.webhookVerificationKey = process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY || '';
  }

  get isConfigured(): boolean {
    return !!(this.apiKey && this.fromEmail);
  }

  /**
   * Send email via SendGrid
   */
  async send(payload: SendMessagePayload): Promise<SendResult> {
    if (!this.isConfigured) {
      this.log('error', 'SendGrid not configured - missing credentials');
      return {
        success: false,
        error: {
          code: 'PROVIDER_NOT_CONFIGURED',
          message: 'SendGrid credentials not configured',
          retryable: false,
        },
      };
    }

    // Validate email format
    if (!this.isValidEmail(payload.to)) {
      return {
        success: false,
        error: {
          code: 'INVALID_EMAIL',
          message: `Invalid email address: ${payload.to}`,
          retryable: false,
        },
      };
    }

    try {
      // Build email payload
      const emailPayload = {
        personalizations: [
          {
            to: [{ email: payload.to }],
            subject: payload.subject || 'Message from Orca Practice',
          },
        ],
        from: {
          email: payload.from || this.fromEmail,
          name: this.fromName,
        },
        content: [
          // Plain text version
          {
            type: 'text/plain',
            value: payload.body,
          },
          // HTML version if provided
          ...(payload.htmlBody
            ? [
                {
                  type: 'text/html',
                  value: payload.htmlBody,
                },
              ]
            : []),
        ],
        // Add custom headers for tracking
        headers: {
          'X-Orca-Message-ID': payload.messageId,
        },
        // Track opens and clicks
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true },
        },
        // Add categories for SendGrid analytics
        categories: ['orca-practice'],
      };

      // Make API request
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(emailPayload),
      });

      // SendGrid returns 202 for successful queuing
      if (response.status === 202) {
        const messageId = response.headers.get('x-message-id');

        this.log('info', 'Email sent successfully', {
          messageId,
          to: payload.to,
          subject: payload.subject,
        });

        return {
          success: true,
          providerMessageId: messageId || undefined,
          rawResponse: { status: response.status },
        };
      }

      // Handle errors
      const errorData = await response.json().catch(() => ({}));

      this.log('error', 'SendGrid send failed', {
        status: response.status,
        errors: errorData,
      });

      return {
        success: false,
        error: {
          code: `SENDGRID_${response.status}`,
          message: this.extractErrorMessage(errorData),
          retryable: this.isRetryableStatus(response.status),
        },
        rawResponse: errorData,
      };
    } catch (error) {
      this.log('error', 'SendGrid API error', error);

      return {
        success: false,
        error: {
          code: 'SENDGRID_API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        },
      };
    }
  }

  /**
   * Parse SendGrid webhook payload
   *
   * SendGrid sends an array of events
   */
  parseWebhook(
    rawBody: string | Record<string, unknown>,
    _headers: Record<string, string>
  ): WebhookPayload | null {
    try {
      let events: SendGridWebhookEvent[];

      if (typeof rawBody === 'string') {
        events = JSON.parse(rawBody);
      } else if (Array.isArray(rawBody)) {
        events = rawBody as unknown as SendGridWebhookEvent[];
      } else {
        events = [rawBody as unknown as SendGridWebhookEvent];
      }

      // Process first event (webhook handler will call this for each event)
      const event = events[0];
      if (!event || !event.sg_message_id) {
        this.log('warn', 'Invalid webhook payload - missing message ID');
        return null;
      }

      return {
        provider: 'sendgrid',
        providerMessageId: event.sg_message_id,
        status: mapSendGridStatus(event.event),
        statusDetails: event.reason || event.bounce_classification,
        errorCode: undefined,
        timestamp: event.timestamp ? new Date(event.timestamp * 1000) : new Date(),
        rawData: event,
      };
    } catch (error) {
      this.log('error', 'Failed to parse webhook', error);
      return null;
    }
  }

  /**
   * Parse multiple events from a webhook
   */
  parseWebhookEvents(rawBody: string): WebhookPayload[] {
    try {
      const events: SendGridWebhookEvent[] = JSON.parse(rawBody);

      return events
        .filter((event) => event.sg_message_id)
        .map((event) => ({
          provider: 'sendgrid' as const,
          providerMessageId: event.sg_message_id!,
          status: mapSendGridStatus(event.event),
          statusDetails: event.reason || event.bounce_classification,
          errorCode: undefined,
          timestamp: event.timestamp ? new Date(event.timestamp * 1000) : new Date(),
          rawData: event,
        }));
    } catch (error) {
      this.log('error', 'Failed to parse webhook events', error);
      return [];
    }
  }

  /**
   * Validate SendGrid webhook signature
   *
   * @see https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
   */
  validateWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.webhookVerificationKey) {
      this.log('warn', 'Cannot validate signature - verification key not configured');
      // Allow through in development, but log warning
      return process.env.NODE_ENV !== 'production';
    }

    try {
      // Get timestamp from signature header (format: t=timestamp,v1=signature)
      const parts = signature.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const signaturePart = parts.find((p) => p.startsWith('v1='));

      if (!timestampPart || !signaturePart) {
        return false;
      }

      const timestamp = timestampPart.slice(2);
      const providedSignature = signaturePart.slice(3);

      // Build payload for verification
      const payload = timestamp + rawBody;

      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookVerificationKey)
        .update(payload)
        .digest('base64');

      // Constant-time comparison
      return crypto.timingSafeEqual(
        Buffer.from(providedSignature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      this.log('error', 'Signature validation error', error);
      return false;
    }
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Extract error message from SendGrid response
   */
  private extractErrorMessage(errorData: unknown): string {
    if (typeof errorData === 'object' && errorData !== null) {
      const data = errorData as { errors?: { message?: string }[] };
      if (data.errors && data.errors[0]?.message) {
        return data.errors[0].message;
      }
    }
    return 'Failed to send email';
  }

  /**
   * Check if HTTP status is retryable
   */
  private isRetryableStatus(status: number): boolean {
    // 4xx errors are generally not retryable except rate limits
    // 5xx errors are retryable
    return status === 429 || status >= 500;
  }
}

// Singleton instance
let sendgridProvider: SendGridProvider | null = null;

/**
 * Get SendGrid provider instance
 */
export function getSendGridProvider(): SendGridProvider {
  if (!sendgridProvider) {
    sendgridProvider = new SendGridProvider();
  }
  return sendgridProvider;
}
