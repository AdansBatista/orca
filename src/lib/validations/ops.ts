import { z } from 'zod';

// =============================================================================
// PATIENT FLOW STATE SCHEMAS
// =============================================================================

/**
 * Flow stage enum matching Prisma
 */
export const flowStageEnum = z.enum([
  'SCHEDULED',
  'CHECKED_IN',
  'WAITING',
  'CALLED',
  'IN_CHAIR',
  'COMPLETED',
  'CHECKED_OUT',
  'DEPARTED',
  'NO_SHOW',
  'CANCELLED',
]);

/**
 * Flow priority enum matching Prisma
 */
export const flowPriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

/**
 * Check-in a patient
 */
export const checkInSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  notes: z.string().optional(),
});

/**
 * Move patient to waiting room
 */
export const waitingSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  notes: z.string().optional(),
});

/**
 * Call patient to treatment area
 */
export const callPatientSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  chairId: z.string().optional(), // Can pre-assign chair
  notes: z.string().optional(),
});

/**
 * Seat patient in chair
 */
export const seatPatientSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  chairId: z.string().min(1, 'Chair ID is required'),
  notes: z.string().optional(),
});

/**
 * Mark treatment as complete
 */
export const completePatientSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  notes: z.string().optional(),
});

/**
 * Check-out patient
 */
export const checkOutSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  notes: z.string().optional(),
});

/**
 * Mark patient as departed
 */
export const departedSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  notes: z.string().optional(),
});

/**
 * Update flow priority
 */
export const updatePrioritySchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  priority: flowPriorityEnum,
  notes: z.string().optional(),
});

/**
 * General flow transition schema
 */
export const flowTransitionSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  toStage: flowStageEnum,
  chairId: z.string().optional(),
  notes: z.string().optional(),
});

// =============================================================================
// RESOURCE OCCUPANCY SCHEMAS
// =============================================================================

/**
 * Occupancy status enum matching Prisma
 */
export const occupancyStatusEnum = z.enum([
  'AVAILABLE',
  'OCCUPIED',
  'BLOCKED',
  'MAINTENANCE',
  'CLEANING',
]);

/**
 * Chair activity sub-stage enum matching Prisma
 * Detailed workflow tracking within IN_CHAIR stage
 */
export const chairActivitySubStageEnum = z.enum([
  'SETUP',              // Patient being seated, bib on, chart review
  'ASSISTANT_WORKING',  // Assistant performing procedures
  'READY_FOR_DOCTOR',   // 🔔 Waiting for doctor - prominent indicator
  'DOCTOR_CHECKING',    // Doctor actively checking patient
  'FINISHING',          // Final steps before completion
  'CLEANING',           // Post-treatment cleanup
]);

/**
 * Update resource status
 */
export const updateResourceStatusSchema = z.object({
  status: occupancyStatusEnum,
  appointmentId: z.string().optional(),
  patientId: z.string().optional(),
  blockReason: z.string().optional(),
  blockedUntil: z.string().datetime().optional(),
});

/**
 * Update chair activity sub-stage
 */
export const updateSubStageSchema = z.object({
  subStage: chairActivitySubStageEnum,
  assignedStaffId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Mark chair as ready for doctor (quick action)
 */
export const readyForDoctorSchema = z.object({
  notes: z.string().max(500).optional(),
});

/**
 * Add procedure note to chair session
 */
export const addChairNoteSchema = z.object({
  note: z.string().min(1, 'Note is required').max(1000),
  appendToExisting: z.boolean().optional().default(true),
});

/**
 * Block a chair (cleaning, maintenance, or other)
 */
export const blockChairSchema = z.object({
  reason: z.string().min(1, 'Reason is required').max(200),
  blockType: z.enum(['BLOCKED', 'CLEANING', 'MAINTENANCE']).default('BLOCKED'),
  blockedUntil: z.string().datetime().optional(),
  durationMinutes: z.number().min(1).max(1440).optional(), // Max 24 hours
});

/**
 * Unblock a chair
 */
export const unblockChairSchema = z.object({
  notes: z.string().max(200).optional(),
});

// =============================================================================
// STAFF ASSIGNMENT SCHEMAS
// =============================================================================

/**
 * Assign staff to appointment
 */
export const assignStaffSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  staffId: z.string().min(1, 'Staff ID is required'),
  role: z.string().min(1, 'Role is required'),
  notes: z.string().optional(),
});

/**
 * Remove staff assignment
 */
export const unassignStaffSchema = z.object({
  appointmentId: z.string().min(1, 'Appointment ID is required'),
  staffId: z.string().min(1, 'Staff ID is required'),
});

// =============================================================================
// OPERATIONS TASK SCHEMAS
// =============================================================================

/**
 * Task type enum matching Prisma
 */
export const taskTypeEnum = z.enum(['MANUAL', 'AI_GENERATED', 'SYSTEM']);

/**
 * Task status enum matching Prisma
 */
