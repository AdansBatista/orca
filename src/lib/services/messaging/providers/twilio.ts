/**
 * Twilio SMS Provider
 *
 * Handles SMS delivery through Twilio's API.
 * Supports sending messages and processing delivery webhooks.
 *
 * Required environment variables:
 * - TWILIO_ACCOUNT_SID: Twilio account SID
 * - TWILIO_AUTH_TOKEN: Twilio auth token
 * - TWILIO_PHONE_NUMBER: Default sender phone number
 *
 * @see https://www.twilio.com/docs/sms
 */

import crypto from 'crypto';
import type { SendMessagePayload, SendResult, WebhookPayload, DeliveryStatus } from '../types';
import { BaseMessageProvider } from './base';

/**
 * Twilio API response for sending SMS
 */
interface TwilioSendResponse {
  sid: string;
  status: string;
  error_code?: number;
  error_message?: string;
}

/**
 * Twilio webhook payload structure for status callbacks
 */
interface TwilioWebhookData {
  MessageSid: string;
  MessageStatus: string;
  To?: string;
  From?: string;
  ErrorCode?: string;
  ErrorMessage?: string;
  AccountSid?: string;
}

/**
 * Twilio inbound SMS webhook payload
 */
export interface TwilioInboundMessage {
  MessageSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  FromCity?: string;
  FromState?: string;
  FromCountry?: string;
  AccountSid?: string;
}

/**
 * Map Twilio status to our delivery status
 */
function mapTwilioStatus(twilioStatus: string): DeliveryStatus {
  switch (twilioStatus.toLowerCase()) {
    case 'queued':
    case 'accepted':
      return 'PENDING';
    case 'sending':
    case 'sent':
      return 'SENT';
    case 'delivered':
      return 'DELIVERED';
    case 'undelivered':
    case 'failed':
      return 'FAILED';
    default:
      return 'PENDING';
  }
}

/**
 * Twilio SMS Provider Implementation
 */
export class TwilioProvider extends BaseMessageProvider {
  readonly name = 'twilio';

  private readonly accountSid: string;
  private readonly authToken: string;
  private readonly phoneNumber: string;
  private readonly apiUrl: string;

  constructor() {
    super();
    this.accountSid = process.env.TWILIO_ACCOUNT_SID || '';
    this.authToken = process.env.TWILIO_AUTH_TOKEN || '';
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER || '';
    this.apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
  }

  get isConfigured(): boolean {
    return !!(this.accountSid && this.authToken && this.phoneNumber);
  }

