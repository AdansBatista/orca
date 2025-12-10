/**
 * Firebase Cloud Messaging (FCM) Provider
 *
 * Handles push notification delivery through Firebase Cloud Messaging.
 * Supports sending notifications to Android and iOS devices.
 *
 * Required environment variables:
 * - FIREBASE_PROJECT_ID: Firebase project ID
 * - FIREBASE_CLIENT_EMAIL: Service account email
 * - FIREBASE_PRIVATE_KEY: Service account private key (base64 encoded or raw)
 *
 * @see https://firebase.google.com/docs/cloud-messaging
 */

import crypto from 'crypto';
import type { SendMessagePayload, SendResult, WebhookPayload, DeliveryStatus } from '../types';
import { BaseMessageProvider } from './base';

/**
 * FCM HTTP v1 API response
 */
interface FCMSendResponse {
  name?: string; // projects/{project_id}/messages/{message_id}
  error?: {
    code: number;
    message: string;
    status: string;
    details?: Array<{ '@type': string; errorCode?: string }>;
  };
}

/**
 * FCM notification payload structure
 */
interface FCMNotification {
  title?: string;
  body: string;
  image?: string;
}

/**
 * FCM message structure for HTTP v1 API
 */
interface FCMMessage {
  token: string;
  notification?: FCMNotification;
  data?: Record<string, string>;
  android?: {
    priority?: 'normal' | 'high';
    notification?: {
      click_action?: string;
      sound?: string;
      tag?: string;
    };
  };
  apns?: {
    payload?: {
      aps?: {
        sound?: string;
        badge?: number;
        'content-available'?: number;
      };
    };
  };
}

/**
 * Map FCM error codes to delivery status
 */
function mapFCMErrorToStatus(errorCode?: string): DeliveryStatus {
  switch (errorCode) {
    case 'UNREGISTERED':
    case 'INVALID_ARGUMENT':
      return 'FAILED';
    case 'SENDER_ID_MISMATCH':
    case 'QUOTA_EXCEEDED':
      return 'FAILED';
    case 'UNAVAILABLE':
    case 'INTERNAL':
      return 'PENDING'; // Retryable
    default:
      return 'FAILED';
  }
}

/**
 * Firebase Cloud Messaging Provider Implementation
 */
export class FirebaseProvider extends BaseMessageProvider {
  readonly name = 'firebase';

  private readonly projectId: string;
  private readonly clientEmail: string;
  private readonly privateKey: string;
  private readonly apiUrl: string;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor() {
    super();
    this.projectId = process.env.FIREBASE_PROJECT_ID || '';
    this.clientEmail = process.env.FIREBASE_CLIENT_EMAIL || '';

    // Handle private key - may be base64 encoded or raw with escaped newlines
    let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
    if (privateKey && !privateKey.includes('-----BEGIN')) {
      // Try base64 decode
      try {
        privateKey = Buffer.from(privateKey, 'base64').toString('utf-8');
      } catch {
        // Not base64, try to unescape newlines
        privateKey = privateKey.replace(/\\n/g, '\n');
      }
    } else {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }
    this.privateKey = privateKey;

    this.apiUrl = `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`;
  }

  get isConfigured(): boolean {
    return !!(this.projectId && this.clientEmail && this.privateKey);
  }

