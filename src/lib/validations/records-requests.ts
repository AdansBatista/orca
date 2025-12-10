import { z } from 'zod';

// =============================================================================
// Enums (matching Prisma schema)
// =============================================================================

export const RecordDirectionEnum = z.enum([
  'INCOMING',
  'OUTGOING',
]);

export const RecordTypeEnum = z.enum([
  'XRAYS',
  'PHOTOS',
  'TREATMENT_RECORDS',
  'MEDICAL_HISTORY',
  'BILLING_RECORDS',
  'ALL',
]);

export const RecordRequestStatusEnum = z.enum([
  'PENDING',
  'SENT',
  'RECEIVED',
  'COMPLETED',
  'CANCELLED',
]);

// =============================================================================
// Create/Update Schemas
// =============================================================================

export const createRecordsRequestSchema = z.object({
  // Required fields
  direction: RecordDirectionEnum,
  providerName: z.string().min(1, 'Provider name is required').max(200),

  // Patient/Lead reference (at least one should be provided)
  patientId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),

  // Provider contact info
  providerPhone: z.string().max(20).optional().nullable(),
  providerFax: z.string().max(20).optional().nullable(),
  providerEmail: z.string().email('Invalid email').max(255).optional().nullable(),
  providerAddress: z.string().max(500).optional().nullable(),

  // Request details
  recordTypes: z.array(RecordTypeEnum).min(1, 'At least one record type is required'),
  dateRange: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),

  // Dates
  dueDate: z.coerce.date().optional().nullable(),

  // Authorization
  authorizationSigned: z.boolean().default(false),
  authorizationDate: z.coerce.date().optional().nullable(),
});

export const updateRecordsRequestSchema = createRecordsRequestSchema.partial().extend({
  status: RecordRequestStatusEnum.optional(),
});

export const recordsRequestQuerySchema = z.object({
  search: z.string().optional(),
  direction: RecordDirectionEnum.optional(),
  status: RecordRequestStatusEnum.optional(),
  patientId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'dueDate', 'providerName', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// Status Update Schemas
// =============================================================================

export const markSentSchema = z.object({
  sentAt: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
});

export const markReceivedSchema = z.object({
  receivedAt: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
});

// =============================================================================
// Type exports
// =============================================================================

export type CreateRecordsRequestInput = z.infer<typeof createRecordsRequestSchema>;
export type UpdateRecordsRequestInput = z.infer<typeof updateRecordsRequestSchema>;
export type RecordsRequestQuery = z.infer<typeof recordsRequestQuerySchema>;
