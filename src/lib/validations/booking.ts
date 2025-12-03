import { z } from 'zod';

// =============================================================================
// Booking Enums (matching Prisma schema)
// =============================================================================

export const AppointmentStatusEnum = z.enum([
  'SCHEDULED',
  'CONFIRMED',
  'ARRIVED',
  'IN_PROGRESS',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED',
]);

export const ConfirmationStatusEnum = z.enum([
  'UNCONFIRMED',
  'PENDING',
  'CONFIRMED',
  'DECLINED',
]);

export const AppointmentSourceEnum = z.enum([
  'STAFF',
  'PHONE',
  'ONLINE',
  'WAITLIST',
  'TREATMENT_PLAN',
  'RECALL',
]);

// =============================================================================
// Helper Functions
// =============================================================================

// Helper to handle "all" or empty string as undefined for optional enum fields
const optionalEnumWithAll = <T extends z.ZodTypeAny>(enumSchema: T) =>
  z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    return val;
  }, enumSchema.optional());

// Hex color validation
const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g., #3B82F6)');

// =============================================================================
// Appointment Type Schemas
// =============================================================================

export const createAppointmentTypeSchema = z.object({
  // Identification
  code: z
    .string()
    .min(1, 'Code is required')
    .max(50)
    .regex(/^[A-Z0-9_]+$/, 'Code must be uppercase letters, numbers, and underscores only'),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(1000).optional().nullable(),

  // Duration settings (in minutes)
  defaultDuration: z.number().int().positive('Duration must be positive').max(480, 'Duration cannot exceed 8 hours'),
  minDuration: z.number().int().positive().max(480).optional().nullable(),
  maxDuration: z.number().int().positive().max(480).optional().nullable(),

  // Visual settings
  color: hexColorSchema,
  icon: z.string().max(50).optional().nullable(),

  // Resource requirements
  requiresChair: z.boolean().optional().default(true),
  requiresRoom: z.boolean().optional().default(false),

  // Buffer times (in minutes)
  prepTime: z.number().int().min(0).max(60).optional().default(0),
  cleanupTime: z.number().int().min(0).max(60).optional().default(0),

  // Configuration
  isActive: z.boolean().optional().default(true),
  allowOnline: z.boolean().optional().default(false),
  sortOrder: z.number().int().min(0).optional().default(0),
}).refine(
  (data) => {
    // If minDuration is set, it must be <= defaultDuration
    if (data.minDuration && data.minDuration > data.defaultDuration) {
      return false;
    }
    return true;
  },
  { message: 'Minimum duration cannot exceed default duration', path: ['minDuration'] }
).refine(
  (data) => {
    // If maxDuration is set, it must be >= defaultDuration
    if (data.maxDuration && data.maxDuration < data.defaultDuration) {
      return false;
    }
    return true;
  },
  { message: 'Maximum duration cannot be less than default duration', path: ['maxDuration'] }
);

export const updateAppointmentTypeSchema = createAppointmentTypeSchema.partial();

export const appointmentTypeQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  allowOnline: z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(50),
  sortBy: z.enum(['name', 'code', 'defaultDuration', 'sortOrder', 'createdAt']).optional().default('sortOrder'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// =============================================================================
// Appointment Schemas
// =============================================================================

export const createAppointmentSchema = z.object({
  // Required fields
  patientId: z.string().min(1, 'Patient is required'),
  appointmentTypeId: z.string().min(1, 'Appointment type is required'),
  providerId: z.string().min(1, 'Provider is required'),

  // Timing
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(), // Auto-calculated if not provided
  duration: z.number().int().positive().max(480).optional(), // Auto-calculated if not provided

  // Optional resources
  chairId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),

  // Status (defaults to SCHEDULED)
  status: AppointmentStatusEnum.optional().default('SCHEDULED'),
  confirmationStatus: ConfirmationStatusEnum.optional().default('UNCONFIRMED'),

  // Booking info
  source: AppointmentSourceEnum.optional().default('STAFF'),

  // Notes
  notes: z.string().max(2000).optional().nullable(),
  patientNotes: z.string().max(1000).optional().nullable(),
}).refine(
  (data) => {
    // If endTime is provided, it must be after startTime
    if (data.endTime && data.endTime <= data.startTime) {
      return false;
    }
    return true;
  },
  { message: 'End time must be after start time', path: ['endTime'] }
).refine(
  (data) => {
    // Appointment cannot be in the past (allow a 5-minute buffer for edge cases)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return data.startTime >= fiveMinutesAgo;
  },
  { message: 'Appointment cannot be scheduled in the past', path: ['startTime'] }
);

