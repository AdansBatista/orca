import { z } from 'zod';

// =============================================================================
// Scheduling Enums (matching Prisma schema)
// =============================================================================

export const ShiftTypeEnum = z.enum([
  'REGULAR',
  'OVERTIME',
  'ON_CALL',
  'TRAINING',
  'MEETING',
  'COVERAGE',
  'FLOAT',
]);

export const ShiftStatusEnum = z.enum([
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW',
  'SWAP_PENDING',
]);

export const TimeOffTypeEnum = z.enum([
  'VACATION',
  'SICK',
  'PERSONAL',
  'BEREAVEMENT',
  'JURY_DUTY',
  'MILITARY',
  'MATERNITY',
  'PATERNITY',
  'FMLA',
  'UNPAID',
  'CONTINUING_EDUCATION',
  'HOLIDAY',
  'OTHER',
]);

export const TimeOffStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'WITHDRAWN',
]);

export const TemplateTypeEnum = z.enum([
  'STANDARD',
  'EXTENDED_HOURS',
  'HOLIDAY',
  'SEASONAL',
  'CUSTOM',
]);

export const TemplatePeriodEnum = z.enum([
  'DAILY',
  'WEEKLY',
  'BI_WEEKLY',
  'MONTHLY',
]);

export const AvailabilityTypeEnum = z.enum([
  'AVAILABLE',
  'UNAVAILABLE',
  'PREFERRED',
  'IF_NEEDED',
  'BLOCKED',
]);

export const SwapTypeEnum = z.enum([
  'SWAP',
  'GIVEAWAY',
  'PICKUP',
]);

export const SwapStatusEnum = z.enum([
  'PENDING',
  'ACCEPTED',
  'APPROVED',
  'REJECTED',
  'CANCELLED',
  'COMPLETED',
]);

export const OvertimeStatusEnum = z.enum([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'PAID',
]);

// =============================================================================
// Staff Shift Schemas
// =============================================================================

// Time format validation "HH:mm"
const timeStringSchema = z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)');

export const createShiftSchema = z.object({
  staffProfileId: z.string().min(1, 'Staff profile is required'),
  shiftDate: z.coerce.date(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  breakMinutes: z.number().int().min(0).max(480).default(0),
  locationId: z.string().min(1, 'Location is required'),
  shiftType: ShiftTypeEnum.default('REGULAR'),
  status: ShiftStatusEnum.default('SCHEDULED'),
  notes: z.string().max(2000).optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  templateId: z.string().optional().nullable(),
}).refine(
  (data) => data.endTime > data.startTime,
  { message: 'End time must be after start time', path: ['endTime'] }
);

export const updateShiftSchema = createShiftSchema.partial().extend({
  id: z.string(),
});

export const bulkCreateShiftsSchema = z.object({
  shifts: z.array(createShiftSchema).min(1).max(100),
});

// Helper to handle "all" or empty string as undefined for optional enum fields
const optionalEnumWithAll = <T extends z.ZodTypeAny>(enumSchema: T) =>
  z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    return val;
  }, enumSchema.optional());

export const shiftQuerySchema = z.object({
  staffProfileId: z.string().optional(),
  locationId: z.string().optional(),
  shiftType: optionalEnumWithAll(ShiftTypeEnum),
  status: optionalEnumWithAll(ShiftStatusEnum),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
});

// Clock in/out schema
export const clockInOutSchema = z.object({
  shiftId: z.string().min(1, 'Shift ID is required'),
  action: z.enum(['clockIn', 'clockOut']),
  time: z.coerce.date().optional(), // If not provided, uses current time
  breakMinutes: z.number().int().min(0).optional(), // For clock out
});

// =============================================================================
// Time Off Request Schemas
// =============================================================================

