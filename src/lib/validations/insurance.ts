import { z } from 'zod';

// =============================================================================
// INSURANCE CLAIMS - Validation Schemas
// =============================================================================

// -----------------------------------------------------------------------------
// Enums (matching Prisma schema exactly)
// -----------------------------------------------------------------------------

export const InsuranceTypeEnum = z.enum([
  'DENTAL',
  'MEDICAL',
  'DISCOUNT_PLAN',
]);

export const OrthoPaymentTypeEnum = z.enum([
  'LUMP_SUM',       // Pays full amount at start
  'MONTHLY',        // Pays monthly during treatment
  'QUARTERLY',      // Pays quarterly
  'MILESTONE',      // Pays at treatment milestones
  'COMPLETION',     // Pays at treatment completion
]);

export const InsurancePriorityEnum = z.enum([
  'PRIMARY',
  'SECONDARY',
  'TERTIARY',
]);

export const RelationToSubscriberEnum = z.enum([
  'SELF',
  'SPOUSE',
  'CHILD',
  'OTHER',
]);

export const VerificationStatusEnum = z.enum([
  'NOT_VERIFIED',
  'VERIFIED',
  'FAILED',
  'EXPIRED',
]);

export const EligibilityStatusEnum = z.enum([
  'PENDING',
  'SUCCESS',
  'FAILED',
  'NO_RESPONSE',
]);

export const PreauthStatusEnum = z.enum([
  'DRAFT',
  'PENDING',
  'APPROVED',
  'PARTIAL',
  'DENIED',
  'EXPIRED',
]);

export const ClaimTypeEnum = z.enum([
  'ORIGINAL',
  'CORRECTED',
  'REPLACEMENT',
  'VOID',
]);

export const InsuranceClaimStatusEnum = z.enum([
  'DRAFT',
  'READY',
  'SUBMITTED',
  'ACCEPTED',
  'IN_PROCESS',
  'PAID',
  'PARTIAL',
  'DENIED',
  'APPEALED',
  'VOID',
  'CLOSED',
]);

export const SubmissionMethodEnum = z.enum([
  'ELECTRONIC',
  'PAPER',
  'PORTAL',
]);

export const ClaimItemStatusEnum = z.enum([
  'PENDING',
  'PAID',
  'DENIED',
  'ADJUSTED',
]);

export const EOBReceiptMethodEnum = z.enum([
  'ELECTRONIC',    // EDI 835
  'SCANNED',       // Paper scanned
  'MANUAL',        // Manually entered
  'PORTAL',        // Downloaded from payer portal
]);

export const EOBStatusEnum = z.enum([
  'PENDING',
  'REVIEWING',
  'PROCESSED',
  'DISCREPANCY',
  'VOID',
]);

// -----------------------------------------------------------------------------
// Insurance Company Schemas
// -----------------------------------------------------------------------------

export const createInsuranceCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required').max(200),
  payerId: z.string().min(1, 'Payer ID is required').max(50),
  type: InsuranceTypeEnum.default('DENTAL'),
  phone: z.string().max(20).optional().nullable(),
  fax: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  claimsStreet: z.string().max(200).optional().nullable(),
  claimsCity: z.string().max(100).optional().nullable(),
  claimsState: z.string().max(50).optional().nullable(),
  claimsZip: z.string().max(20).optional().nullable(),
  clearinghouseId: z.string().max(50).optional().nullable(),
  supportsEligibility: z.boolean().default(true),
  supportsEdi837: z.boolean().default(true),
  supportsEdi835: z.boolean().default(true),
  orthoPaymentType: OrthoPaymentTypeEnum.default('MONTHLY'),
  requiresPreauth: z.boolean().default(false),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateInsuranceCompanySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  payerId: z.string().min(1).max(50).optional(),
  type: InsuranceTypeEnum.optional(),
  phone: z.string().max(20).optional().nullable(),
  fax: z.string().max(20).optional().nullable(),
  email: z.string().email().optional().nullable(),
  website: z.string().url().optional().nullable(),
  claimsStreet: z.string().max(200).optional().nullable(),
  claimsCity: z.string().max(100).optional().nullable(),
  claimsState: z.string().max(50).optional().nullable(),
  claimsZip: z.string().max(20).optional().nullable(),
  clearinghouseId: z.string().max(50).optional().nullable(),
  supportsEligibility: z.boolean().optional(),
  supportsEdi837: z.boolean().optional(),
  supportsEdi835: z.boolean().optional(),
  orthoPaymentType: OrthoPaymentTypeEnum.optional(),
  requiresPreauth: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const insuranceCompanyQuerySchema = z.object({
  search: z.string().optional(),
  type: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    InsuranceTypeEnum.optional()
  ),
  supportsEligibility: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  requiresPreauth: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'payerId', 'createdAt', 'type']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// -----------------------------------------------------------------------------