export const updateAppointmentSchema = z.object({
  // Allow updating these fields
  appointmentTypeId: z.string().min(1).optional(),
  providerId: z.string().min(1).optional(),
  chairId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),

  // Timing updates
  startTime: z.coerce.date().optional(),
  endTime: z.coerce.date().optional(),
  duration: z.number().int().positive().max(480).optional(),

  // Notes updates
  notes: z.string().max(2000).optional().nullable(),
  patientNotes: z.string().max(1000).optional().nullable(),
}).refine(
  (data) => {
    // If both times are provided, endTime must be after startTime
    if (data.startTime && data.endTime && data.endTime <= data.startTime) {
      return false;
    }
    return true;
  },
  { message: 'End time must be after start time', path: ['endTime'] }
);

export const appointmentQuerySchema = z.object({
  // Filters
  patientId: z.string().optional(),
  providerId: z.string().optional(),
  appointmentTypeId: z.string().optional(),
  chairId: z.string().optional(),
  roomId: z.string().optional(),
  status: optionalEnumWithAll(AppointmentStatusEnum),
  confirmationStatus: optionalEnumWithAll(ConfirmationStatusEnum),
  source: optionalEnumWithAll(AppointmentSourceEnum),

  // Date range
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),

  // Search
  search: z.string().optional(), // Patient name search

  // Pagination
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),

  // Sorting
  sortBy: z.enum(['startTime', 'createdAt', 'status', 'patientName']).optional().default('startTime'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

// =============================================================================
// Status Transition Schemas
// =============================================================================

export const confirmAppointmentSchema = z.object({
  confirmedBy: z.enum(['patient', 'staff', 'auto']).optional().default('staff'),
});

export const checkInAppointmentSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
});

export const startAppointmentSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
});

export const completeAppointmentSchema = z.object({
  notes: z.string().max(500).optional().nullable(),
});

export const cancelAppointmentSchema = z.object({
  cancellationReason: z.string().min(1, 'Cancellation reason is required').max(500),
});

export const noShowAppointmentSchema = z.object({
  noShowReason: z.string().max(500).optional().nullable(),
});

// =============================================================================
// Calendar Query Schema
// =============================================================================

export const calendarQuerySchema = z.object({
  // Date range (required for calendar view)
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),

  // Optional filters
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
  appointmentTypeId: z.string().optional(),
  chairId: z.string().optional(),
  roomId: z.string().optional(),
  status: optionalEnumWithAll(AppointmentStatusEnum),

  // Include cancelled/no-show
  includeInactive: z.preprocess((val) => {
    if (val === '' || val === null) return false;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional().default(false)),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: 'End date must be on or after start date', path: ['endDate'] }
).refine(
  (data) => {
    // Limit calendar range to 3 months
    const diffMs = data.endDate.getTime() - data.startDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= 93; // ~3 months
  },
  { message: 'Calendar range cannot exceed 3 months', path: ['endDate'] }
);

// =============================================================================
// Availability Check Schema
// =============================================================================

export const availabilityCheckSchema = z.object({
  providerId: z.string().min(1, 'Provider is required'),
  startTime: z.coerce.date(),
  endTime: z.coerce.date(),
  chairId: z.string().optional().nullable(),
  roomId: z.string().optional().nullable(),
  excludeAppointmentId: z.string().optional(), // Exclude when checking for rescheduling
}).refine(
  (data) => data.endTime > data.startTime,
  { message: 'End time must be after start time', path: ['endTime'] }
);

// =============================================================================
// Type Exports
// =============================================================================

export type CreateAppointmentTypeInput = z.infer<typeof createAppointmentTypeSchema>;
export type UpdateAppointmentTypeInput = z.infer<typeof updateAppointmentTypeSchema>;
export type AppointmentTypeQuery = z.infer<typeof appointmentTypeQuerySchema>;

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type AppointmentQuery = z.infer<typeof appointmentQuerySchema>;

export type ConfirmAppointmentInput = z.infer<typeof confirmAppointmentSchema>;
export type CheckInAppointmentInput = z.infer<typeof checkInAppointmentSchema>;
export type StartAppointmentInput = z.infer<typeof startAppointmentSchema>;
export type CompleteAppointmentInput = z.infer<typeof completeAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type NoShowAppointmentInput = z.infer<typeof noShowAppointmentSchema>;

export type CalendarQuery = z.infer<typeof calendarQuerySchema>;
export type AvailabilityCheckInput = z.infer<typeof availabilityCheckSchema>;