export const taskStatusEnum = z.enum([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

/**
 * Task priority enum matching Prisma
 */
export const taskPriorityEnum = z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT']);

/**
 * Create operations task
 * Note: dueAt accepts ISO datetime string (converted from datetime-local input)
 */
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
  type: taskTypeEnum.default('MANUAL'),
  assigneeId: z.string().optional(),
  dueAt: z.string().optional(), // Accept any valid date string, will be parsed in API
  priority: taskPriorityEnum.default('NORMAL'),
  relatedType: z.string().optional(),
  relatedId: z.string().optional(),
});

/**
 * Update operations task
 */
export const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  assigneeId: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(), // Accept any valid date string
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
});

// =============================================================================
// FLOOR PLAN SCHEMAS
// =============================================================================

/**
 * Chair position in floor plan
 */
export const floorPlanChairSchema = z.object({
  chairId: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  rotation: z.number().optional().default(0),
});

/**
 * Room position in floor plan
 */
export const floorPlanRoomSchema = z.object({
  roomId: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  rotation: z.number().optional().default(0),
  chairs: z.array(floorPlanChairSchema).optional().default([]),
});

/**
 * Update floor plan configuration
 */
export const updateFloorPlanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  gridColumns: z.number().min(5).max(50).optional(),
  gridRows: z.number().min(5).max(50).optional(),
  cellSize: z.number().min(20).max(100).optional(),
  backgroundImage: z.string().url().nullable().optional(),
  layout: z.array(floorPlanRoomSchema).optional(),
});

// =============================================================================
// QUERY SCHEMAS
// =============================================================================

/**
 * Query params for flow list
 */
export const flowQuerySchema = z.object({
  date: z.string().datetime().optional(),
  stage: flowStageEnum.optional(),
  providerId: z.string().optional(),
  chairId: z.string().optional(),
});

/**
 * Query params for queue
 */
export const queueQuerySchema = z.object({
  stages: z.array(flowStageEnum).optional(),
});

/**
 * Query params for tasks
 * Note: status can be comma-separated for multiple values (e.g., "PENDING,IN_PROGRESS")
 */
export const taskQuerySchema = z.object({
  status: z.string().optional(), // Can be single or comma-separated status values
  assigneeId: z.string().optional(),
  priority: taskPriorityEnum.optional(),
  dueFrom: z.string().optional(),
  dueTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

/**
 * Query params for dashboard day view
 */
export const dayDashboardQuerySchema = z.object({
  date: z.string().optional(), // YYYY-MM-DD format
  providerId: z.string().optional(),
});

/**
 * Query params for dashboard week view
 */
export const weekDashboardQuerySchema = z.object({
  weekStart: z.string().optional(), // YYYY-MM-DD format (Monday)
});

/**
 * Query params for dashboard month view
 */
export const monthDashboardQuerySchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2020).max(2100).optional(),
});

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type FlowStage = z.infer<typeof flowStageEnum>;
export type FlowPriority = z.infer<typeof flowPriorityEnum>;
export type OccupancyStatus = z.infer<typeof occupancyStatusEnum>;
export type ChairActivitySubStage = z.infer<typeof chairActivitySubStageEnum>;
export type TaskType = z.infer<typeof taskTypeEnum>;
export type TaskStatus = z.infer<typeof taskStatusEnum>;
export type TaskPriority = z.infer<typeof taskPriorityEnum>;

export type CheckInInput = z.infer<typeof checkInSchema>;
export type WaitingInput = z.infer<typeof waitingSchema>;
export type CallPatientInput = z.infer<typeof callPatientSchema>;
export type SeatPatientInput = z.infer<typeof seatPatientSchema>;
export type CompletePatientInput = z.infer<typeof completePatientSchema>;
export type CheckOutInput = z.infer<typeof checkOutSchema>;
export type FlowTransitionInput = z.infer<typeof flowTransitionSchema>;
export type UpdatePriorityInput = z.infer<typeof updatePrioritySchema>;

export type UpdateResourceStatusInput = z.infer<typeof updateResourceStatusSchema>;
export type UpdateSubStageInput = z.infer<typeof updateSubStageSchema>;
export type ReadyForDoctorInput = z.infer<typeof readyForDoctorSchema>;
export type AddChairNoteInput = z.infer<typeof addChairNoteSchema>;
export type AssignStaffInput = z.infer<typeof assignStaffSchema>;
export type UnassignStaffInput = z.infer<typeof unassignStaffSchema>;

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export type FloorPlanRoom = z.infer<typeof floorPlanRoomSchema>;
export type FloorPlanChair = z.infer<typeof floorPlanChairSchema>;
export type UpdateFloorPlanInput = z.infer<typeof updateFloorPlanSchema>;

export type FlowQueryInput = z.infer<typeof flowQuerySchema>;
export type QueueQueryInput = z.infer<typeof queueQuerySchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
export type DayDashboardQueryInput = z.infer<typeof dayDashboardQuerySchema>;
export type WeekDashboardQueryInput = z.infer<typeof weekDashboardQuerySchema>;
export type MonthDashboardQueryInput = z.infer<typeof monthDashboardQuerySchema>;
