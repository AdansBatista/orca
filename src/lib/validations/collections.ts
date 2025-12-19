import { z } from 'zod';

// =============================================================================
// COLLECTIONS MANAGEMENT - Validation Schemas
// =============================================================================

// -----------------------------------------------------------------------------
// Enums (matching Prisma schema exactly)
// -----------------------------------------------------------------------------

export const CollectionPatientTypeEnum = z.enum([
  'PATIENT',
  'INSURANCE',
  'BOTH',
]);

export const CollectionStatusEnum = z.enum([
  'ACTIVE',
  'PAUSED',
  'PAYMENT_PLAN',
  'SETTLED',
  'WRITTEN_OFF',
  'AGENCY',
  'COMPLETED',
]);

export const WriteOffReasonEnum = z.enum([
  'BANKRUPTCY',
  'DECEASED',
  'UNCOLLECTIBLE',
  'STATUTE_OF_LIMITATIONS',
  'SMALL_BALANCE',
  'HARDSHIP',
  'OTHER',
]);

export const WriteOffStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'PARTIALLY_RECOVERED',
  'FULLY_RECOVERED',
]);

export const CollectionActivityTypeEnum = z.enum([
  'WORKFLOW_STARTED',
  'STAGE_ADVANCED',
  'EMAIL_SENT',
  'SMS_SENT',
  'LETTER_SENT',
  'PHONE_CALL',
  'TASK_CREATED',
  'PAYMENT_RECEIVED',
  'PROMISE_MADE',
  'PROMISE_BROKEN',
  'PAUSED',
  'RESUMED',
  'SENT_TO_AGENCY',
  'RECALLED_FROM_AGENCY',
  'WRITTEN_OFF',
  'COMPLETED',
  'MANUAL_NOTE',
]);

export const CommunicationChannelEnum = z.enum([
  'EMAIL',
  'SMS',
  'LETTER',
  'PHONE',
  'PORTAL',
]);

export const PromiseStatusEnum = z.enum([
  'PENDING',
  'FULFILLED',
  'PARTIAL',
  'BROKEN',
  'CANCELLED',
]);

export const AgencyReferralStatusEnum = z.enum([
  'ACTIVE',
  'COLLECTED',
  'PARTIAL',
  'RETURNED',
  'RECALLED',
]);

export const ReminderTypeEnum = z.enum([
  'UPCOMING_DUE',
  'PAST_DUE_GENTLE',
  'PAST_DUE_FIRM',
  'PAST_DUE_URGENT',
  'FINAL_NOTICE',
  'PAYMENT_PLAN_DUE',
  'PAYMENT_PLAN_LATE',
]);

export const CollectionActionTypeEnum = z.enum([
  'EMAIL',
  'SMS',
  'LETTER',
  'PHONE_CALL',
  'CREATE_TASK',
  'FLAG_ACCOUNT',
  'APPLY_LATE_FEE',
  'SEND_TO_AGENCY',
  'SUSPEND_TREATMENT',
]);

export const AgingBucketEnum = z.enum([
  'CURRENT',
  '1_30',
  '31_60',
  '61_90',
  '91_120',
  '120_PLUS',
]);

export const ARTypeEnum = z.enum([
  'PATIENT',
  'INSURANCE',
  'ALL',
]);

// -----------------------------------------------------------------------------
// Collection Action Schema (for workflow stages)
// -----------------------------------------------------------------------------

export const collectionActionSchema = z.object({
  type: CollectionActionTypeEnum,
  templateId: z.string().optional().nullable(),
  assignTo: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// -----------------------------------------------------------------------------
// Collection Workflow Schemas
// -----------------------------------------------------------------------------

export const createCollectionWorkflowSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  triggerDays: z.number().int().min(1).max(365),
  minBalance: z.number().min(0).default(0),
  patientType: CollectionPatientTypeEnum.optional().nullable(),
  stages: z.array(z.object({
    stageNumber: z.number().int().min(1),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional().nullable(),
    daysFromPrevious: z.number().int().min(0),
    daysOverdue: z.number().int().min(0),
    escalateAfterDays: z.number().int().min(1).optional().nullable(),
    actions: z.array(collectionActionSchema).default([]),
  })).min(1, 'At least one stage is required'),
});

export const updateCollectionWorkflowSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
  triggerDays: z.number().int().min(1).max(365).optional(),
  minBalance: z.number().min(0).optional(),
  patientType: CollectionPatientTypeEnum.optional().nullable(),
});

export const collectionWorkflowQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  patientType: CollectionPatientTypeEnum.optional(),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  pageSize: z.string().optional().transform(val => Math.min(parseInt(val || '20', 10), 100)),
  sortBy: z.string().optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// -----------------------------------------------------------------------------
// Collection Stage Schemas
// -----------------------------------------------------------------------------

export const createCollectionStageSchema = z.object({
  stageNumber: z.number().int().min(1),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  daysFromPrevious: z.number().int().min(0),
  daysOverdue: z.number().int().min(0),
  escalateAfterDays: z.number().int().min(1).optional().nullable(),
  actions: z.array(collectionActionSchema).default([]),
});

