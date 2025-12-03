import { z } from 'zod';

// =============================================================================
// Emergency & Reminders Enums (matching Prisma schema)
// =============================================================================

export const EmergencyTypeEnum = z.enum([
  'BROKEN_BRACKET',
  'POKING_WIRE',
  'BROKEN_WIRE',
  'LOST_RETAINER',
  'LOOSE_BAND',
  'LOOSE_BRACKET',
  'APPLIANCE_IRRITATION',
  'TRAUMA_INJURY',
  'SEVERE_PAIN',
  'SWELLING_INFECTION',
  'LOST_ALIGNER',
  'BROKEN_RETAINER',
  'BROKEN_APPLIANCE',
  'OTHER',
]);

export const EmergencySeverityEnum = z.enum([
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]);

export const TriageStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'REFERRED',
]);

export const RequestChannelEnum = z.enum([
  'PHONE',
  'SMS',
  'WEB_FORM',
  'PATIENT_PORTAL',
  'WALK_IN',
  'AFTER_HOURS',
  'EMAIL',
]);

export const EmergencyResolutionEnum = z.enum([
  'APPOINTMENT_SCHEDULED',
  'SELF_CARE_RESOLVED',
  'REFERRED_GENERAL_DENTIST',
  'REFERRED_ER',
  'NO_ACTION_NEEDED',
  'PATIENT_NO_SHOW',
  'PATIENT_DECLINED',
]);

export const OnCallTypeEnum = z.enum([
  'PRIMARY',
  'BACKUP',
  'HOLIDAY',
  'SPECIAL',
]);

export const OnCallStatusEnum = z.enum([
  'SCHEDULED',
  'ACTIVE',
  'COMPLETED',
  'SWAPPED',
  'CANCELLED',
]);

export const SwapRequestStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'DECLINED',
  'CANCELLED',
]);

export const ReminderChannelEnum = z.enum([
  'SMS',
  'EMAIL',
  'VOICE',
  'PUSH',
]);

export const ReminderTypeEnum = z.enum([
  'STANDARD',
  'CONFIRMATION',
  'FINAL',
  'PRE_VISIT',
  'FIRST_VISIT',
  'FOLLOW_UP',
]);

export const ReminderStatusEnum = z.enum([
  'SCHEDULED',
  'SENDING',
  'SENT',
  'DELIVERED',
  'FAILED',
  'CANCELLED',
  'SKIPPED',
]);

export const ConfirmationResponseEnum = z.enum([
  'CONFIRMED',
  'DECLINED',
  'RESCHEDULE_REQUESTED',
  'NO_RESPONSE',
]);

export const AfterHoursMessageTypeEnum = z.enum([
  'EMERGENCY',
  'APPOINTMENT_REQUEST',
  'GENERAL_QUESTION',
  'BILLING_QUESTION',
  'PRESCRIPTION_REQUEST',
  'OTHER',
]);

export const AfterHoursUrgencyEnum = z.enum([
  'ROUTINE',
  'URGENT',
  'EMERGENCY',
]);

export const AfterHoursRoutingEnum = z.enum([
  'VOICEMAIL',
  'ON_CALL_PROVIDER',
  'ANSWERING_SERVICE',
  'AUTO_RESPONSE',
  'EMERGENCY_LINE',
]);

export const AfterHoursStatusEnum = z.enum([
  'PENDING',
  'ACKNOWLEDGED',
  'IN_PROGRESS',
  'RESOLVED',
  'CALLBACK_SCHEDULED',
  'NO_ACTION_NEEDED',
]);

