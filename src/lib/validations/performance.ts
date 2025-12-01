import { z } from 'zod';

// =============================================================================
// Performance Metric Validation Schemas
// =============================================================================

export const createPerformanceMetricSchema = z.object({
  staffProfileId: z.string().min(1, 'Staff profile ID is required'),
  metricType: z.string().min(1, 'Metric type is required'),
  metricName: z.string().min(1, 'Metric name is required').max(200),
  value: z.number(),
  unit: z.string().max(50).optional().nullable(),
  periodStart: z.coerce.date(),
  periodEnd: z.coerce.date(),
  targetValue: z.number().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  calculatedBy: z.enum(['manual', 'system', 'integration']).default('manual'),
});

export const updatePerformanceMetricSchema = createPerformanceMetricSchema.partial().omit({
  staffProfileId: true,
});

export const performanceMetricQuerySchema = z.object({
  staffProfileId: z.string().optional(),
  metricType: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

// =============================================================================
// Staff Goal Validation Schemas
// =============================================================================

export const createStaffGoalSchema = z.object({
  staffProfileId: z.string().min(1, 'Staff profile ID is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  startDate: z.coerce.date(),
  targetDate: z.coerce.date(),
  priority: z.number().int().min(1).max(3).default(2),
  milestones: z.array(z.object({
    title: z.string(),
    dueDate: z.coerce.date().optional(),
    completed: z.boolean().default(false),
  })).optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateStaffGoalSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  targetDate: z.coerce.date().optional(),
  completedDate: z.coerce.date().optional().nullable(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED']).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  priority: z.number().int().min(1).max(3).optional(),
  milestones: z.array(z.object({
    title: z.string(),
    dueDate: z.coerce.date().optional(),
    completed: z.boolean().default(false),
  })).optional(),
  notes: z.string().max(2000).optional().nullable(),
  reviewNotes: z.string().max(2000).optional().nullable(),
});

export const staffGoalQuerySchema = z.object({
  staffProfileId: z.string().optional(),
  status: z.string().optional(),
  category: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

// =============================================================================
// Performance Review Validation Schemas
// =============================================================================

export const createPerformanceReviewSchema = z.object({
  staffProfileId: z.string().min(1, 'Staff profile ID is required'),
  reviewType: z.enum(['ANNUAL', 'SEMI_ANNUAL', 'QUARTERLY', 'PROBATIONARY', 'PERFORMANCE_IMPROVEMENT', 'PROMOTION', 'SPECIAL']),
  reviewPeriodStart: z.coerce.date(),
  reviewPeriodEnd: z.coerce.date(),
  reviewDate: z.coerce.date().optional().nullable(),
  reviewerId: z.string().optional().nullable(),
  reviewerName: z.string().max(200).optional().nullable(),
});

export const updatePerformanceReviewSchema = z.object({
  reviewDate: z.coerce.date().optional().nullable(),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'PENDING_APPROVAL', 'COMPLETED', 'CANCELLED']).optional(),
  reviewerId: z.string().optional().nullable(),
  reviewerName: z.string().max(200).optional().nullable(),
  ratings: z.record(z.string(), z.number()).optional().nullable(),
  overallRating: z.number().min(1).max(5).optional().nullable(),
  strengthsNotes: z.string().max(4000).optional().nullable(),
  improvementNotes: z.string().max(4000).optional().nullable(),
  employeeComments: z.string().max(4000).optional().nullable(),
  newGoals: z.array(z.object({
    title: z.string(),
    description: z.string().optional(),
  })).optional().nullable(),
});

export const performanceReviewQuerySchema = z.object({
  staffProfileId: z.string().optional(),
  reviewType: z.string().optional(),
  status: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

// =============================================================================
// Training Record Validation Schemas
// =============================================================================

export const createTrainingRecordSchema = z.object({
  staffProfileId: z.string().min(1, 'Staff profile ID is required'),
  name: z.string().min(1, 'Training name is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().min(1, 'Category is required').max(100),
  provider: z.string().max(200).optional().nullable(),
  durationHours: z.number().positive().optional().nullable(),
  credits: z.number().min(0).optional().nullable(),
  assignedDate: z.coerce.date().optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  expirationDate: z.coerce.date().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateTrainingRecordSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  category: z.string().max(100).optional(),
  provider: z.string().max(200).optional().nullable(),
  durationHours: z.number().positive().optional().nullable(),
  credits: z.number().min(0).optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  startedDate: z.coerce.date().optional().nullable(),
  completedDate: z.coerce.date().optional().nullable(),
  expirationDate: z.coerce.date().optional().nullable(),
  status: z.enum(['ASSIGNED', 'NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE', 'WAIVED']).optional(),
  score: z.number().min(0).max(100).optional().nullable(),
  passed: z.boolean().optional().nullable(),
  certificateUrl: z.string().url().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const trainingRecordQuerySchema = z.object({
  staffProfileId: z.string().optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  overdue: z.preprocess((val) => val === 'true', z.boolean()).optional(),
  expiringSoon: z.preprocess((val) => val === 'true', z.boolean()).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

// =============================================================================
// CE Credit Validation Schemas
// =============================================================================

export const createCECreditSchema = z.object({
  staffProfileId: z.string().min(1, 'Staff profile ID is required'),
  courseName: z.string().min(1, 'Course name is required').max(300),
  provider: z.string().min(1, 'Provider is required').max(200),
  category: z.string().min(1, 'Category is required').max(100),
  credits: z.number().positive('Credits must be positive'),
  creditType: z.string().max(50).optional().nullable(),
  completionDate: z.coerce.date(),
  reportingPeriodStart: z.coerce.date().optional().nullable(),
  reportingPeriodEnd: z.coerce.date().optional().nullable(),
  certificateUrl: z.string().url().max(500).optional().nullable(),
  verificationCode: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const updateCECreditSchema = z.object({
  courseName: z.string().min(1).max(300).optional(),
  provider: z.string().min(1).max(200).optional(),
  category: z.string().max(100).optional(),
  credits: z.number().positive().optional(),
  creditType: z.string().max(50).optional().nullable(),
  completionDate: z.coerce.date().optional(),
  reportingPeriodStart: z.coerce.date().optional().nullable(),
  reportingPeriodEnd: z.coerce.date().optional().nullable(),
  certificateUrl: z.string().url().max(500).optional().nullable(),
  verificationCode: z.string().max(100).optional().nullable(),
  isVerified: z.boolean().optional(),
  notes: z.string().max(2000).optional().nullable(),
});

export const ceCreditQuerySchema = z.object({
  staffProfileId: z.string().optional(),
  category: z.string().optional(),
  isVerified: z.preprocess((val) => val === 'true', z.boolean()).optional(),
  reportingPeriodStart: z.coerce.date().optional(),
  reportingPeriodEnd: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

// =============================================================================
// Recognition Validation Schemas
// =============================================================================

export const createRecognitionSchema = z.object({
  staffProfileId: z.string().min(1, 'Staff profile ID is required'),
  type: z.enum(['KUDOS', 'EMPLOYEE_OF_MONTH', 'YEARS_OF_SERVICE', 'ACHIEVEMENT', 'PEER_RECOGNITION', 'PATIENT_COMPLIMENT', 'OTHER']),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  isAnonymous: z.boolean().default(false),
  awardValue: z.number().min(0).optional().nullable(),
  awardDescription: z.string().max(500).optional().nullable(),
  recognitionDate: z.coerce.date().optional(),
  isPublic: z.boolean().default(true),
});

export const recognitionQuerySchema = z.object({
  staffProfileId: z.string().optional(),
  type: z.string().optional(),
  isPublic: z.preprocess((val) => val === 'true', z.boolean()).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(25),
});

// =============================================================================
// Type Exports
// =============================================================================

export type CreatePerformanceMetricInput = z.infer<typeof createPerformanceMetricSchema>;
export type UpdatePerformanceMetricInput = z.infer<typeof updatePerformanceMetricSchema>;
export type PerformanceMetricQuery = z.infer<typeof performanceMetricQuerySchema>;

export type CreateStaffGoalInput = z.infer<typeof createStaffGoalSchema>;
export type UpdateStaffGoalInput = z.infer<typeof updateStaffGoalSchema>;
export type StaffGoalQuery = z.infer<typeof staffGoalQuerySchema>;

export type CreatePerformanceReviewInput = z.infer<typeof createPerformanceReviewSchema>;
export type UpdatePerformanceReviewInput = z.infer<typeof updatePerformanceReviewSchema>;
export type PerformanceReviewQuery = z.infer<typeof performanceReviewQuerySchema>;

export type CreateTrainingRecordInput = z.infer<typeof createTrainingRecordSchema>;
export type UpdateTrainingRecordInput = z.infer<typeof updateTrainingRecordSchema>;
export type TrainingRecordQuery = z.infer<typeof trainingRecordQuerySchema>;

export type CreateCECreditInput = z.infer<typeof createCECreditSchema>;
export type UpdateCECreditInput = z.infer<typeof updateCECreditSchema>;
export type CECreditQuery = z.infer<typeof ceCreditQuerySchema>;

export type CreateRecognitionInput = z.infer<typeof createRecognitionSchema>;
export type RecognitionQuery = z.infer<typeof recognitionQuerySchema>;