  /**
   * Send SMS via Twilio
   */
  async send(payload: SendMessagePayload): Promise<SendResult> {
    if (!this.isConfigured) {
      this.log('error', 'Twilio not configured - missing credentials');
      return {
        success: false,
        error: {
          code: 'PROVIDER_NOT_CONFIGURED',
          message: 'Twilio credentials not configured',
          retryable: false,
        },
      };
    }

    // Validate phone number format
    const toNumber = this.normalizePhoneNumber(payload.to);
    if (!toNumber) {
      return {
        success: false,
        error: {
          code: 'INVALID_PHONE_NUMBER',
          message: `Invalid phone number format: ${payload.to}`,
          retryable: false,
        },
      };
    }

    try {
      // Build request body
      const formData = new URLSearchParams();
      formData.append('To', toNumber);
      formData.append('From', payload.from || this.phoneNumber);
      formData.append('Body', payload.body);

      // Add status callback URL if configured
      const webhookUrl = process.env.TWILIO_WEBHOOK_URL;
      if (webhookUrl) {
        formData.append('StatusCallback', webhookUrl);
      }

      // Make API request
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64')}`,
        },
        body: formData.toString(),
      });

      const data = (await response.json()) as TwilioSendResponse;

      if (!response.ok || data.error_code) {
        this.log('error', 'Twilio send failed', {
          status: response.status,
          error: data.error_message,
          code: data.error_code,
        });

        return {
          success: false,
          error: {
            code: data.error_code?.toString() || 'TWILIO_ERROR',
            message: data.error_message || 'Failed to send SMS',
            retryable: this.isRetryableError(data.error_code),
          },
          rawResponse: data,
        };
      }

      this.log('info', 'SMS sent successfully', {
        sid: data.sid,
        status: data.status,
        to: toNumber,
      });

      return {
        success: true,
        providerMessageId: data.sid,
        rawResponse: data,
      };
    } catch (error) {
      this.log('error', 'Twilio API error', error);

      return {
        success: false,
        error: {
          code: 'TWILIO_API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        },
      };
    }
  }

  /**
   * Parse Twilio webhook payload
   */
  parseWebhook(
    rawBody: string | Record<string, unknown>,
    _headers: Record<string, string>
  ): WebhookPayload | null {
    try {
      // Twilio sends form-urlencoded data
      let data: TwilioWebhookData;

      if (typeof rawBody === 'string') {
        const params = new URLSearchParams(rawBody);
        data = {
          MessageSid: params.get('MessageSid') || '',
          MessageStatus: params.get('MessageStatus') || '',
          To: params.get('To') || undefined,
          From: params.get('From') || undefined,
          ErrorCode: params.get('ErrorCode') || undefined,
          ErrorMessage: params.get('ErrorMessage') || undefined,
          AccountSid: params.get('AccountSid') || undefined,
        };
      } else {
        data = rawBody as unknown as TwilioWebhookData;
      }

      if (!data.MessageSid || !data.MessageStatus) {
        this.log('warn', 'Invalid webhook payload - missing required fields');
        return null;
      }

      return {
        provider: 'twilio',
        providerMessageId: data.MessageSid,
        status: mapTwilioStatus(data.MessageStatus),
        statusDetails: data.ErrorMessage,
        errorCode: data.ErrorCode,
        timestamp: new Date(),
        rawData: data,
      };
    } catch (error) {
      this.log('error', 'Failed to parse webhook', error);
      return null;
    }
  }

  /**
   * Validate Twilio webhook signature
   *
   * @see https://www.twilio.com/docs/usage/security#validating-requests
   */
  validateWebhookSignature(rawBody: string, signature: string): boolean {
    if (!this.authToken) {
      this.log('warn', 'Cannot validate signature - auth token not configured');
      return false;
    }

    try {
      const webhookUrl = process.env.TWILIO_WEBHOOK_URL;
      if (!webhookUrl) {
        this.log('warn', 'Cannot validate signature - webhook URL not configured');
        return false;
      }

      // Build the validation string
      const params = new URLSearchParams(rawBody);
      const sortedParams = Array.from(params.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}${value}`)
        .join('');

      const validationString = webhookUrl + sortedParams;

      // Generate expected signature
      const expectedSignature = crypto
        .createHmac('sha1', this.authToken)
        .update(validationString)
        .digest('base64');

      return signature === expectedSignature;
    } catch (error) {
      this.log('error', 'Signature validation error', error);
      return false;
    }
  }

  /**
   * Normalize phone number to E.164 format
   */
  private normalizePhoneNumber(phone: string): string | null {
    // Remove all non-digit characters except leading +
    const cleaned = phone.replace(/[^\d+]/g, '');

    // Already in E.164 format
    if (cleaned.startsWith('+') && cleaned.length >= 11) {
      return cleaned;
    }

    // US number without country code
    if (cleaned.length === 10) {
      return `+1${cleaned}`;
    }

    // US number with country code but no +
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+${cleaned}`;
    }

    // Invalid format
    return null;
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(errorCode?: number): boolean {
    if (!errorCode) return true;

    // Non-retryable error codes
    const nonRetryable = [
      21211, // Invalid 'To' phone number
      21212, // Invalid 'From' phone number
      21606, // 'From' phone number not valid
      21408, // Account not active
      21610, // Message blocked
      21614, // Invalid destination number
    ];

    return !nonRetryable.includes(errorCode);
  }

  /**
   * Parse inbound SMS message from Twilio webhook
   *
   * Inbound messages have a Body field and no MessageStatus field
   */
  parseInboundMessage(rawBody: string): TwilioInboundMessage | null {
    try {
      const params = new URLSearchParams(rawBody);

      // Check if this is an inbound message (has Body, no MessageStatus)
      const body = params.get('Body');
      const messageStatus = params.get('MessageStatus');

      if (!body || messageStatus) {
        // Not an inbound message or is a status callback
        return null;
      }

      const messageSid = params.get('MessageSid');
      const from = params.get('From');
      const to = params.get('To');

      if (!messageSid || !from || !to) {
        this.log('warn', 'Inbound message missing required fields');
        return null;
      }

      return {
        MessageSid: messageSid,
        From: from,
        To: to,
        Body: body,
        NumMedia: params.get('NumMedia') || undefined,
        MediaUrl0: params.get('MediaUrl0') || undefined,
        MediaContentType0: params.get('MediaContentType0') || undefined,
        FromCity: params.get('FromCity') || undefined,
        FromState: params.get('FromState') || undefined,
        FromCountry: params.get('FromCountry') || undefined,
        AccountSid: params.get('AccountSid') || undefined,
      };
    } catch (error) {
      this.log('error', 'Failed to parse inbound message', error);
      return null;
    }
  }

  /**
   * Check if the webhook payload is an inbound message
   */
  isInboundMessage(rawBody: string): boolean {
    const params = new URLSearchParams(rawBody);
    const body = params.get('Body');
    const messageStatus = params.get('MessageStatus');

    // Inbound messages have Body but no MessageStatus
    return !!body && !messageStatus;
  }
}

// Singleton instance
let twilioProvider: TwilioProvider | null = null;

/**
 * Get Twilio provider instance
 */
export function getTwilioProvider(): TwilioProvider {
  if (!twilioProvider) {
    twilioProvider = new TwilioProvider();
  }
  return twilioProvider;
}