// Patient Insurance Schemas
// -----------------------------------------------------------------------------

export const createPatientInsuranceSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  insuranceCompanyId: z.string().min(1, 'Insurance company is required'),
  priority: InsurancePriorityEnum.default('PRIMARY'),
  subscriberId: z.string().min(1, 'Subscriber ID is required').max(50),
  groupNumber: z.string().max(50).optional().nullable(),
  subscriberName: z.string().min(1, 'Subscriber name is required').max(200),
  subscriberDob: z.coerce.date(),
  relationToSubscriber: RelationToSubscriberEnum,
  effectiveDate: z.coerce.date(),
  terminationDate: z.coerce.date().optional().nullable(),
  hasOrthoBenefit: z.boolean().default(false),
  orthoLifetimeMax: z.number().min(0).optional().nullable(),
  orthoUsedAmount: z.number().min(0).default(0),
  orthoRemainingAmount: z.number().min(0).optional().nullable(),
  orthoAgeLimit: z.number().int().min(0).max(100).optional().nullable(),
  orthoWaitingPeriod: z.number().int().min(0).optional().nullable(),
  orthoCoveragePercent: z.number().min(0).max(100).optional().nullable(),
  orthoDeductible: z.number().min(0).optional().nullable(),
  orthoDeductibleMet: z.number().min(0).default(0),
  cardFrontUrl: z.string().url().optional().nullable(),
  cardBackUrl: z.string().url().optional().nullable(),
});

export const updatePatientInsuranceSchema = z.object({
  insuranceCompanyId: z.string().optional(),
  priority: InsurancePriorityEnum.optional(),
  subscriberId: z.string().max(50).optional(),
  groupNumber: z.string().max(50).optional().nullable(),
  subscriberName: z.string().max(200).optional(),
  subscriberDob: z.coerce.date().optional(),
  relationToSubscriber: RelationToSubscriberEnum.optional(),
  effectiveDate: z.coerce.date().optional(),
  terminationDate: z.coerce.date().optional().nullable(),
  verificationStatus: VerificationStatusEnum.optional(),
  lastVerified: z.coerce.date().optional().nullable(),
  hasOrthoBenefit: z.boolean().optional(),
  orthoLifetimeMax: z.number().min(0).optional().nullable(),
  orthoUsedAmount: z.number().min(0).optional(),
  orthoRemainingAmount: z.number().min(0).optional().nullable(),
  orthoAgeLimit: z.number().int().min(0).max(100).optional().nullable(),
  orthoWaitingPeriod: z.number().int().min(0).optional().nullable(),
  orthoCoveragePercent: z.number().min(0).max(100).optional().nullable(),
  orthoDeductible: z.number().min(0).optional().nullable(),
  orthoDeductibleMet: z.number().min(0).optional(),
  cardFrontUrl: z.string().url().optional().nullable(),
  cardBackUrl: z.string().url().optional().nullable(),
});