  /**
   * Get OAuth2 access token for FCM
   */
  private async getAccessToken(): Promise<string | null> {
    // Return cached token if still valid
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    if (!this.isConfigured) {
      return null;
    }

    try {
      // Create JWT for service account
      const now = Math.floor(Date.now() / 1000);
      const header = {
        alg: 'RS256',
        typ: 'JWT',
      };
      const payload = {
        iss: this.clientEmail,
        scope: 'https://www.googleapis.com/auth/firebase.messaging',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600, // 1 hour
      };

      const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
      const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
      const signatureInput = `${headerB64}.${payloadB64}`;

      const signature = crypto
        .createSign('RSA-SHA256')
        .update(signatureInput)
        .sign(this.privateKey, 'base64url');

      const jwt = `${signatureInput}.${signature}`;

      // Exchange JWT for access token
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }).toString(),
      });

      const data = await response.json();

      if (!response.ok || !data.access_token) {
        this.log('error', 'Failed to get access token', data);
        return null;
      }

      this.accessToken = data.access_token;
      this.tokenExpiry = Date.now() + data.expires_in * 1000;

      return this.accessToken;
    } catch (error) {
      this.log('error', 'Error getting access token', error);
      return null;
    }
  }

  /**
   * Send push notification via FCM
   */
  async send(payload: SendMessagePayload): Promise<SendResult> {
    if (!this.isConfigured) {
      this.log('error', 'Firebase not configured - missing credentials');
      return {
        success: false,
        error: {
          code: 'PROVIDER_NOT_CONFIGURED',
          message: 'Firebase credentials not configured',
          retryable: false,
        },
      };
    }

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      return {
        success: false,
        error: {
          code: 'AUTH_FAILED',
          message: 'Failed to authenticate with Firebase',
          retryable: true,
        },
      };
    }

    // payload.to should be the FCM device token
    const deviceToken = payload.to;
    if (!deviceToken || deviceToken.length < 20) {
      return {
        success: false,
        error: {
          code: 'INVALID_DEVICE_TOKEN',
          message: 'Invalid or missing device token',
          retryable: false,
        },
      };
    }

    try {
      const fcmMessage: FCMMessage = {
        token: deviceToken,
        notification: {
          title: payload.subject || 'New Message',
          body: payload.body,
        },
        data: {
          messageId: payload.messageId,
          ...(payload.metadata || {}),
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ message: fcmMessage }),
      });

      const data = (await response.json()) as FCMSendResponse;

      if (!response.ok || data.error) {
        const errorCode = data.error?.details?.[0]?.errorCode;
        const isRetryable = this.isRetryableError(errorCode);

        this.log('error', 'FCM send failed', {
          status: response.status,
          error: data.error?.message,
          code: errorCode,
        });

        return {
          success: false,
          error: {
            code: errorCode || data.error?.status || 'FCM_ERROR',
            message: data.error?.message || 'Failed to send push notification',
            retryable: isRetryable,
          },
          rawResponse: data,
        };
      }

      // Extract message ID from response name
      const messageId = data.name?.split('/').pop() || data.name;

      this.log('info', 'Push notification sent successfully', {
        messageId,
        token: deviceToken.substring(0, 20) + '...',
      });

      return {
        success: true,
        providerMessageId: messageId,
        rawResponse: data,
      };
    } catch (error) {
      this.log('error', 'FCM API error', error);

      return {
        success: false,
        error: {
          code: 'FCM_API_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        },
      };
    }
  }

  /**
   * Parse FCM webhook/callback payload
   *
   * Note: FCM doesn't have built-in delivery webhooks like Twilio/SendGrid.
   * Delivery receipts require client-side acknowledgment or Analytics integration.
   */
  parseWebhook(
    rawBody: string | Record<string, unknown>,
    _headers: Record<string, string>
  ): WebhookPayload | null {
    // FCM delivery receipts are typically handled client-side
    // This implementation supports custom webhook formats if configured
    try {
      const data = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;

      // Support custom webhook format from client apps
      if (data.messageId && data.status) {
        return {
          provider: 'firebase',
          providerMessageId: data.messageId as string,
          status: this.mapCustomStatus(data.status as string),
          statusDetails: data.error?.message,
          errorCode: data.error?.code,
          timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
          rawData: data,
        };
      }

      this.log('warn', 'Unknown webhook format');
      return null;
    } catch (error) {
      this.log('error', 'Failed to parse webhook', error);
      return null;
    }
  }

  /**
   * Validate webhook signature
   *
   * For custom client webhooks, validate using a shared secret
   */
  validateWebhookSignature(rawBody: string, signature: string): boolean {
    const webhookSecret = process.env.FIREBASE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      this.log('warn', 'Cannot validate signature - webhook secret not configured');
      // In production, you'd want to return false here
      // For development, we'll allow unsigned webhooks
      return process.env.NODE_ENV !== 'production';
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      return signature === expectedSignature || signature === `sha256=${expectedSignature}`;
    } catch (error) {
      this.log('error', 'Signature validation error', error);
      return false;
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(errorCode?: string): boolean {
    if (!errorCode) return true;

    // Non-retryable errors
    const nonRetryable = [
      'UNREGISTERED', // Device token no longer valid
      'INVALID_ARGUMENT', // Bad request
      'SENDER_ID_MISMATCH', // Wrong sender
    ];

    return !nonRetryable.includes(errorCode);
  }

  /**
   * Map custom status strings to DeliveryStatus
   */
  private mapCustomStatus(status: string): DeliveryStatus {
    switch (status.toLowerCase()) {
      case 'received':
      case 'delivered':
        return 'DELIVERED';
      case 'opened':
      case 'read':
        return 'OPENED';
      case 'clicked':
        return 'CLICKED';
      case 'failed':
      case 'error':
        return 'FAILED';
      default:
        return 'SENT';
    }
  }

  /**
   * Override getStatus to provide more detailed health check
   */
  async getStatus(): Promise<{
    healthy: boolean;
    message?: string;
    details?: Record<string, unknown>;
  }> {
    if (!this.isConfigured) {
      return {
        healthy: false,
        message: 'Firebase not configured - missing credentials',
        details: {
          hasProjectId: !!this.projectId,
          hasClientEmail: !!this.clientEmail,
          hasPrivateKey: !!this.privateKey,
        },
      };
    }

    // Try to get an access token to verify credentials
    const token = await this.getAccessToken();
    if (!token) {
      return {
        healthy: false,
        message: 'Firebase credentials invalid - failed to get access token',
      };
    }

    return {
      healthy: true,
      message: 'Firebase configured and authenticated',
      details: {
        projectId: this.projectId,
        tokenExpiry: new Date(this.tokenExpiry).toISOString(),
      },
    };
  }
}

// Singleton instance
let firebaseProvider: FirebaseProvider | null = null;

/**
 * Get Firebase provider instance
 */
export function getFirebaseProvider(): FirebaseProvider {
  if (!firebaseProvider) {
    firebaseProvider = new FirebaseProvider();
  }
  return firebaseProvider;
}
