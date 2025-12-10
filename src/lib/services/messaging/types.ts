/**
 * Messaging Provider Types
 *
 * Core type definitions for the messaging infrastructure.
 * Used by all provider implementations and the messaging service.
 */

/**
 * Supported messaging channels
 */
export type MessageChannel = 'SMS' | 'EMAIL' | 'PUSH' | 'IN_APP';

/**
 * Provider identifiers
 */
export type ProviderType = 'twilio' | 'sendgrid' | 'firebase' | 'internal';

/**
 * Delivery status from providers
 */
export type DeliveryStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'BOUNCED'
  | 'OPENED'
  | 'CLICKED'
  | 'UNSUBSCRIBED'
  | 'COMPLAINED';

/**
 * Base message payload for sending
 */
export interface SendMessagePayload {
  /** Internal message ID */
  messageId: string;
  /** Target channel */
  channel: MessageChannel;
  /** Recipient address (phone, email, device token) */
  to: string;
  /** Sender address/identity */
  from?: string;
  /** Message subject (email only) */
  subject?: string;
  /** Plain text body */
  body: string;
  /** HTML body (email only) */
  htmlBody?: string;
  /** Additional metadata */
  metadata?: Record<string, string>;
}

/**
 * Result from sending a message
 */
export interface SendResult {
  success: boolean;
  /** Provider-specific message ID */
  providerMessageId?: string;
  /** Error details if failed */
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  /** Raw response from provider */
  rawResponse?: unknown;
}

/**
 * Webhook payload from providers
 */
export interface WebhookPayload {
  provider: ProviderType;
  /** Provider's message ID */
  providerMessageId: string;
  /** New delivery status */
  status: DeliveryStatus;
  /** Status details/reason */
  statusDetails?: string;
  /** Error code if applicable */
  errorCode?: string;
  /** Timestamp of the event */
  timestamp: Date;
  /** Raw webhook data */
  rawData: unknown;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /** Whether provider is enabled */
  enabled: boolean;
  /** Provider-specific configuration */
  config: Record<string, string>;
}

/**
 * Template variable substitution context
 */
export interface TemplateVariables {
  // Patient variables
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  phone?: string;

  // Appointment variables
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentDateTime?: string;

  // Provider/Staff variables
  providerName?: string;
  providerTitle?: string;

  // Clinic variables
  clinicName?: string;
  clinicPhone?: string;
  clinicAddress?: string;
  clinicEmail?: string;

  // Treatment variables
  treatmentType?: string;
  treatmentPhase?: string;

  // Billing variables
  amount?: string;
  dueDate?: string;
  invoiceNumber?: string;

  // Custom variables
  [key: string]: string | undefined;
}

/**
 * Bulk message request
 */
export interface BulkMessageRequest {
  /** Template ID to use */
  templateId: string;
  /** Channel to send on */
  channel: MessageChannel;
  /** Recipients with their variables */
  recipients: {
    patientId: string;
    to: string;
    variables?: TemplateVariables;
  }[];
  /** Common variables for all messages */
  commonVariables?: TemplateVariables;
  /** Schedule for later delivery */
  scheduledAt?: Date;
  /** Tags for organization */
  tags?: string[];
}

/**
 * Scheduled message job data
 */
export interface ScheduledMessageJob {
  messageId: string;
  scheduledAt: Date;
  attempts: number;
  lastAttemptAt?: Date;
  lastError?: string;
}

/**
 * Message queue job
 */
export interface MessageQueueJob {
  id: string;
  type: 'send' | 'bulk' | 'scheduled';
  payload: SendMessagePayload | BulkMessageRequest | ScheduledMessageJob;
  priority: number;
  createdAt: Date;
  processAt: Date;
}