export const FAQCategoryEnum = z.enum([
  'PREVENTION',
  'SELF_CARE',
  'WHEN_TO_CALL',
  'GENERAL',
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
// Emergency Appointment Schemas
// =============================================================================

export const createEmergencySchema = z.object({
  // Patient info
  patientId: z.string().optional().nullable(),
  patientName: z.string().min(1, 'Patient name is required'),
  patientPhone: z.string().min(1, 'Phone number is required'),
  patientEmail: z.string().email().optional().nullable(),

  // Emergency details
  emergencyType: EmergencyTypeEnum,
  severity: EmergencySeverityEnum.optional().default('MEDIUM'),
  description: z.string().min(1, 'Description is required'),
  symptoms: z.array(z.string()).optional().default([]),
  onsetTime: z.coerce.date().optional().nullable(),

  // Request channel
  requestChannel: RequestChannelEnum.optional().default('PHONE'),
  isAfterHours: z.boolean().optional().default(false),
});

export const updateEmergencySchema = z.object({
  patientId: z.string().optional().nullable(),
  severity: EmergencySeverityEnum.optional(),
  description: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  triageStatus: TriageStatusEnum.optional(),
  triageNotes: z.string().max(1000).optional().nullable(),
  selfCareInstructions: z.string().max(2000).optional().nullable(),
});

export const triageEmergencySchema = z.object({
  triageStatus: TriageStatusEnum,
  triageNotes: z.string().max(1000).optional().nullable(),
  severity: EmergencySeverityEnum.optional(),
  selfCareInstructions: z.string().max(2000).optional().nullable(),
});

export const resolveEmergencySchema = z.object({
  resolution: EmergencyResolutionEnum,
  resolutionNotes: z.string().max(1000).optional().nullable(),
  appointmentId: z.string().optional().nullable(),
  scheduledFor: z.coerce.date().optional().nullable(),
});

export const emergencyQuerySchema = z.object({
  // Filters
  patientId: z.string().optional(),
  emergencyType: optionalEnumWithAll(EmergencyTypeEnum),
  severity: optionalEnumWithAll(EmergencySeverityEnum),
  triageStatus: optionalEnumWithAll(TriageStatusEnum),
  requestChannel: optionalEnumWithAll(RequestChannelEnum),
  resolution: optionalEnumWithAll(EmergencyResolutionEnum),
  isAfterHours: z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),

  // Date filters
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),

  // Pagination
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),

  // Sorting
  sortBy: z.enum(['requestedAt', 'severity', 'triageStatus']).optional().default('requestedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// =============================================================================
// On-Call Schemas
// =============================================================================

export const createOnCallSchema = z.object({
  providerId: z.string().min(1, 'Provider is required'),
  providerName: z.string().min(1, 'Provider name is required'),

  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format'),

  type: OnCallTypeEnum.optional().default('PRIMARY'),
  backupProviderId: z.string().optional().nullable(),
  backupProviderName: z.string().optional().nullable(),

  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),

  isHoliday: z.boolean().optional().default(false),
  holidayName: z.string().optional().nullable(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: 'End date must be on or after start date', path: ['endDate'] }
);

export const updateOnCallSchema = z.object({
  providerId: z.string().optional(),
  providerName: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  type: OnCallTypeEnum.optional(),
  status: OnCallStatusEnum.optional(),
  backupProviderId: z.string().optional().nullable(),
  backupProviderName: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  isHoliday: z.boolean().optional(),
  holidayName: z.string().optional().nullable(),
});

export const onCallQuerySchema = z.object({
  providerId: z.string().optional(),
  type: optionalEnumWithAll(OnCallTypeEnum),
  status: optionalEnumWithAll(OnCallStatusEnum),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),

  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),

  sortBy: z.enum(['startDate', 'providerName', 'type']).optional().default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export const swapRequestSchema = z.object({
  targetProviderId: z.string().min(1, 'Target provider is required'),
  targetOnCallId: z.string().optional().nullable(),
  reason: z.string().min(1, 'Reason is required').max(500),
});

export const processSwapRequestSchema = z.object({
  action: z.enum(['approve', 'decline']),
  declineReason: z.string().max(500).optional().nullable(),
});

// =============================================================================
// Reminder Template Schemas
// =============================================================================

export const createReminderTemplateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  channel: ReminderChannelEnum,
  type: ReminderTypeEnum,

  subject: z.string().max(200).optional().nullable(),
  body: z.string().min(1, 'Body is required').max(2000),

  includeCalendarLink: z.boolean().optional().default(false),
  includeDirections: z.boolean().optional().default(false),
  includeConfirmLink: z.boolean().optional().default(false),
  includeCancelLink: z.boolean().optional().default(false),

  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
});

export const updateReminderTemplateSchema = createReminderTemplateSchema.partial();

export const reminderTemplateQuerySchema = z.object({
  channel: optionalEnumWithAll(ReminderChannelEnum),
  type: optionalEnumWithAll(ReminderTypeEnum),
  isActive: z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),

  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(50),
});

