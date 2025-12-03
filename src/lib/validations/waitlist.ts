import { z } from 'zod';

// =============================================================================
// Waitlist Enums (matching Prisma schema)
// =============================================================================

export const WaitlistPriorityEnum = z.enum([
  'URGENT',
  'HIGH',
  'STANDARD',
  'FLEXIBLE',
]);

export const WaitlistStatusEnum = z.enum([
  'ACTIVE',
  'NOTIFIED',
  'BOOKED',
  'EXPIRED',
  'REMOVED',
  'DECLINED',
]);

export const WaitlistResolutionEnum = z.enum([
  'BOOKED',
  'EXPIRED',
  'PATIENT_REMOVED',
  'STAFF_REMOVED',
  'DECLINED_ALL_OFFERS',
]);

export const CancellationTypeEnum = z.enum([
  'CANCELLED',
  'LATE_CANCEL',
  'NO_SHOW',
  'PRACTICE_CANCEL',
]);

export const CancelledByTypeEnum = z.enum([
  'PATIENT',
  'STAFF',
  'SYSTEM',
  'PROVIDER',
]);

export const CancellationReasonEnum = z.enum([
  'SCHEDULE_CONFLICT',
  'ILLNESS',
  'TRANSPORTATION',
  'FORGOT',
  'FINANCIAL',
  'WEATHER',
  'FAMILY_EMERGENCY',
  'CHANGED_PROVIDERS',
  'PRACTICE_CLOSURE',
  'PROVIDER_UNAVAILABLE',
  'OTHER',
]);

export const RecoveryStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'RECOVERED',
  'LOST',
  'NOT_NEEDED',
]);

export const RiskLevelEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

export const RiskStatusEnum = z.enum([
  'ACTIVE',
  'REVIEWED',
  'RESOLVED',
  'DROPPED_OUT',
]);

export const InterventionStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'SUCCESSFUL',
  'UNSUCCESSFUL',
]);

// =============================================================================
// Helper Functions
// =============================================================================

const optionalEnumWithAll = <T extends z.ZodTypeAny>(enumSchema: T) =>
  z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    return val;
  }, enumSchema.optional());

// =============================================================================
// Waitlist Entry Schemas
// =============================================================================

export const createWaitlistEntrySchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  appointmentTypeId: z.string().min(1, 'Appointment type is required'),
  priority: WaitlistPriorityEnum.optional().default('STANDARD'),

  // Preferences
  preferredProviderId: z.string().optional().nullable(),
  dateRangeStart: z.coerce.date().optional().nullable(),
  dateRangeEnd: z.coerce.date().optional().nullable(),
  preferredTimes: z.array(z.string()).optional().default([]),
  preferredDays: z.array(z.number().int().min(0).max(6)).optional().default([]),

  // Notes
  notes: z.string().max(1000).optional().nullable(),
  reasonForWaitlist: z.string().max(500).optional().nullable(),

  // Expiration
  expiresAt: z.coerce.date().optional().nullable(),
}).refine(
  (data) => {
    if (data.dateRangeStart && data.dateRangeEnd) {
      return data.dateRangeEnd >= data.dateRangeStart;
    }
    return true;
  },
  { message: 'End date must be on or after start date', path: ['dateRangeEnd'] }
);

export const updateWaitlistEntrySchema = z.object({
  priority: WaitlistPriorityEnum.optional(),
  status: WaitlistStatusEnum.optional(),

  // Preferences
  preferredProviderId: z.string().optional().nullable(),
  dateRangeStart: z.coerce.date().optional().nullable(),
  dateRangeEnd: z.coerce.date().optional().nullable(),
  preferredTimes: z.array(z.string()).optional(),
  preferredDays: z.array(z.number().int().min(0).max(6)).optional(),

  // Notes
  notes: z.string().max(1000).optional().nullable(),
  reasonForWaitlist: z.string().max(500).optional().nullable(),

  // Expiration
  expiresAt: z.coerce.date().optional().nullable(),
});

