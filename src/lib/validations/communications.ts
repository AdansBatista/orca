import { z } from 'zod';

// =============================================================================
// ENUMS MATCHING PRISMA
// =============================================================================

/**
 * Message channel enum matching Prisma
 */
export const messageChannelEnum = z.enum(['SMS', 'EMAIL', 'PUSH', 'IN_APP']);

/**
 * Message direction enum matching Prisma
 */
export const messageDirectionEnum = z.enum(['OUTBOUND', 'INBOUND']);

/**
 * Message status enum matching Prisma
 */
export const messageStatusEnum = z.enum([
  'DRAFT',
  'PENDING',
  'SCHEDULED',
  'SENT',
  'DELIVERED',
  'FAILED',
  'BOUNCED',
  'CANCELLED',
]);

/**
 * Delivery status enum matching Prisma
 */
export const deliveryStatusEnum = z.enum([
  'PENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'BOUNCED',
  'OPENED',
  'CLICKED',
  'UNSUBSCRIBED',
  'COMPLAINED',
]);

/**
 * Template category options
 */
export const templateCategoryEnum = z.enum([
  'appointment',
  'billing',
  'treatment',
  'marketing',
  'general',
]);

// =============================================================================
// MESSAGE TEMPLATE SCHEMAS
// =============================================================================

/**
 * Create message template
 */
export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  category: templateCategoryEnum,

  // SMS content
  smsBody: z.string().max(1600).optional(), // SMS max with concatenation

  // Email content
  emailSubject: z.string().max(200).optional(),
  emailBody: z.string().max(50000).optional(),
  emailHtmlBody: z.string().max(100000).optional(),

  // Push notification content
  pushTitle: z.string().max(100).optional(),
  pushBody: z.string().max(500).optional(),

  // In-app notification content
  inAppTitle: z.string().max(100).optional(),
  inAppBody: z.string().max(1000).optional(),

  // Variables available for substitution
  variables: z.array(z.string()).optional(),

  isActive: z.boolean().optional().default(true),
});

/**
 * Update message template
 */
export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  category: templateCategoryEnum.optional(),

  smsBody: z.string().max(1600).nullable().optional(),
  emailSubject: z.string().max(200).nullable().optional(),
  emailBody: z.string().max(50000).nullable().optional(),
  emailHtmlBody: z.string().max(100000).nullable().optional(),
  pushTitle: z.string().max(100).nullable().optional(),
  pushBody: z.string().max(500).nullable().optional(),
  inAppTitle: z.string().max(100).nullable().optional(),
  inAppBody: z.string().max(1000).nullable().optional(),

  variables: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Preview template with variables
 */
export const previewTemplateSchema = z.object({
  channel: messageChannelEnum,
  variables: z.record(z.string(), z.string()).optional(),
});

// =============================================================================
// MESSAGE SCHEMAS
// =============================================================================

/**
 * Send a message
 */
export const sendMessageSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  channel: messageChannelEnum,

  // Content (either use template or provide direct content)
  templateId: z.string().optional(),
  subject: z.string().max(200).optional(), // For email
  body: z.string().min(1, 'Message body is required').max(50000),
  htmlBody: z.string().max(100000).optional(),

  // Template variables (if using template)
  variables: z.record(z.string(), z.string()).optional(),

  // Scheduling
  scheduledAt: z.string().datetime().optional(),

  // Optional: link to related entity
  relatedType: z.string().optional(),
  relatedId: z.string().optional(),

  // Tags for organization
  tags: z.array(z.string()).optional(),
});

/**
 * Send bulk messages
 */
export const sendBulkMessageSchema = z.object({
  patientIds: z.array(z.string()).min(1, 'At least one patient is required').max(1000),
  channel: messageChannelEnum,

  templateId: z.string().min(1, 'Template is required for bulk messages'),
  variables: z.record(z.string(), z.string()).optional(), // Common variables

  scheduledAt: z.string().datetime().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Reply to a message
 */
export const replyMessageSchema = z.object({
  body: z.string().min(1, 'Reply body is required').max(50000),
  htmlBody: z.string().max(100000).optional(),
});

// =============================================================================
// NOTIFICATION PREFERENCE SCHEMAS
// =============================================================================

/**
 * Update notification preferences
 */
export const updatePreferencesSchema = z.object({
  // Channel preferences
  smsEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),

  // Category preferences
  appointmentReminders: z.boolean().optional(),
  treatmentUpdates: z.boolean().optional(),
  billingNotifications: z.boolean().optional(),
  marketingMessages: z.boolean().optional(),

  // Channel priority
  channelPriority: z.array(messageChannelEnum).optional(),

  // Quiet hours
  quietHoursStart: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)')
    .nullable()
    .optional(),
  quietHoursEnd: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:MM)')
    .nullable()
    .optional(),
  timezone: z.string().max(50).nullable().optional(),
});

/**
 * Marketing consent update
 */
export const marketingConsentSchema = z.object({
  consent: z.boolean(),
  consentMethod: z.enum(['web', 'sms', 'verbal', 'form']),
});

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

/**
 * Query templates
 */
export const templateQuerySchema = z.object({
  category: templateCategoryEnum.optional(),
  isActive: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

/**
 * Query messages
 */
export const messageQuerySchema = z.object({
  patientId: z.string().optional(),
  channel: messageChannelEnum.optional(),
  status: messageStatusEnum.optional(),
  direction: messageDirectionEnum.optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

/**
 * Query patient conversation
 */
export const conversationQuerySchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  limit: z.coerce.number().min(1).max(100).default(50),
  before: z.string().datetime().optional(), // For pagination
});

/**
 * Query inbox (recent conversations)
 */
export const inboxQuerySchema = z.object({
  channel: messageChannelEnum.optional(),
  unreadOnly: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(50).default(20),
});

// =============================================================================
// WEBHOOK SCHEMAS
// =============================================================================

/**
 * Twilio webhook status callback
 */
export const twilioWebhookSchema = z.object({
  MessageSid: z.string(),
  MessageStatus: z.string(),
  To: z.string().optional(),
  From: z.string().optional(),
  ErrorCode: z.string().optional(),
  ErrorMessage: z.string().optional(),
});

/**
 * SendGrid webhook event
 */
export const sendgridWebhookSchema = z.object({
  email: z.string(),
  event: z.string(),
  sg_message_id: z.string().optional(),
  timestamp: z.number().optional(),
  url: z.string().optional(), // For click events
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type MessageChannel = z.infer<typeof messageChannelEnum>;
export type MessageDirection = z.infer<typeof messageDirectionEnum>;
export type MessageStatus = z.infer<typeof messageStatusEnum>;
export type DeliveryStatus = z.infer<typeof deliveryStatusEnum>;
export type TemplateCategory = z.infer<typeof templateCategoryEnum>;

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type PreviewTemplateInput = z.infer<typeof previewTemplateSchema>;

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type SendBulkMessageInput = z.infer<typeof sendBulkMessageSchema>;
export type ReplyMessageInput = z.infer<typeof replyMessageSchema>;

export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type MarketingConsentInput = z.infer<typeof marketingConsentSchema>;

export type TemplateQueryInput = z.infer<typeof templateQuerySchema>;
export type MessageQueryInput = z.infer<typeof messageQuerySchema>;
export type ConversationQueryInput = z.infer<typeof conversationQuerySchema>;
export type InboxQueryInput = z.infer<typeof inboxQuerySchema>;
