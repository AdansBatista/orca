/**
 * Base Message Provider
 *
 * Abstract base class for all messaging providers.
 * Defines the common interface that all providers must implement.
 */

import type { SendMessagePayload, SendResult, WebhookPayload } from '../types';

/**
 * Abstract base class for messaging providers
 */
export abstract class BaseMessageProvider {
  /** Provider name identifier */
  abstract readonly name: string;

  /** Whether the provider is properly configured */
  abstract readonly isConfigured: boolean;

  /**
   * Send a message through this provider
   *
   * @param payload - Message payload to send
   * @returns Result of the send operation
   */
  abstract send(payload: SendMessagePayload): Promise<SendResult>;

  /**
   * Parse and validate incoming webhook data
   *
   * @param rawBody - Raw webhook body (string or object)
   * @param headers - Request headers for signature validation
   * @returns Parsed webhook payload or null if invalid
   */
  abstract parseWebhook(
    rawBody: string | Record<string, unknown>,
    headers: Record<string, string>
  ): WebhookPayload | null;

  /**
   * Validate webhook signature (if applicable)
   *
   * @param rawBody - Raw request body
   * @param signature - Signature from headers
   * @returns Whether the signature is valid
   */
  abstract validateWebhookSignature(
    rawBody: string,
    signature: string
  ): boolean;

  /**
   * Get provider status/health
   *
   * @returns Provider health information
   */
  async getStatus(): Promise<{
    healthy: boolean;
    message?: string;
    details?: Record<string, unknown>;
  }> {
    return {
      healthy: this.isConfigured,
      message: this.isConfigured
        ? 'Provider configured'
        : 'Provider not configured - missing credentials',
    };
  }

  /**
   * Log provider activity for debugging
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: unknown): void {
    const prefix = `[${this.name}]`;
    switch (level) {
      case 'info':
        console.log(prefix, message, data ?? '');
        break;
      case 'warn':
        console.warn(prefix, message, data ?? '');
        break;
      case 'error':
        console.error(prefix, message, data ?? '');
        break;
    }
  }
}

/**
 * Provider factory type
 */
export type ProviderFactory = () => BaseMessageProvider;