export const patientInsuranceQuerySchema = z.object({
  patientId: z.string().optional(),
  insuranceCompanyId: z.string().optional(),
  priority: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    InsurancePriorityEnum.optional()
  ),
  verificationStatus: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    VerificationStatusEnum.optional()
  ),
  hasOrthoBenefit: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  active: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'priority', 'effectiveDate', 'subscriberId']).default('priority'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// -----------------------------------------------------------------------------
// Eligibility Check Schemas
// -----------------------------------------------------------------------------

export const checkEligibilitySchema = z.object({
  patientInsuranceId: z.string().min(1, 'Patient insurance is required'),
  serviceDate: z.coerce.date().optional(),
});

export const batchEligibilitySchema = z.object({
  patientInsuranceIds: z.array(z.string()).min(1, 'At least one insurance is required'),
  serviceDate: z.coerce.date().optional(),
});

export const eligibilityCheckQuerySchema = z.object({
  patientInsuranceId: z.string().optional(),
  patientId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    EligibilityStatusEnum.optional()
  ),
  isEligible: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['checkDate', 'serviceDate', 'status']).default('checkDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// -----------------------------------------------------------------------------
// Preauthorization Schemas
// -----------------------------------------------------------------------------

export const createPreauthorizationSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  patientInsuranceId: z.string().min(1, 'Patient insurance is required'),
  treatmentPlanId: z.string().optional().nullable(),
  procedureCodes: z.array(z.string()).min(1, 'At least one procedure code is required'),
  requestedAmount: z.number().min(0, 'Requested amount must be positive'),
  attachments: z.array(z.string().url()).optional(),
  status: PreauthStatusEnum.default('DRAFT'),
});

export const updatePreauthorizationSchema = z.object({
  authNumber: z.string().max(50).optional().nullable(),
  status: PreauthStatusEnum.optional(),
  responseDate: z.coerce.date().optional().nullable(),
  expirationDate: z.coerce.date().optional().nullable(),
  approvedAmount: z.number().min(0).optional().nullable(),
  denialReason: z.string().max(1000).optional().nullable(),
  attachments: z.array(z.string().url()).optional(),
});

export const preauthorizationQuerySchema = z.object({
  patientId: z.string().optional(),
  patientInsuranceId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    PreauthStatusEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  expiringSoon: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['requestDate', 'status', 'expirationDate', 'requestedAmount']).default('requestDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// -----------------------------------------------------------------------------
// Insurance Claim Schemas
// -----------------------------------------------------------------------------

export const claimItemSchema = z.object({
  lineNumber: z.number().int().min(1),
  procedureCode: z.string().min(1, 'Procedure code is required').max(20),
  procedureCodeModifier: z.string().max(10).optional().nullable(),
  description: z.string().min(1, 'Description is required').max(500),
  serviceDate: z.coerce.date(),
  quantity: z.number().int().min(1).default(1),
  toothNumbers: z.array(z.string()).optional(),
  billedAmount: z.number().min(0),
  procedureId: z.string().optional().nullable(),
});

export const createInsuranceClaimSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  patientInsuranceId: z.string().min(1, 'Patient insurance is required'),
  insuranceCompanyId: z.string().min(1, 'Insurance company is required'),
  claimType: ClaimTypeEnum.default('ORIGINAL'),
  serviceDate: z.coerce.date(),
  filingDate: z.coerce.date().optional().nullable(),
  originalClaimId: z.string().optional().nullable(),
  preauthNumber: z.string().max(50).optional().nullable(),
  renderingProviderId: z.string().optional().nullable(),
  npi: z.string().max(20).optional().nullable(),
  items: z.array(claimItemSchema).min(1, 'At least one item is required'),
  status: InsuranceClaimStatusEnum.default('DRAFT'),
});

export const updateInsuranceClaimSchema = z.object({
  claimType: ClaimTypeEnum.optional(),
  serviceDate: z.coerce.date().optional(),
  filingDate: z.coerce.date().optional().nullable(),
  status: InsuranceClaimStatusEnum.optional(),
  billedAmount: z.number().min(0).optional(),
  allowedAmount: z.number().min(0).optional().nullable(),
  paidAmount: z.number().min(0).optional().nullable(),
  patientResponsibility: z.number().min(0).optional().nullable(),
  adjustmentAmount: z.number().optional().nullable(),
  preauthNumber: z.string().max(50).optional().nullable(),
  renderingProviderId: z.string().optional().nullable(),
  npi: z.string().max(20).optional().nullable(),
  internalClaimId: z.string().max(100).optional().nullable(),
  payerClaimId: z.string().max(100).optional().nullable(),
});

