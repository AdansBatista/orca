import { z } from 'zod';

// =============================================================================
// Advanced Scheduling Enums (matching Prisma schema)
// =============================================================================

export const ScheduleBlockTypeEnum = z.enum([
  'VACATION',
  'SICK_LEAVE',
  'PERSONAL',
  'MEETING',
  'TRAINING',
  'CONFERENCE',
  'ADMIN_TIME',
  'LUNCH',
  'BREAK',
  'HOLIDAY',
  'MAINTENANCE',
  'OTHER',
]);

export const ScheduleBlockStatusEnum = z.enum([
  'ACTIVE',
  'PENDING_APPROVAL',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
]);

export const BookingTemplateTypeEnum = z.enum([
  'DAY',
  'WEEK',
  'HALF_DAY_AM',
  'HALF_DAY_PM',
]);

export const RecurrencePatternEnum = z.enum([
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'CUSTOM',
]);

export const RecurringStatusEnum = z.enum([
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
]);

export const OccurrenceStatusEnum = z.enum([
  'PENDING',
  'SCHEDULED',
  'MODIFIED',
  'SKIPPED',
  'CANCELLED',
]);

// =============================================================================
// Helper Schemas
// =============================================================================

// Time format validation (HH:mm)
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Must be in HH:mm format');

// Day of week validation (0-6, Sunday-Saturday)
const dayOfWeekSchema = z.number().int().min(0).max(6);

// Helper to handle "all" or empty string as undefined for optional enum fields
const optionalEnumWithAll = <T extends z.ZodTypeAny>(enumSchema: T) =>
  z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    return val;
  }, enumSchema.optional());

// =============================================================================
// Provider Schedule Schemas
// =============================================================================

// Break period schema
const scheduleBreakSchema = z.object({
  startTime: timeSchema,
  endTime: timeSchema,
  label: z.string().max(50).optional(),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: 'Break end time must be after start time' }
);

export const createProviderScheduleSchema = z.object({
  providerId: z.string().min(1, 'Provider is required'),
  dayOfWeek: dayOfWeekSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  isWorkingDay: z.boolean().optional().default(true),
  breaks: z.array(scheduleBreakSchema).optional().nullable(),
  lunchStartTime: timeSchema.optional().nullable(),
  lunchEndTime: timeSchema.optional().nullable(),
  autoBlockLunch: z.boolean().optional().default(true),
  effectiveFrom: z.coerce.date().optional().nullable(),
  effectiveTo: z.coerce.date().optional().nullable(),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: 'End time must be after start time', path: ['endTime'] }
).refine(
  (data) => {
    if (data.lunchStartTime && data.lunchEndTime) {
      return data.lunchEndTime > data.lunchStartTime;
    }
    return true;
  },
  { message: 'Lunch end time must be after lunch start time', path: ['lunchEndTime'] }
).refine(
  (data) => {
    if (data.effectiveFrom && data.effectiveTo) {
      return data.effectiveTo >= data.effectiveFrom;
    }
    return true;
  },
  { message: 'Effective end date must be on or after start date', path: ['effectiveTo'] }
);

export const updateProviderScheduleSchema = createProviderScheduleSchema.partial().omit({ providerId: true, dayOfWeek: true });

export const bulkUpdateProviderScheduleSchema = z.object({
  providerId: z.string().min(1, 'Provider is required'),
  schedules: z.array(z.object({
    dayOfWeek: dayOfWeekSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    isWorkingDay: z.boolean(),
    breaks: z.array(scheduleBreakSchema).optional().nullable(),
    lunchStartTime: timeSchema.optional().nullable(),
    lunchEndTime: timeSchema.optional().nullable(),
    autoBlockLunch: z.boolean().optional().default(true),
  })).min(1).max(7),
  effectiveFrom: z.coerce.date().optional().nullable(),
  effectiveTo: z.coerce.date().optional().nullable(),
});

export const providerScheduleQuerySchema = z.object({
  providerId: z.string().optional(),
  providerIds: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val) {
        return val.split(',').filter(Boolean);
      }
      return val;
    },
    z.array(z.string()).optional()
  ),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  effectiveDate: z.coerce.date().optional(), // Get schedules effective on this date
  includeNonWorking: z.preprocess((val) => {
    if (val === '' || val === null) return true;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional().default(true)),
});

// =============================================================================
// Schedule Block Schemas
// =============================================================================

export const createScheduleBlockSchema = z.object({
  providerId: z.string().min(1, 'Provider is required'),
  title: z.string().min(1, 'Title is required').max(200),
  blockType: ScheduleBlockTypeEnum,
  reason: z.string().max(500).optional().nullable(),
  startDateTime: z.coerce.date(),
  endDateTime: z.coerce.date(),
  allDay: z.boolean().optional().default(false),
  isRecurring: z.boolean().optional().default(false),
  recurrenceRule: z.string().max(500).optional().nullable(), // RRULE format
  notifyPatients: z.boolean().optional().default(false),
}).refine(
  (data) => data.endDateTime > data.startDateTime,
  { message: 'End date/time must be after start date/time', path: ['endDateTime'] }
).refine(
  (data) => {
    // Block cannot start in the past (allow 1 hour buffer for quick blocks)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    return data.startDateTime >= oneHourAgo;
  },
  { message: 'Block cannot be scheduled in the past', path: ['startDateTime'] }
);

