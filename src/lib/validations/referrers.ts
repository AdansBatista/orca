import { z } from 'zod';

// =============================================================================
// Enums (matching Prisma schema)
// =============================================================================

export const ReferringProviderTypeEnum = z.enum([
  'GENERAL_DENTIST',
  'PEDIATRIC_DENTIST',
  'ORAL_SURGEON',
  'PERIODONTIST',
  'ENDODONTIST',
  'PROSTHODONTIST',
  'OTHER_SPECIALIST',
  'PHYSICIAN',
  'OTHER',
]);

export const ReferrerStatusEnum = z.enum([
  'ACTIVE',
  'INACTIVE',
  'PREFERRED',
]);

export const ReferralLetterTypeEnum = z.enum([
  'THANK_YOU_NEW_PATIENT',
  'THANK_YOU_CONSULTATION',
  'TREATMENT_STARTED',
  'PROGRESS_UPDATE',
  'TREATMENT_COMPLETE',
  'GENERAL_APPRECIATION',
]);

export const ReferralDeliveryMethodEnum = z.enum([
  'EMAIL',
  'FAX',
  'MAIL',
  'PORTAL',
]);

// =============================================================================
// Create/Update Schemas
// =============================================================================

export const createReferringProviderSchema = z.object({
  // Required fields
  practiceName: z.string().min(1, 'Practice name is required').max(200),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),

  // Optional fields
  type: ReferringProviderTypeEnum.default('GENERAL_DENTIST'),
  credentials: z.string().max(50).optional().nullable(),

  // Contact
  email: z.string().email('Invalid email').max(255).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  fax: z.string().max(20).optional().nullable(),
  website: z.string().url('Invalid URL').max(255).optional().nullable(),

  // Address
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(), // Province for Canada
  zipCode: z.string().max(20).optional().nullable(), // Postal code for Canada

  // Relationship
  status: ReferrerStatusEnum.default('ACTIVE'),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateReferringProviderSchema = createReferringProviderSchema.partial();

export const referringProviderQuerySchema = z.object({
  search: z.string().optional(),
  status: ReferrerStatusEnum.optional(),
  type: ReferringProviderTypeEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'practiceName', 'lastName', 'totalReferrals']).default('practiceName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// =============================================================================
// Referral Letter Schemas
// =============================================================================

export const createReferralLetterSchema = z.object({
  providerId: z.string().min(1, 'Provider is required'),
  patientId: z.string().optional().nullable(),
  leadId: z.string().optional().nullable(),

  type: ReferralLetterTypeEnum,
  subject: z.string().min(1, 'Subject is required').max(200),
  body: z.string().min(1, 'Body is required').max(10000),
});

export const sendReferralLetterSchema = z.object({
  method: ReferralDeliveryMethodEnum,
});

// =============================================================================
// Type exports
// =============================================================================

export type CreateReferringProviderInput = z.infer<typeof createReferringProviderSchema>;
export type UpdateReferringProviderInput = z.infer<typeof updateReferringProviderSchema>;
export type ReferringProviderQuery = z.infer<typeof referringProviderQuerySchema>;
export type CreateReferralLetterInput = z.infer<typeof createReferralLetterSchema>;