export const submitClaimSchema = z.object({
  submissionMethod: SubmissionMethodEnum.default('ELECTRONIC'),
});

export const insuranceClaimQuerySchema = z.object({
  search: z.string().optional(),
  patientId: z.string().optional(),
  patientInsuranceId: z.string().optional(),
  insuranceCompanyId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    InsuranceClaimStatusEnum.optional()
  ),
  claimType: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    ClaimTypeEnum.optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  deniedOnly: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  pendingOnly: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['claimNumber', 'serviceDate', 'filingDate', 'billedAmount', 'status', 'createdAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const appealClaimSchema = z.object({
  appealReason: z.string().min(1, 'Appeal reason is required').max(2000),
  attachments: z.array(z.string().url()).optional(),
});

export const resubmitClaimSchema = z.object({
  correctionNotes: z.string().max(2000).optional(),
  items: z.array(claimItemSchema).optional(),
});

// -----------------------------------------------------------------------------
// EOB Schemas
// -----------------------------------------------------------------------------

export const createEOBSchema = z.object({
  claimId: z.string().optional().nullable(),
  eobNumber: z.string().max(100).optional().nullable(),
  checkNumber: z.string().max(50).optional().nullable(),
  eftNumber: z.string().max(50).optional().nullable(),
  receivedDate: z.coerce.date(),
  receiptMethod: EOBReceiptMethodEnum,
  documentUrl: z.string().url().optional().nullable(),
  rawData: z.record(z.string(), z.unknown()).optional().nullable(),
  totalPaid: z.number().min(0),
  totalAdjusted: z.number().min(0).default(0),
  patientResponsibility: z.number().min(0).default(0),
});

export const updateEOBSchema = z.object({
  claimId: z.string().optional().nullable(),
  eobNumber: z.string().max(100).optional().nullable(),
  checkNumber: z.string().max(50).optional().nullable(),
  eftNumber: z.string().max(50).optional().nullable(),
  receivedDate: z.coerce.date().optional(),
  status: EOBStatusEnum.optional(),
  documentUrl: z.string().url().optional().nullable(),
  totalPaid: z.number().min(0).optional(),
  totalAdjusted: z.number().min(0).optional(),
  patientResponsibility: z.number().min(0).optional(),
  extractedData: z.record(z.string(), z.unknown()).optional().nullable(),
  needsReview: z.boolean().optional(),
});

export const eobQuerySchema = z.object({
  claimId: z.string().optional(),
  status: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    EOBStatusEnum.optional()
  ),
  receiptMethod: z.preprocess(
    (val) => (val === '' || val === 'all' ? undefined : val),
    EOBReceiptMethodEnum.optional()
  ),
  needsReview: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['receivedDate', 'totalPaid', 'status', 'createdAt']).default('receivedDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const processEOBSchema = z.object({
  claimId: z.string().min(1, 'Claim is required'),
  totalPaid: z.number().min(0),
  totalAdjusted: z.number().min(0).default(0),
  patientResponsibility: z.number().min(0).default(0),
  lineItems: z.array(z.object({
    claimItemId: z.string(),
    paidAmount: z.number().min(0),
    adjustmentAmount: z.number().default(0),
    denialCode: z.string().optional().nullable(),
    denialReason: z.string().optional().nullable(),
  })).optional(),
});

export const postEOBPaymentSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  paymentDate: z.coerce.date(),
  adjustmentReason: z.string().max(500).optional().nullable(),
});

// -----------------------------------------------------------------------------
// Insurance Payment Schemas
// -----------------------------------------------------------------------------

