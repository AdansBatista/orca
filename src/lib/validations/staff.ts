import { z } from 'zod';

// =============================================================================
// Enums (matching Prisma schema)
// =============================================================================

export const EmploymentTypeEnum = z.enum([
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'PRN',
  'TEMP',
]);

export const StaffStatusEnum = z.enum([
  'ACTIVE',
  'ON_LEAVE',
  'TERMINATED',
  'SUSPENDED',
  'PENDING',
]);

export const ProviderTypeEnum = z.enum([
  'ORTHODONTIST',
  'GENERAL_DENTIST',
  'ORAL_SURGEON',
  'PERIODONTIST',
  'ENDODONTIST',
  'HYGIENIST',
  'DENTAL_ASSISTANT',
  'EFDA',
  'OTHER',
]);

export const CredentialTypeEnum = z.enum([
  'STATE_LICENSE',
  'DEA_REGISTRATION',
  'NPI',
  'BOARD_CERTIFICATION',
  'SPECIALTY_CERTIFICATION',
  'RADIOLOGY_LICENSE',
  'SEDATION_PERMIT',
  'CONTROLLED_SUBSTANCE',
  'OTHER',
]);

export const CredentialStatusEnum = z.enum([
  'ACTIVE',
  'EXPIRED',
  'PENDING',
  'SUSPENDED',
  'REVOKED',
  'RENEWAL_PENDING',
]);

export const CertificationTypeEnum = z.enum([
  'CPR_BLS',
  'ACLS',
  'PALS',
  'RADIOLOGY',
  'NITROUS_OXIDE',
  'LASER_CERTIFICATION',
  'INVISALIGN',
  'SURESMILE',
  'INCOGNITO',
  'DAMON',
  'INFECTION_CONTROL',
  'HIPAA',
  'OSHA',
  'OTHER',
]);

export const CertificationStatusEnum = z.enum([
  'ACTIVE',
  'EXPIRED',
  'PENDING',
  'REVOKED',
]);

export const DocumentAccessLevelEnum = z.enum([
  'PUBLIC',
  'STAFF_ONLY',
  'HR_ONLY',
  'MANAGEMENT',
  'CONFIDENTIAL',
]);

export const EmploymentRecordTypeEnum = z.enum([
  'HIRE',
  'PROMOTION',
  'TRANSFER',
  'DEMOTION',
  'TERMINATION',
  'RESIGNATION',
  'STATUS_CHANGE',
  'DEPARTMENT_CHANGE',
  'TITLE_CHANGE',
  'EMPLOYMENT_TYPE_CHANGE',
  'LEAVE_START',
  'LEAVE_END',
  'REHIRE',
  'OTHER',
]);

export const DocumentCategoryEnum = z.enum([
  'CONTRACT',
  'ID',
  'TAX',
  'MEDICAL',
  'BACKGROUND',
  'CERTIFICATION',
  'PERFORMANCE',
  'DISCIPLINARY',
  'OTHER',
]);

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validates NPI (National Provider Identifier) format
 * NPI is a 10-digit number with a checksum based on the Luhn algorithm
 */
export const npiSchema = z
  .string()
  .regex(/^\d{10}$/, 'NPI must be exactly 10 digits')
  .refine((npi) => {
    // Luhn checksum validation for NPI
    // NPI uses prefix "80840" for the Luhn check
    const prefixed = '80840' + npi;
    let sum = 0;
    let alternate = false;

    for (let i = prefixed.length - 1; i >= 0; i--) {
      let digit = parseInt(prefixed[i], 10);

      if (alternate) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      alternate = !alternate;
    }

    return sum % 10 === 0;
  }, 'Invalid NPI checksum')
  .optional()
  .nullable();

/**
 * Validates DEA number format
 * DEA numbers follow a specific pattern: 2 letters + 6 digits + 1 check digit
 */
export const deaSchema = z
  .string()
  .regex(
    /^[A-Za-z]{2}\d{7}$/,
    'DEA number must be 2 letters followed by 7 digits'
  )
  .optional()
  .nullable();