export const updateScheduleBlockSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  blockType: ScheduleBlockTypeEnum.optional(),
  reason: z.string().max(500).optional().nullable(),
  startDateTime: z.coerce.date().optional(),
  endDateTime: z.coerce.date().optional(),
  allDay: z.boolean().optional(),
  notifyPatients: z.boolean().optional(),
  status: ScheduleBlockStatusEnum.optional(),
});

export const scheduleBlockQuerySchema = z.object({
  providerId: z.string().optional(),
  providerIds: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val) {
        return val.split(',').filter(Boolean);
      }
      return val;
    },
    z.array(z.string()).optional()
  ),
  blockType: optionalEnumWithAll(ScheduleBlockTypeEnum),
  status: optionalEnumWithAll(ScheduleBlockStatusEnum),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

// =============================================================================
// Booking Template Schemas
// =============================================================================

// Schedule block schema (for visual time blocks in templates)
// This is the NEW structure for large colored time blocks
const scheduleBlockSchema = z.object({
  id: z.string().min(1), // UUID for drag operations
  dayOfWeek: dayOfWeekSchema, // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: timeSchema,
  endTime: timeSchema,

  // Multiple appointment types allowed in one block
  appointmentTypeIds: z.array(z.string()).default([]),

  // For blocked time (lunch, meetings, day off)
  isBlocked: z.boolean().default(false),
  blockReason: z.string().max(200).optional().nullable(),

  // Display customization
  label: z.string().max(100).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: 'Block end time must be after start time' }
);
// Note: We no longer require appointment types for non-blocked blocks.
// Empty blocks serve as "open" time slots that accept any appointment type.

// Legacy slot schema (for backwards compatibility during transition)
const templateSlotSchema = z.object({
  startTime: timeSchema,
  endTime: timeSchema,
  dayOfWeek: dayOfWeekSchema.optional(), // Required for WEEK templates
  appointmentTypeId: z.string().optional().nullable(),
  isBlocked: z.boolean().optional().default(false),
  blockReason: z.string().max(200).optional().nullable(),
  label: z.string().max(100).optional().nullable(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
});

// Base schema without refinement (for update operations)
const bookingTemplateBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  templateType: BookingTemplateTypeEnum,
  isActive: z.boolean().optional().default(true),
  isDefault: z.boolean().optional().default(false),
  providerId: z.string().optional().nullable(),
  // Support both new blocks and legacy slots
  blocks: z.array(scheduleBlockSchema).optional(),
  slots: z.array(templateSlotSchema).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().nullable(),
});

export const createBookingTemplateSchema = bookingTemplateBaseSchema.refine(
  (data) => {
    // Must have either blocks or slots (prefer blocks for new templates)
    const hasBlocks = data.blocks && data.blocks.length > 0;
    const hasSlots = data.slots && data.slots.length > 0;
    return hasBlocks || hasSlots;
  },
  { message: 'Template must have at least one schedule block' }
);

// For updates, use partial schema without the blocks/slots requirement
// (blocks/slots will be validated individually if provided)
export const updateBookingTemplateSchema = bookingTemplateBaseSchema.partial();

export const bookingTemplateQuerySchema = z.object({
  search: z.string().optional(),
  templateType: optionalEnumWithAll(BookingTemplateTypeEnum),
  providerId: z.string().optional(),
  isActive: z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

export const applyTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template is required'),
  // Provider is optional - if not provided, applies clinic-wide
  providerId: z.string().min(1).optional().nullable(),
  appliedDate: z.coerce.date(),
  dateRangeStart: z.coerce.date().optional().nullable(),
  dateRangeEnd: z.coerce.date().optional().nullable(),
  overrideExisting: z.boolean().optional().default(false),
}).refine(
  (data) => {
    if (data.dateRangeStart && data.dateRangeEnd) {
      return data.dateRangeEnd >= data.dateRangeStart;
    }
    return true;
  },
  { message: 'End date must be on or after start date', path: ['dateRangeEnd'] }
);

// =============================================================================
// Recurring Appointment Schemas
// =============================================================================