// =============================================================================
// Reminder Sequence Schemas
// =============================================================================

export const reminderSequenceStepSchema = z.object({
  stepOrder: z.number().int().positive(),
  offsetDays: z.number().int(),
  offsetHours: z.number().int().optional().default(0),
  sendTime: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  channel: ReminderChannelEnum,
  reminderType: ReminderTypeEnum,
  templateId: z.string().optional().nullable(),
  skipIfConfirmed: z.boolean().optional().default(true),
  skipIfCancelled: z.boolean().optional().default(true),
  skipIfPreviousFailed: z.boolean().optional().default(false),
});

export const createReminderSequenceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  appointmentTypeId: z.string().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
  steps: z.array(reminderSequenceStepSchema).min(1, 'At least one step is required'),
});

export const updateReminderSequenceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  appointmentTypeId: z.string().optional().nullable(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  steps: z.array(reminderSequenceStepSchema).optional(),
});

// =============================================================================
// Appointment Reminder Schemas
// =============================================================================

export const sendReminderSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment is required'),
  channel: ReminderChannelEnum,
  reminderType: ReminderTypeEnum.optional().default('STANDARD'),
  templateId: z.string().optional().nullable(),
});

export const reminderQuerySchema = z.object({
  appointmentId: z.string().optional(),
  patientId: z.string().optional(),
  channel: optionalEnumWithAll(ReminderChannelEnum),
  status: optionalEnumWithAll(ReminderStatusEnum),
  reminderType: optionalEnumWithAll(ReminderTypeEnum),

  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),

  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),

  sortBy: z.enum(['scheduledFor', 'status', 'channel']).optional().default('scheduledFor'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// =============================================================================
// After-Hours Schemas
// =============================================================================

export const createAfterHoursMessageSchema = z.object({
  callerName: z.string().min(1, 'Caller name is required'),
  callerPhone: z.string().min(1, 'Phone is required'),
  callerEmail: z.string().email().optional().nullable(),
  patientId: z.string().optional().nullable(),

  messageType: AfterHoursMessageTypeEnum,
  urgency: AfterHoursUrgencyEnum.optional().default('ROUTINE'),
  message: z.string().min(1, 'Message is required').max(2000),
  routing: AfterHoursRoutingEnum.optional().default('VOICEMAIL'),
});

export const updateAfterHoursMessageSchema = z.object({
  status: AfterHoursStatusEnum.optional(),
  resolutionNotes: z.string().max(1000).optional().nullable(),
  callbackScheduledFor: z.coerce.date().optional().nullable(),
  callbackNotes: z.string().max(500).optional().nullable(),
});

export const resolveAfterHoursMessageSchema = z.object({
  resolutionNotes: z.string().max(1000).optional().nullable(),
  appointmentId: z.string().optional().nullable(),
  emergencyAppointmentId: z.string().optional().nullable(),
});

export const afterHoursQuerySchema = z.object({
  patientId: z.string().optional(),
  messageType: optionalEnumWithAll(AfterHoursMessageTypeEnum),
  urgency: optionalEnumWithAll(AfterHoursUrgencyEnum),
  status: optionalEnumWithAll(AfterHoursStatusEnum),

  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),

  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),

  sortBy: z.enum(['receivedAt', 'urgency', 'status']).optional().default('receivedAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const updateAfterHoursSettingsSchema = z.object({
  weekdayOpen: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  weekdayClose: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  saturdayOpen: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  saturdayClose: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  sundayOpen: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  sundayClose: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),

  afterHoursPhone: z.string().optional().nullable(),
  answeringServicePhone: z.string().optional().nullable(),
  emergencyLinePhone: z.string().optional().nullable(),

  smsAutoReply: z.string().max(500).optional().nullable(),
  emailAutoReply: z.string().max(2000).optional().nullable(),
  voicemailGreeting: z.string().max(500).optional().nullable(),

  emergencyKeywords: z.array(z.string()).optional(),

  urgentResponseMinutes: z.number().int().positive().optional(),
  routineResponseHours: z.number().int().positive().optional(),
});

// =============================================================================
// Emergency Protocol Schemas
// =============================================================================

export const triageQuestionSchema = z.object({
  question: z.string().min(1),
  options: z.array(z.object({
    text: z.string().min(1),
    severity: EmergencySeverityEnum,
  })),
});