export const createTimeOffRequestSchema = z.object({
  staffProfileId: z.string().min(1, 'Staff profile is required'),
  requestType: TimeOffTypeEnum,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  isPartialDay: z.boolean().default(false),
  partialStartTime: z.coerce.date().optional().nullable(),
  partialEndTime: z.coerce.date().optional().nullable(),
  reason: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  coverageRequired: z.boolean().default(true),
  coverageStaffId: z.string().optional().nullable(),
  coverageNotes: z.string().max(1000).optional().nullable(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: 'End date must be on or after start date', path: ['endDate'] }
).refine(
  (data) => {
    if (data.isPartialDay && (!data.partialStartTime || !data.partialEndTime)) {
      return false;
    }
    return true;
  },
  { message: 'Partial day requires start and end times', path: ['partialStartTime'] }
);

export const updateTimeOffRequestSchema = createTimeOffRequestSchema.partial().extend({
  id: z.string(),
});

export const approveTimeOffSchema = z.object({
  id: z.string(),
  approvalNotes: z.string().max(1000).optional().nullable(),
});

export const rejectTimeOffSchema = z.object({
  id: z.string(),
  rejectionReason: z.string().min(1, 'Rejection reason is required').max(1000),
});

export const timeOffQuerySchema = z.object({
  staffProfileId: z.string().optional(),
  status: optionalEnumWithAll(TimeOffStatusEnum),
  requestType: optionalEnumWithAll(TimeOffTypeEnum),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

// =============================================================================
// Schedule Template Schemas
// =============================================================================

// Template shift data (stored in JSON)
export const templateShiftDataSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6), // 0=Sunday, 6=Saturday
  startTime: timeStringSchema, // "HH:mm"
  endTime: timeStringSchema, // "HH:mm"
  breakMinutes: z.number().int().min(0).max(480).default(0),
  shiftType: ShiftTypeEnum.default('REGULAR'),
  staffProfileId: z.string().optional().nullable(), // For specific staff assignments
  department: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
});

export const createScheduleTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  templateType: TemplateTypeEnum.default('STANDARD'),
  periodType: TemplatePeriodEnum.default('WEEKLY'),
  locationId: z.string().optional().nullable(),
  department: z.string().max(100).optional().nullable(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  effectiveFrom: z.coerce.date().optional().nullable(),
  effectiveUntil: z.coerce.date().optional().nullable(),
  shifts: z.array(templateShiftDataSchema).min(1, 'At least one shift is required'),
});

export const updateScheduleTemplateSchema = createScheduleTemplateSchema.partial().extend({
  id: z.string(),
});