export const updateCollectionStageSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  daysFromPrevious: z.number().int().min(0).optional(),
  daysOverdue: z.number().int().min(0).optional(),
  escalateAfterDays: z.number().int().min(1).optional().nullable(),
  actions: z.array(collectionActionSchema).optional(),
});

// -----------------------------------------------------------------------------
// Account Collection Schemas
// -----------------------------------------------------------------------------

export const accountCollectionQuerySchema = z.object({
  search: z.string().optional(),
  workflowId: z.string().optional(),
  status: CollectionStatusEnum.optional(),
  minBalance: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxBalance: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  currentStage: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  hasPromise: z.string().optional().transform(val => val === 'true'),
  atAgency: z.string().optional().transform(val => val === 'true'),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  pageSize: z.string().optional().transform(val => Math.min(parseInt(val || '20', 10), 100)),
  sortBy: z.string().optional().default('currentBalance'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const pauseAccountCollectionSchema = z.object({
  reason: z.string().min(1, 'Pause reason is required').max(500),
});

export const resumeAccountCollectionSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
});

export const advanceStageSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
  skipActions: z.boolean().default(false),
});

export const addActivitySchema = z.object({
  activityType: CollectionActivityTypeEnum,
  description: z.string().min(1).max(1000),
  channel: CommunicationChannelEnum.optional().nullable(),
  templateUsed: z.string().max(200).optional().nullable(),
  sentTo: z.string().max(200).optional().nullable(),
  result: z.string().max(500).optional().nullable(),
  responseReceived: z.boolean().optional(),
  paymentReceived: z.number().min(0).optional().nullable(),
});

// -----------------------------------------------------------------------------
// Payment Promise Schemas
// -----------------------------------------------------------------------------

export const createPaymentPromiseSchema = z.object({
  promisedAmount: z.number().positive('Amount must be positive'),
  promisedDate: z.coerce.date(),
  notes: z.string().max(500).optional().nullable(),
});

