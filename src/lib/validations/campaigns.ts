import { z } from 'zod';

// Campaign types
export const campaignTypeSchema = z.enum([
  'MARKETING',
  'REMINDER',
  'FOLLOW_UP',
  'SURVEY',
  'REACTIVATION',
  'WELCOME',
  'EDUCATION',
]);

export const triggerTypeSchema = z.enum(['EVENT', 'SCHEDULED', 'RECURRING']);

export const campaignStatusSchema = z.enum([
  'DRAFT',
  'SCHEDULED',
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED',
]);

export const stepTypeSchema = z.enum(['SEND', 'WAIT', 'CONDITION', 'BRANCH']);

export const messageChannelSchema = z.enum(['SMS', 'EMAIL', 'PUSH', 'IN_APP']);

// Audience criteria schema
export const audienceSchema = z
  .object({
    patientStatus: z.array(z.string()).optional(),
    treatmentTypes: z.array(z.string()).optional(),
    treatmentPhases: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    ageRange: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
    lastVisitDays: z
      .object({
        min: z.number().optional(),
        max: z.number().optional(),
      })
      .optional(),
  })
  .optional();

// Recurrence schema
export const recurrenceSchema = z
  .object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    days: z.array(z.number().min(0).max(6)).optional(), // 0=Sunday for weekly
    dayOfMonth: z.number().min(1).max(31).optional(), // For monthly
    time: z.string().regex(/^\d{2}:\d{2}$/), // HH:mm format
    timezone: z.string().optional(),
  })
  .optional();

// Campaign step schema
export const campaignStepSchema = z.object({
  name: z.string().min(1).max(100),
  type: stepTypeSchema,
  // For SEND steps
  channel: messageChannelSchema.optional(),
  templateId: z.string().optional(),
  // For WAIT steps
  waitDuration: z.number().min(1).optional(), // Minutes
  waitUntil: z.string().optional(), // Dynamic expression
  // For CONDITION/BRANCH steps
  condition: z.record(z.string(), z.unknown()).optional(),
  branches: z.array(z.record(z.string(), z.unknown())).optional(),
});

// Create campaign schema
export const createCampaignSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  type: campaignTypeSchema,
  triggerType: triggerTypeSchema,
  triggerEvent: z.string().optional(),
  triggerSchedule: z.string().datetime().optional(),
  triggerRecurrence: recurrenceSchema,
  audience: audienceSchema,
  excludeCriteria: audienceSchema,
  steps: z.array(campaignStepSchema).optional(),
});

// Update campaign schema
export const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  type: campaignTypeSchema.optional(),
  triggerType: triggerTypeSchema.optional(),
  triggerEvent: z.string().optional().nullable(),
  triggerSchedule: z.string().datetime().optional().nullable(),
  triggerRecurrence: recurrenceSchema.nullable(),
  audience: audienceSchema.nullable(),
  excludeCriteria: audienceSchema.nullable(),
});

// Add step schema
export const addStepSchema = campaignStepSchema;

// Update step schema
export const updateStepSchema = campaignStepSchema.partial();

// Query schema
export const campaignQuerySchema = z.object({
  type: campaignTypeSchema.optional(),
  status: campaignStatusSchema.optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

// Common trigger events
export const TRIGGER_EVENTS = [
  { value: 'appointment.booked', label: 'Appointment Booked' },
  { value: 'appointment.confirmed', label: 'Appointment Confirmed' },
  { value: 'appointment.cancelled', label: 'Appointment Cancelled' },
  { value: 'appointment.completed', label: 'Appointment Completed' },
  { value: 'appointment.reminder', label: 'Appointment Reminder Due' },
  { value: 'patient.created', label: 'New Patient Created' },
  { value: 'patient.reactivated', label: 'Patient Reactivated' },
  { value: 'treatment.started', label: 'Treatment Started' },
  { value: 'treatment.phase_changed', label: 'Treatment Phase Changed' },
  { value: 'treatment.completed', label: 'Treatment Completed' },
  { value: 'treatment.milestone', label: 'Milestone Reached' },
  { value: 'payment.received', label: 'Payment Received' },
  { value: 'payment.due', label: 'Payment Due' },
  { value: 'payment.overdue', label: 'Payment Overdue' },
  { value: 'birthday', label: 'Patient Birthday' },
] as const;

export type CampaignType = z.infer<typeof campaignTypeSchema>;
export type TriggerType = z.infer<typeof triggerTypeSchema>;
export type CampaignStatus = z.infer<typeof campaignStatusSchema>;
export type StepType = z.infer<typeof stepTypeSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type CampaignStep = z.infer<typeof campaignStepSchema>;