export const applyTemplateSchema = z.object({
  templateId: z.string().min(1, 'Template ID is required'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(), // If not provided, applies for one period
  staffProfileIds: z.array(z.string()).optional(), // If not provided, uses template assignments
  locationId: z.string().optional(), // Override template location
});

export const templateQuerySchema = z.object({
  templateType: optionalEnumWithAll(TemplateTypeEnum),
  locationId: z.string().optional(),
  isActive: z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

// =============================================================================
// Staff Availability Schemas
// =============================================================================

export const createAvailabilitySchema = z.object({
  staffProfileId: z.string().min(1, 'Staff profile is required'),
  availabilityType: AvailabilityTypeEnum,
  isRecurring: z.boolean().default(false),
  // Recurring
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  startTime: timeStringSchema.optional().nullable(),
  endTime: timeStringSchema.optional().nullable(),
  // Specific date
  specificDate: z.coerce.date().optional().nullable(),
  allDay: z.boolean().default(false),
  // Location
  locationId: z.string().optional().nullable(),
  // Effective period
  effectiveFrom: z.coerce.date().optional().nullable(),
  effectiveUntil: z.coerce.date().optional().nullable(),
  // Notes
  reason: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    // Either recurring with dayOfWeek OR specific date
    if (data.isRecurring && data.dayOfWeek === null && data.dayOfWeek === undefined) {
      return false;
    }
    if (!data.isRecurring && !data.specificDate) {
      return false;
    }
    return true;
  },
  { message: 'Recurring availability requires day of week, specific availability requires a date' }
).refine(
  (data) => {
    // If not all day, need start and end times
    if (!data.allDay && data.specificDate && (!data.startTime || !data.endTime)) {
      return false;
    }
    return true;
  },
  { message: 'Non-all-day availability requires start and end times', path: ['startTime'] }
);

export const updateAvailabilitySchema = createAvailabilitySchema.partial().extend({
  id: z.string(),
});

export const availabilityQuerySchema = z.object({
  staffProfileId: z.string().optional(),
  availabilityType: optionalEnumWithAll(AvailabilityTypeEnum),
  isRecurring: z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  isActive: z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
});

// =============================================================================
// Coverage Requirement Schemas
// =============================================================================

export const createCoverageRequirementSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  locationId: z.string().min(1, 'Location is required'),
  department: z.string().max(100).optional().nullable(),
  providerType: z.string().optional().nullable(), // Will be validated against ProviderType enum
  minimumStaff: z.number().int().min(0),
  optimalStaff: z.number().int().min(0).optional().nullable(),
  maximumStaff: z.number().int().min(0).optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6).optional().nullable(),
  startTime: timeStringSchema.optional().nullable(),
  endTime: timeStringSchema.optional().nullable(),
  priority: z.number().int().min(1).max(10).default(1),
  isCritical: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updateCoverageRequirementSchema = createCoverageRequirementSchema.partial().extend({
  id: z.string(),
});

// =============================================================================
// Shift Swap Request Schemas
// =============================================================================

export const createShiftSwapRequestSchema = z.object({
  originalShiftId: z.string().min(1, 'Original shift is required'),
  swapType: SwapTypeEnum,
  targetShiftId: z.string().optional().nullable(),
  targetStaffId: z.string().optional().nullable(),
  reason: z.string().max(1000).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
}).refine(
  (data) => {
    // SWAP requires both target shift and staff
    if (data.swapType === 'SWAP' && (!data.targetShiftId || !data.targetStaffId)) {
      return false;
    }
    // GIVEAWAY requires target staff
    if (data.swapType === 'GIVEAWAY' && !data.targetStaffId) {
      return false;
    }
    return true;
  },
  { message: 'Swap type requirements not met' }
);

export const updateShiftSwapStatusSchema = z.object({
  id: z.string(),
  action: z.enum(['accept', 'approve', 'reject', 'cancel']),
  notes: z.string().max(1000).optional().nullable(),
});

// =============================================================================
// Overtime Schemas
// =============================================================================

export const overtimeQuerySchema = z.object({
  staffProfileId: z.string().optional(),
  status: optionalEnumWithAll(OvertimeStatusEnum),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

export const approveOvertimeSchema = z.object({
  id: z.string(),
  notes: z.string().max(1000).optional().nullable(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
export type ShiftQuery = z.infer<typeof shiftQuerySchema>;
export type ClockInOutInput = z.infer<typeof clockInOutSchema>;

export type CreateTimeOffRequestInput = z.infer<typeof createTimeOffRequestSchema>;
export type UpdateTimeOffRequestInput = z.infer<typeof updateTimeOffRequestSchema>;
export type ApproveTimeOffInput = z.infer<typeof approveTimeOffSchema>;
export type RejectTimeOffInput = z.infer<typeof rejectTimeOffSchema>;
export type TimeOffQuery = z.infer<typeof timeOffQuerySchema>;

export type TemplateShiftData = z.infer<typeof templateShiftDataSchema>;
export type CreateScheduleTemplateInput = z.infer<typeof createScheduleTemplateSchema>;
export type UpdateScheduleTemplateInput = z.infer<typeof updateScheduleTemplateSchema>;
export type ApplyTemplateInput = z.infer<typeof applyTemplateSchema>;
export type TemplateQuery = z.infer<typeof templateQuerySchema>;

export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
export type AvailabilityQuery = z.infer<typeof availabilityQuerySchema>;

export type CreateCoverageRequirementInput = z.infer<typeof createCoverageRequirementSchema>;
export type UpdateCoverageRequirementInput = z.infer<typeof updateCoverageRequirementSchema>;

export type CreateShiftSwapRequestInput = z.infer<typeof createShiftSwapRequestSchema>;
export type UpdateShiftSwapStatusInput = z.infer<typeof updateShiftSwapStatusSchema>;

export type OvertimeQuery = z.infer<typeof overtimeQuerySchema>;
export type ApproveOvertimeInput = z.infer<typeof approveOvertimeSchema>;
