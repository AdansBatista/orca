import { z } from 'zod';

// =============================================================================
// Enums (matching Prisma schema)
// =============================================================================

export const ContactMethodEnum = z.enum([
  'PHONE',
  'EMAIL',
  'TEXT',
  'MAIL',
]);

export const LeadSourceEnum = z.enum([
  'WEBSITE',
  'PHONE_CALL',
  'WALK_IN',
  'REFERRAL_DENTIST',
  'REFERRAL_PATIENT',
  'SOCIAL_MEDIA',
  'GOOGLE_ADS',
  'INSURANCE_DIRECTORY',
  'OTHER',
]);

export const LeadStageEnum = z.enum([
  'INQUIRY',
  'CONTACTED',
  'CONSULTATION_SCHEDULED',
  'CONSULTATION_COMPLETED',
  'PENDING_DECISION',
  'TREATMENT_ACCEPTED',
  'TREATMENT_STARTED',
  'LOST',
]);

export const LeadStatusEnum = z.enum([
  'NEW',
  'IN_PROGRESS',
  'CONVERTED',
  'LOST',
]);

export const LeadPatientTypeEnum = z.enum([
  'NEW_PATIENT',
  'RETURNING_PATIENT',
  'TRANSFER_PATIENT',
]);

export const LeadActivityTypeEnum = z.enum([
  'NOTE',
  'CALL',
  'EMAIL',
  'TEXT',
  'MEETING',
  'STAGE_CHANGE',
  'STATUS_CHANGE',
  'ASSIGNMENT_CHANGE',
  'FORM_SUBMITTED',
  'DOCUMENT_UPLOADED',
  'SYSTEM',
]);

export const LeadTaskStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export const LeadTaskPriorityEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT',
]);

// =============================================================================
// Create/Update Schemas
// =============================================================================

export const createLeadSchema = z.object({
  // Required fields
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().min(1, 'Phone number is required').max(20),
  source: LeadSourceEnum,

  // Optional contact info
  email: z.string().email('Invalid email').max(255).optional().nullable(),
  preferredContact: ContactMethodEnum.default('PHONE'),

  // Lead source details
  sourceDetails: z.string().max(500).optional().nullable(),
  referringDentistId: z.string().optional().nullable(),

  // Pipeline
  status: LeadStatusEnum.default('NEW'),
  stage: LeadStageEnum.default('INQUIRY'),
  assignedToId: z.string().optional().nullable(),

  // Patient info
  patientType: LeadPatientTypeEnum.default('NEW_PATIENT'),
  patientAge: z.number().int().min(0).max(120).optional().nullable(),
  isMinor: z.boolean().default(false),
  guardianName: z.string().max(200).optional().nullable(),
  guardianPhone: z.string().max(20).optional().nullable(),
  guardianEmail: z.string().email().max(255).optional().nullable(),

  // Interest / Reason
  primaryConcern: z.string().max(1000).optional().nullable(),
  treatmentInterest: z.string().max(500).optional().nullable(),
  urgency: z.string().max(50).optional().nullable(),

  // Consultation
  consultationDate: z.coerce.date().optional().nullable(),
  consultationNotes: z.string().max(5000).optional().nullable(),
});

export const updateLeadSchema = createLeadSchema.partial();

export const leadQuerySchema = z.object({
  search: z.string().optional(),
  status: LeadStatusEnum.optional(),
  stage: LeadStageEnum.optional(),
  source: LeadSourceEnum.optional(),
  assignedToId: z.string().optional(),
  patientType: LeadPatientTypeEnum.optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'firstName', 'lastName', 'stage']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// =============================================================================
// Lead Activity Schemas
// =============================================================================

export const createLeadActivitySchema = z.object({
  type: LeadActivityTypeEnum,
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(5000).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

// =============================================================================
// Lead Task Schemas
// =============================================================================

export const createLeadTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  priority: LeadTaskPriorityEnum.default('MEDIUM'),
  status: LeadTaskStatusEnum.default('PENDING'),
  assignedToId: z.string().optional().nullable(),
});

export const updateLeadTaskSchema = createLeadTaskSchema.partial();

// =============================================================================
// Lead Conversion Schema
// =============================================================================

export const convertLeadSchema = z.object({
  // Patient data to create
  dateOfBirth: z.coerce.date().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),

  // Insurance info
  insuranceProvider: z.string().optional(),
  insurancePolicyNumber: z.string().optional(),

  // Notes
  notes: z.string().max(2000).optional(),
});

// =============================================================================
// Pipeline Schema
// =============================================================================

export const updateLeadStageSchema = z.object({
  stage: LeadStageEnum,
  notes: z.string().max(1000).optional(),
});

export const updateLeadStatusSchema = z.object({
  status: LeadStatusEnum,
  lostReason: z.string().max(500).optional(),
});

// =============================================================================
// Type exports
// =============================================================================

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type LeadQuery = z.infer<typeof leadQuerySchema>;
export type CreateLeadActivityInput = z.infer<typeof createLeadActivitySchema>;
export type CreateLeadTaskInput = z.infer<typeof createLeadTaskSchema>;
export type UpdateLeadTaskInput = z.infer<typeof updateLeadTaskSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