export const updatePaymentPromiseSchema = z.object({
  promisedAmount: z.number().positive().optional(),
  promisedDate: z.coerce.date().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const fulfillPromiseSchema = z.object({
  paidAmount: z.number().positive('Payment amount must be positive'),
  paidDate: z.coerce.date().optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const markPromiseBrokenSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

export const paymentPromiseQuerySchema = z.object({
  search: z.string().optional(),
  accountId: z.string().optional(),
  status: PromiseStatusEnum.optional(),
  dueToday: z.string().optional().transform(val => val === 'true'),
  overdue: z.string().optional().transform(val => val === 'true'),
  fromDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  toDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  pageSize: z.string().optional().transform(val => Math.min(parseInt(val || '20', 10), 100)),
  sortBy: z.string().optional().default('promisedDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// -----------------------------------------------------------------------------
// Collection Agency Schemas
// -----------------------------------------------------------------------------

export const createCollectionAgencySchema = z.object({
  name: z.string().min(1, 'Agency name is required').max(200),
  contactName: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  street: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  exportFormat: z.string().max(20).default('CSV'),
  feePercentage: z.number().min(0).max(100).optional().nullable(),
  minBalance: z.number().min(0).default(100),
  minDays: z.number().int().min(1).default(120),
  isActive: z.boolean().default(true),
});

export const updateCollectionAgencySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  contactName: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  street: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zip: z.string().max(20).optional().nullable(),
  exportFormat: z.string().max(20).optional(),
  feePercentage: z.number().min(0).max(100).optional().nullable(),
  minBalance: z.number().min(0).optional(),
  minDays: z.number().int().min(1).optional(),
  isActive: z.boolean().optional(),
});

export const collectionAgencyQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  pageSize: z.string().optional().transform(val => Math.min(parseInt(val || '20', 10), 100)),
  sortBy: z.string().optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const sendToAgencySchema = z.object({
  agencyId: z.string().min(1, 'Agency is required'),
  notes: z.string().max(500).optional().nullable(),
});

export const recallFromAgencySchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(500),
});

export const recordAgencyPaymentSchema = z.object({
  referralId: z.string().min(1, 'Referral is required'),
  grossAmount: z.number().positive('Amount must be positive'),
  agencyFee: z.number().min(0),
  paymentDate: z.coerce.date(),
  agencyReference: z.string().max(100).optional().nullable(),
  checkNumber: z.string().max(50).optional().nullable(),
});

// -----------------------------------------------------------------------------
// Write-Off Schemas
// -----------------------------------------------------------------------------

export const createWriteOffSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  invoiceId: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  reason: WriteOffReasonEnum,
  reasonDetails: z.string().max(1000).optional().nullable(),
});

export const writeOffQuerySchema = z.object({
  search: z.string().optional(),
  accountId: z.string().optional(),
  status: WriteOffStatusEnum.optional(),
  reason: WriteOffReasonEnum.optional(),
  minAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxAmount: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  fromDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  toDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  pendingOnly: z.string().optional().transform(val => val === 'true'),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  pageSize: z.string().optional().transform(val => Math.min(parseInt(val || '20', 10), 100)),
  sortBy: z.string().optional().default('requestedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const approveWriteOffSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
});

export const rejectWriteOffSchema = z.object({
  reason: z.string().min(1, 'Rejection reason is required').max(500),
});

export const recoverWriteOffSchema = z.object({
  amount: z.number().positive('Recovery amount must be positive'),
  paymentId: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

// -----------------------------------------------------------------------------
// Payment Reminder Schemas
// -----------------------------------------------------------------------------

export const sendReminderSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  reminderType: ReminderTypeEnum,
  channel: CommunicationChannelEnum,
  templateId: z.string().optional().nullable(),
  subject: z.string().max(200).optional().nullable(),
  body: z.string().max(5000).optional().nullable(),
  includePaymentLink: z.boolean().default(true),
});

export const batchSendRemindersSchema = z.object({
  reminderType: ReminderTypeEnum,
  channel: CommunicationChannelEnum,
  templateId: z.string().optional().nullable(),
  minDaysOverdue: z.number().int().min(0).optional(),
  maxDaysOverdue: z.number().int().min(0).optional(),
  minBalance: z.number().min(0).optional(),
  maxAccountsToSend: z.number().int().min(1).max(500).default(100),
  includePaymentLink: z.boolean().default(true),
});

export const reminderQuerySchema = z.object({
  search: z.string().optional(),
  accountId: z.string().optional(),
  reminderType: ReminderTypeEnum.optional(),
  channel: CommunicationChannelEnum.optional(),
  fromDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  toDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  paymentReceived: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  pageSize: z.string().optional().transform(val => Math.min(parseInt(val || '20', 10), 100)),
  sortBy: z.string().optional().default('sentAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// -----------------------------------------------------------------------------
// Aging Report Schemas
// -----------------------------------------------------------------------------

export const agingReportQuerySchema = z.object({
  arType: ARTypeEnum.optional().default('ALL'),
  includeZeroBalance: z.string().optional().transform(val => val === 'true'),
  minBalance: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  groupBy: z.enum(['patient', 'guarantor', 'payer', 'workflow']).optional(),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  pageSize: z.string().optional().transform(val => Math.min(parseInt(val || '100', 10), 500)),
});

export const agingExportSchema = z.object({
  format: z.enum(['PDF', 'EXCEL', 'CSV']).default('PDF'),
  arType: ARTypeEnum.optional().default('ALL'),
  includeZeroBalance: z.boolean().default(false),
  minBalance: z.number().min(0).optional(),
  groupBy: z.enum(['patient', 'guarantor', 'payer']).optional(),
});

// -----------------------------------------------------------------------------
// Collection Analytics Schemas
// -----------------------------------------------------------------------------

export const analyticsQuerySchema = z.object({
  fromDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  toDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  period: z.enum(['day', 'week', 'month', 'quarter', 'year']).optional().default('month'),
  workflowId: z.string().optional(),
  staffId: z.string().optional(),
});

export const staffPerformanceQuerySchema = z.object({
  fromDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  toDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  staffId: z.string().optional(),
  page: z.string().optional().transform(val => parseInt(val || '1', 10)),
  pageSize: z.string().optional().transform(val => Math.min(parseInt(val || '20', 10), 100)),
  sortBy: z.string().optional().default('amountCollected'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// -----------------------------------------------------------------------------
// Type Exports
// -----------------------------------------------------------------------------

export type CollectionPatientType = z.infer<typeof CollectionPatientTypeEnum>;
export type CollectionStatus = z.infer<typeof CollectionStatusEnum>;
export type WriteOffReason = z.infer<typeof WriteOffReasonEnum>;
export type WriteOffStatus = z.infer<typeof WriteOffStatusEnum>;
export type CollectionActivityType = z.infer<typeof CollectionActivityTypeEnum>;
export type CommunicationChannel = z.infer<typeof CommunicationChannelEnum>;
export type PromiseStatus = z.infer<typeof PromiseStatusEnum>;
export type AgencyReferralStatus = z.infer<typeof AgencyReferralStatusEnum>;
export type ReminderType = z.infer<typeof ReminderTypeEnum>;
export type CollectionActionType = z.infer<typeof CollectionActionTypeEnum>;
export type AgingBucket = z.infer<typeof AgingBucketEnum>;
export type ARType = z.infer<typeof ARTypeEnum>;

export type CreateCollectionWorkflowInput = z.infer<typeof createCollectionWorkflowSchema>;
export type UpdateCollectionWorkflowInput = z.infer<typeof updateCollectionWorkflowSchema>;
export type CreateCollectionStageInput = z.infer<typeof createCollectionStageSchema>;
export type UpdateCollectionStageInput = z.infer<typeof updateCollectionStageSchema>;
export type CreatePaymentPromiseInput = z.infer<typeof createPaymentPromiseSchema>;
export type CreateCollectionAgencyInput = z.infer<typeof createCollectionAgencySchema>;
export type UpdateCollectionAgencyInput = z.infer<typeof updateCollectionAgencySchema>;
export type CreateWriteOffInput = z.infer<typeof createWriteOffSchema>;
export type SendReminderInput = z.infer<typeof sendReminderSchema>;
export type BatchSendRemindersInput = z.infer<typeof batchSendRemindersSchema>;