export const createRecurringAppointmentSchema = z.object({
  patientId: z.string().min(1, 'Patient is required'),
  appointmentTypeId: z.string().min(1, 'Appointment type is required'),
  providerId: z.string().min(1, 'Provider is required'),
  chairId: z.string().optional().nullable(),
  duration: z.number().int().positive('Duration must be positive').max(480, 'Duration cannot exceed 8 hours'),
  name: z.string().max(200).optional().nullable(),
  preferredTime: timeSchema,
  preferredDayOfWeek: dayOfWeekSchema.optional().nullable(),
  pattern: RecurrencePatternEnum,
  interval: z.number().int().positive().max(12).optional().default(1),
  daysOfWeek: z.array(dayOfWeekSchema).optional().default([]),
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  weekOfMonth: z.number().int().min(-1).max(4).optional().nullable(), // -1 for last week
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  maxOccurrences: z.number().int().positive().max(52).optional().nullable(), // Max 1 year of weekly
  notes: z.string().max(1000).optional().nullable(),
}).refine(
  (data) => {
    // For weekly pattern, daysOfWeek should have at least one day
    if (data.pattern === 'WEEKLY' && data.daysOfWeek.length === 0) {
      return false;
    }
    return true;
  },
  { message: 'Weekly pattern requires at least one day selected', path: ['daysOfWeek'] }
).refine(
  (data) => {
    // For monthly pattern, either dayOfMonth or weekOfMonth should be set
    if (data.pattern === 'MONTHLY' && !data.dayOfMonth && !data.weekOfMonth) {
      return false;
    }
    return true;
  },
  { message: 'Monthly pattern requires day of month or week of month', path: ['dayOfMonth'] }
).refine(
  (data) => {
    // Must have end condition (endDate or maxOccurrences)
    if (!data.endDate && !data.maxOccurrences) {
      return false;
    }
    return true;
  },
  { message: 'Recurring series must have an end date or max occurrences', path: ['endDate'] }
).refine(
  (data) => {
    if (data.endDate && data.endDate <= data.startDate) {
      return false;
    }
    return true;
  },
  { message: 'End date must be after start date', path: ['endDate'] }
);

export const updateRecurringAppointmentSchema = z.object({
  // Core updates
  name: z.string().max(200).optional().nullable(),
  appointmentTypeId: z.string().min(1).optional(),
  providerId: z.string().min(1).optional(),
  chairId: z.string().optional().nullable(),
  duration: z.number().int().positive().max(480).optional(),
  preferredTime: timeSchema.optional(),
  preferredDayOfWeek: dayOfWeekSchema.optional().nullable(),

  // Pattern updates
  interval: z.number().int().positive().max(12).optional(),
  daysOfWeek: z.array(dayOfWeekSchema).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional().nullable(),
  weekOfMonth: z.number().int().min(-1).max(4).optional().nullable(),

  // Bounds updates
  endDate: z.coerce.date().optional().nullable(),
  maxOccurrences: z.number().int().positive().max(52).optional().nullable(),

  // Status
  status: RecurringStatusEnum.optional(),

  // Notes
  notes: z.string().max(1000).optional().nullable(),
});

export const recurringAppointmentQuerySchema = z.object({
  patientId: z.string().optional(),
  providerId: z.string().optional(),
  appointmentTypeId: z.string().optional(),
  status: optionalEnumWithAll(RecurringStatusEnum),
  pattern: optionalEnumWithAll(RecurrencePatternEnum),
  search: z.string().optional(), // Patient name search
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(['startDate', 'createdAt', 'status']).optional().default('startDate'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// Update specific occurrence
export const updateOccurrenceSchema = z.object({
  scheduledDate: z.coerce.date().optional(),
  scheduledTime: timeSchema.optional(),
  status: OccurrenceStatusEnum.optional(),
  skippedReason: z.string().max(500).optional().nullable(),
});

// =============================================================================
// Provider Availability Query Schema
// =============================================================================

export const providerAvailabilityQuerySchema = z.object({
  providerId: z.string().min(1, 'Provider is required'),
  date: z.coerce.date(),
  duration: z.number().int().positive().max(480).optional().default(30),
  appointmentTypeId: z.string().optional(),
  chairId: z.string().optional(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type ScheduleBreak = z.infer<typeof scheduleBreakSchema>;
export type CreateProviderScheduleInput = z.infer<typeof createProviderScheduleSchema>;
export type UpdateProviderScheduleInput = z.infer<typeof updateProviderScheduleSchema>;
export type BulkUpdateProviderScheduleInput = z.infer<typeof bulkUpdateProviderScheduleSchema>;
export type ProviderScheduleQuery = z.infer<typeof providerScheduleQuerySchema>;

export type CreateScheduleBlockInput = z.infer<typeof createScheduleBlockSchema>;
export type UpdateScheduleBlockInput = z.infer<typeof updateScheduleBlockSchema>;
export type ScheduleBlockQuery = z.infer<typeof scheduleBlockQuerySchema>;

export type ScheduleBlock = z.infer<typeof scheduleBlockSchema>;
export type TemplateSlot = z.infer<typeof templateSlotSchema>;
export type CreateBookingTemplateInput = z.infer<typeof createBookingTemplateSchema>;
export type UpdateBookingTemplateInput = z.infer<typeof updateBookingTemplateSchema>;
export type BookingTemplateQuery = z.infer<typeof bookingTemplateQuerySchema>;
export type ApplyTemplateInput = z.infer<typeof applyTemplateSchema>;

export type CreateRecurringAppointmentInput = z.infer<typeof createRecurringAppointmentSchema>;
export type UpdateRecurringAppointmentInput = z.infer<typeof updateRecurringAppointmentSchema>;
export type RecurringAppointmentQuery = z.infer<typeof recurringAppointmentQuerySchema>;
export type UpdateOccurrenceInput = z.infer<typeof updateOccurrenceSchema>;

export type ProviderAvailabilityQuery = z.infer<typeof providerAvailabilityQuerySchema>;