export const waitlistQuerySchema = z.object({
  // Filters
  patientId: z.string().optional(),
  appointmentTypeId: z.string().optional(),
  preferredProviderId: z.string().optional(),
  status: optionalEnumWithAll(WaitlistStatusEnum),
  priority: optionalEnumWithAll(WaitlistPriorityEnum),

  // Date filters
  dateRangeStart: z.coerce.date().optional(),
  dateRangeEnd: z.coerce.date().optional(),

  // Pagination
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),

  // Sorting
  sortBy: z.enum(['addedAt', 'priority', 'expiresAt', 'patientName']).optional().default('addedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const resolveWaitlistEntrySchema = z.object({
  resolution: WaitlistResolutionEnum,
  bookedAppointmentId: z.string().optional().nullable(),
});

// =============================================================================
// Cancellation Schemas
// =============================================================================

export const createCancellationSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment is required'),
  reason: CancellationReasonEnum,
  reasonDetails: z.string().max(500).optional().nullable(),
  cancelledByType: CancelledByTypeEnum.optional().default('STAFF'),
});

export const updateCancellationSchema = z.object({
  reason: CancellationReasonEnum.optional(),
  reasonDetails: z.string().max(500).optional().nullable(),
  recoveryStatus: RecoveryStatusEnum.optional(),
  recoveryNotes: z.string().max(500).optional().nullable(),

  // Fee handling
  lateCancelFee: z.number().min(0).optional().nullable(),
  feeWaived: z.boolean().optional(),
  feeWaivedReason: z.string().max(200).optional().nullable(),
});

export const cancellationQuerySchema = z.object({
  // Filters
  patientId: z.string().optional(),
  appointmentTypeId: z.string().optional(),
  providerId: z.string().optional(),
  cancellationType: optionalEnumWithAll(CancellationTypeEnum),
  reason: optionalEnumWithAll(CancellationReasonEnum),
  recoveryStatus: optionalEnumWithAll(RecoveryStatusEnum),
  isLateCancel: z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),

  // Date range
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),

  // Pagination
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),

  // Sorting
  sortBy: z.enum(['cancelledAt', 'noticeHours', 'reason']).optional().default('cancelledAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const logRecoveryAttemptSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
  result: z.enum(['RESCHEDULED', 'NO_RESPONSE', 'DECLINED', 'PENDING']),
  rescheduledAppointmentId: z.string().optional().nullable(),
});

// =============================================================================
// At-Risk Patient Schemas
// =============================================================================

export const riskScoreQuerySchema = z.object({
  // Filters
  riskLevel: optionalEnumWithAll(RiskLevelEnum),
  status: optionalEnumWithAll(RiskStatusEnum),
  interventionStatus: optionalEnumWithAll(InterventionStatusEnum),

  // Threshold filters
  minRiskScore: z.coerce.number().min(0).max(100).optional(),
  maxRiskScore: z.coerce.number().min(0).max(100).optional(),

  // Pagination
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),

  // Sorting
  sortBy: z.enum(['riskScore', 'calculatedAt', 'noShowCount']).optional().default('riskScore'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const reviewRiskScoreSchema = z.object({
  reviewNotes: z.string().max(1000).optional().nullable(),
  status: RiskStatusEnum.optional(),
});

export const logInterventionSchema = z.object({
  interventionStatus: InterventionStatusEnum,
  interventionNotes: z.string().max(1000).optional().nullable(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CreateWaitlistEntryInput = z.infer<typeof createWaitlistEntrySchema>;
export type UpdateWaitlistEntryInput = z.infer<typeof updateWaitlistEntrySchema>;
export type WaitlistQuery = z.infer<typeof waitlistQuerySchema>;
export type ResolveWaitlistEntryInput = z.infer<typeof resolveWaitlistEntrySchema>;

export type CreateCancellationInput = z.infer<typeof createCancellationSchema>;
export type UpdateCancellationInput = z.infer<typeof updateCancellationSchema>;
export type CancellationQuery = z.infer<typeof cancellationQuerySchema>;
export type LogRecoveryAttemptInput = z.infer<typeof logRecoveryAttemptSchema>;

export type RiskScoreQuery = z.infer<typeof riskScoreQuerySchema>;
export type ReviewRiskScoreInput = z.infer<typeof reviewRiskScoreSchema>;
export type LogInterventionInput = z.infer<typeof logInterventionSchema>;