// Phone number validation (flexible for North American formats)
export const phoneSchema = z
  .string()
  .regex(
    /^[\d\s\-\(\)\+\.]+$/,
    'Invalid phone number format'
  )
  .min(10, 'Phone number must be at least 10 digits')
  .max(20, 'Phone number is too long')
  .optional()
  .nullable();

// =============================================================================
// Staff Profile Schemas
// =============================================================================

export const createStaffProfileSchema = z.object({
  // User link (optional - can create staff without user account)
  userId: z.string().optional(),
  employeeNumber: z.string().min(1, 'Employee number is required'),

  // Personal Information
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  middleName: z.string().max(100).optional().nullable(),
  preferredName: z.string().max(100).optional().nullable(),
  email: z.string().email('Invalid email address'),
  phone: phoneSchema,
  mobilePhone: phoneSchema,
  dateOfBirth: z.coerce.date().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  country: z.string().max(100).default('CA'),

  // Employment Information
  employmentType: EmploymentTypeEnum.default('FULL_TIME'),
  status: StaffStatusEnum.default('ACTIVE'),
  hireDate: z.coerce.date(),
  terminationDate: z.coerce.date().optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  title: z.string().max(100).optional().nullable(),

  // Provider-Specific Fields
  isProvider: z.boolean().default(false),
  providerType: ProviderTypeEnum.optional().nullable(),
  npiNumber: npiSchema,
  deaNumber: deaSchema,
  stateLicenseNumber: z.string().max(50).optional().nullable(),

  // Work Preferences
  defaultClinicId: z.string().optional().nullable(),
  clinicIds: z.array(z.string()).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateStaffProfileSchema = createStaffProfileSchema.partial().extend({
  id: z.string(),
});

// Helper to handle "all" or empty string as undefined for optional enum fields
const optionalEnumWithAll = <T extends z.ZodTypeAny>(enumSchema: T) =>
  z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    return val;
  }, enumSchema.optional());

// Helper to handle "all" or empty string for optional boolean
const optionalBooleanWithAll = z.preprocess((val) => {
  if (val === '' || val === 'all' || val === null) return undefined;
  if (val === 'true') return true;
  if (val === 'false') return false;
  return val;
}, z.boolean().optional());