export const updateEmergencyProtocolSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  typicalSeverity: EmergencySeverityEnum.optional(),
  maxWaitDays: z.number().int().positive().max(14).optional(),
  triageQuestions: z.array(triageQuestionSchema).optional().nullable(),
  selfCareInstructions: z.string().max(2000).optional().nullable(),
  whenToCall: z.string().max(1000).optional().nullable(),
  whenToSeekER: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
  isActive: z.boolean().optional(),
});

export const createEmergencyProtocolSchema = z.object({
  emergencyType: EmergencyTypeEnum,
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  typicalSeverity: EmergencySeverityEnum.optional().default('MEDIUM'),
  maxWaitDays: z.number().int().positive().max(14).optional().default(2),
  triageQuestions: z.array(triageQuestionSchema).optional().nullable(),
  selfCareInstructions: z.string().max(2000).optional().nullable(),
  whenToCall: z.string().max(1000).optional().nullable(),
  whenToSeekER: z.string().max(1000).optional().nullable(),
  imageUrl: z.string().url().optional().nullable(),
  videoUrl: z.string().url().optional().nullable(),
});

// =============================================================================
// Emergency FAQ Schemas
// =============================================================================

export const createEmergencyFAQSchema = z.object({
  question: z.string().min(1, 'Question is required').max(500),
  answer: z.string().min(1, 'Answer is required').max(2000),
  category: FAQCategoryEnum.optional().default('GENERAL'),
  emergencyType: EmergencyTypeEnum.optional().nullable(),
  displayOrder: z.number().int().min(0).optional().default(0),
  isPublished: z.boolean().optional().default(true),
});

export const updateEmergencyFAQSchema = createEmergencyFAQSchema.partial();

// =============================================================================
// Type Exports
// =============================================================================

export type CreateEmergencyInput = z.infer<typeof createEmergencySchema>;
export type UpdateEmergencyInput = z.infer<typeof updateEmergencySchema>;
export type TriageEmergencyInput = z.infer<typeof triageEmergencySchema>;
export type ResolveEmergencyInput = z.infer<typeof resolveEmergencySchema>;
export type EmergencyQuery = z.infer<typeof emergencyQuerySchema>;

export type CreateOnCallInput = z.infer<typeof createOnCallSchema>;
export type UpdateOnCallInput = z.infer<typeof updateOnCallSchema>;
export type OnCallQuery = z.infer<typeof onCallQuerySchema>;
export type SwapRequestInput = z.infer<typeof swapRequestSchema>;
export type ProcessSwapRequestInput = z.infer<typeof processSwapRequestSchema>;

export type CreateReminderTemplateInput = z.infer<typeof createReminderTemplateSchema>;
export type UpdateReminderTemplateInput = z.infer<typeof updateReminderTemplateSchema>;
export type ReminderTemplateQuery = z.infer<typeof reminderTemplateQuerySchema>;

export type ReminderSequenceStepInput = z.infer<typeof reminderSequenceStepSchema>;
export type CreateReminderSequenceInput = z.infer<typeof createReminderSequenceSchema>;
export type UpdateReminderSequenceInput = z.infer<typeof updateReminderSequenceSchema>;

export type SendReminderInput = z.infer<typeof sendReminderSchema>;
export type ReminderQuery = z.infer<typeof reminderQuerySchema>;

export type CreateAfterHoursMessageInput = z.infer<typeof createAfterHoursMessageSchema>;
export type UpdateAfterHoursMessageInput = z.infer<typeof updateAfterHoursMessageSchema>;
export type ResolveAfterHoursMessageInput = z.infer<typeof resolveAfterHoursMessageSchema>;
export type AfterHoursQuery = z.infer<typeof afterHoursQuerySchema>;
export type UpdateAfterHoursSettingsInput = z.infer<typeof updateAfterHoursSettingsSchema>;

export type UpdateEmergencyProtocolInput = z.infer<typeof updateEmergencyProtocolSchema>;
export type CreateEmergencyProtocolInput = z.infer<typeof createEmergencyProtocolSchema>;

export type CreateEmergencyFAQInput = z.infer<typeof createEmergencyFAQSchema>;
export type UpdateEmergencyFAQInput = z.infer<typeof updateEmergencyFAQSchema>;