export const createInsurancePaymentSchema = z.object({
  eobId: z.string().min(1, 'EOB is required'),
  claimId: z.string().min(1, 'Claim is required'),
  accountId: z.string().min(1, 'Account is required'),
  paymentDate: z.coerce.date(),
  amount: z.number().min(0),
  adjustmentAmount: z.number().default(0),
  adjustmentReason: z.string().max(500).optional().nullable(),
});

export const insurancePaymentQuerySchema = z.object({
  eobId: z.string().optional(),
  claimId: z.string().optional(),
  accountId: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  posted: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['paymentDate', 'amount', 'createdAt']).default('paymentDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// -----------------------------------------------------------------------------
// Denial Management Schemas
// -----------------------------------------------------------------------------

export const denialQuerySchema = z.object({
  search: z.string().optional(),
  patientId: z.string().optional(),
  insuranceCompanyId: z.string().optional(),
  denialCode: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  appealDeadlineApproaching: z.preprocess(
    (val) => (val === '' ? undefined : val === 'true'),
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['deniedAt', 'appealDeadline', 'billedAmount']).default('deniedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// -----------------------------------------------------------------------------
// Claims Aging/Analytics Schemas
// -----------------------------------------------------------------------------

export const claimsAgingQuerySchema = z.object({
  insuranceCompanyId: z.string().optional(),
  asOfDate: z.coerce.date().optional(),
  groupBy: z.enum(['company', 'status', 'provider']).default('company'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});

export const claimsAnalyticsQuerySchema = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  insuranceCompanyId: z.string().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('month'),
});

// -----------------------------------------------------------------------------
// Type Exports
// -----------------------------------------------------------------------------

export type CreateInsuranceCompanyInput = z.infer<typeof createInsuranceCompanySchema>;
export type UpdateInsuranceCompanyInput = z.infer<typeof updateInsuranceCompanySchema>;
export type InsuranceCompanyQuery = z.infer<typeof insuranceCompanyQuerySchema>;

export type CreatePatientInsuranceInput = z.infer<typeof createPatientInsuranceSchema>;
export type UpdatePatientInsuranceInput = z.infer<typeof updatePatientInsuranceSchema>;
export type PatientInsuranceQuery = z.infer<typeof patientInsuranceQuerySchema>;

export type CheckEligibilityInput = z.infer<typeof checkEligibilitySchema>;
export type BatchEligibilityInput = z.infer<typeof batchEligibilitySchema>;
export type EligibilityCheckQuery = z.infer<typeof eligibilityCheckQuerySchema>;

export type CreatePreauthorizationInput = z.infer<typeof createPreauthorizationSchema>;
export type UpdatePreauthorizationInput = z.infer<typeof updatePreauthorizationSchema>;
export type PreauthorizationQuery = z.infer<typeof preauthorizationQuerySchema>;

export type ClaimItemInput = z.infer<typeof claimItemSchema>;
export type CreateInsuranceClaimInput = z.infer<typeof createInsuranceClaimSchema>;
export type UpdateInsuranceClaimInput = z.infer<typeof updateInsuranceClaimSchema>;
export type InsuranceClaimQuery = z.infer<typeof insuranceClaimQuerySchema>;

export type CreateEOBInput = z.infer<typeof createEOBSchema>;
export type UpdateEOBInput = z.infer<typeof updateEOBSchema>;
export type EOBQuery = z.infer<typeof eobQuerySchema>;
export type ProcessEOBInput = z.infer<typeof processEOBSchema>;
export type PostEOBPaymentInput = z.infer<typeof postEOBPaymentSchema>;

export type CreateInsurancePaymentInput = z.infer<typeof createInsurancePaymentSchema>;
export type InsurancePaymentQuery = z.infer<typeof insurancePaymentQuerySchema>;

export type DenialQuery = z.infer<typeof denialQuerySchema>;
export type ClaimsAgingQuery = z.infer<typeof claimsAgingQuerySchema>;
export type ClaimsAnalyticsQuery = z.infer<typeof claimsAnalyticsQuerySchema>;