export const staffProfileQuerySchema = z.object({
  search: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  status: optionalEnumWithAll(StaffStatusEnum),
  employmentType: optionalEnumWithAll(EmploymentTypeEnum),
  isProvider: optionalBooleanWithAll,
  providerType: optionalEnumWithAll(ProviderTypeEnum),
  department: z.preprocess((val) => (val === '' ? undefined : val), z.string().optional()),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['lastName', 'firstName', 'hireDate', 'status', 'createdAt']).default('lastName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// =============================================================================
// Credential Schemas
// =============================================================================

export const createCredentialSchema = z.object({
  staffProfileId: z.string(),
  type: CredentialTypeEnum,
  name: z.string().min(1, 'Credential name is required').max(200),
  number: z.string().min(1, 'Credential number is required').max(100),
  issuingAuthority: z.string().min(1, 'Issuing authority is required').max(200),
  issuingState: z.string().max(100).optional().nullable(),
  issueDate: z.coerce.date(),
  expirationDate: z.coerce.date().optional().nullable(),
  status: CredentialStatusEnum.default('ACTIVE'),
  verificationNotes: z.string().max(1000).optional().nullable(),
  documentUrl: z.string().url().optional().nullable(),
});

export const updateCredentialSchema = createCredentialSchema.partial().extend({
  id: z.string(),
});

// =============================================================================
// Certification Schemas
// =============================================================================

export const createCertificationSchema = z.object({
  staffProfileId: z.string(),
  type: CertificationTypeEnum,
  name: z.string().min(1, 'Certification name is required').max(200),
  issuingOrganization: z.string().min(1, 'Issuing organization is required').max(200),
  issueDate: z.coerce.date(),
  expirationDate: z.coerce.date().optional().nullable(),
  status: CertificationStatusEnum.default('ACTIVE'),
  level: z.string().max(50).optional().nullable(),
  score: z.string().max(50).optional().nullable(),
  certificateUrl: z.string().url().optional().nullable(),
});

export const updateCertificationSchema = createCertificationSchema.partial().extend({
  id: z.string(),
});

// =============================================================================
// Emergency Contact Schemas
// =============================================================================

export const createEmergencyContactSchema = z.object({
  staffProfileId: z.string(),
  name: z.string().min(1, 'Contact name is required').max(200),
  relationship: z.string().min(1, 'Relationship is required').max(100),
  phone: z.string().min(10, 'Phone number is required'),
  alternatePhone: phoneSchema,
  email: z.string().email().optional().nullable(),
  isPrimary: z.boolean().default(false),
});

export const updateEmergencyContactSchema = createEmergencyContactSchema.partial().extend({
  id: z.string(),
});

// =============================================================================
// Employment Record Schemas
// =============================================================================

export const createEmploymentRecordSchema = z.object({
  staffProfileId: z.string(),
  recordType: EmploymentRecordTypeEnum,
  effectiveDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),

  // Position changes
  previousTitle: z.string().max(100).optional().nullable(),
  newTitle: z.string().max(100).optional().nullable(),
  previousDepartment: z.string().max(100).optional().nullable(),
  newDepartment: z.string().max(100).optional().nullable(),
  previousEmploymentType: EmploymentTypeEnum.optional().nullable(),
  newEmploymentType: EmploymentTypeEnum.optional().nullable(),
  previousStatus: StaffStatusEnum.optional().nullable(),
  newStatus: StaffStatusEnum.optional().nullable(),

  // Additional details
  reason: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  approvedBy: z.string().optional().nullable(),
});

export const updateEmploymentRecordSchema = createEmploymentRecordSchema.partial().extend({
  id: z.string(),
});

// =============================================================================
// Staff Document Schemas
// =============================================================================

export const createStaffDocumentSchema = z.object({
  staffProfileId: z.string(),
  name: z.string().min(1, 'Document name is required').max(200),
  description: z.string().max(500).optional().nullable(),
  category: DocumentCategoryEnum,
  fileUrl: z.string().min(1, 'File URL is required'),
  fileName: z.string().min(1, 'File name is required').max(255),
  fileSize: z.number().int().positive().optional().nullable(),
  mimeType: z.string().max(100).optional().nullable(),
  accessLevel: DocumentAccessLevelEnum.default('HR_ONLY'),
});

export const updateStaffDocumentSchema = createStaffDocumentSchema.partial().extend({
  id: z.string(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CreateStaffProfileInput = z.infer<typeof createStaffProfileSchema>;
export type UpdateStaffProfileInput = z.infer<typeof updateStaffProfileSchema>;
export type StaffProfileQuery = z.infer<typeof staffProfileQuerySchema>;
export type CreateCredentialInput = z.infer<typeof createCredentialSchema>;
export type UpdateCredentialInput = z.infer<typeof updateCredentialSchema>;
export type CreateCertificationInput = z.infer<typeof createCertificationSchema>;
export type UpdateCertificationInput = z.infer<typeof updateCertificationSchema>;
export type CreateEmergencyContactInput = z.infer<typeof createEmergencyContactSchema>;
export type UpdateEmergencyContactInput = z.infer<typeof updateEmergencyContactSchema>;
export type CreateEmploymentRecordInput = z.infer<typeof createEmploymentRecordSchema>;
export type UpdateEmploymentRecordInput = z.infer<typeof updateEmploymentRecordSchema>;
export type CreateStaffDocumentInput = z.infer<typeof createStaffDocumentSchema>;
export type UpdateStaffDocumentInput = z.infer<typeof updateStaffDocumentSchema>;
