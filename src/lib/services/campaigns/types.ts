/**
 * Campaign Execution Service Types
 *
 * Type definitions for campaign execution, event handling, and step orchestration.
 */

import type { MessageChannel } from '../messaging/types';

/**
 * Campaign status enum (mirrors Prisma)
 */
export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

/**
 * Campaign type enum
 */
export type CampaignType =
  | 'MARKETING'
  | 'REMINDER'
  | 'FOLLOW_UP'
  | 'SURVEY'
  | 'REACTIVATION'
  | 'WELCOME'
  | 'EDUCATION';

/**
 * Trigger type enum
 */
export type TriggerType = 'EVENT' | 'SCHEDULED' | 'RECURRING';

/**
 * Step type enum
 */
export type StepType = 'SEND' | 'WAIT' | 'CONDITION' | 'BRANCH';

/**
 * Send status enum
 */
export type SendStatus =
  | 'PENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'OPENED'
  | 'CLICKED'
  | 'FAILED'
  | 'SKIPPED'
  | 'CANCELLED';

/**
 * Business events that can trigger campaigns
 */
export type BusinessEvent =
  // Appointment events
  | 'appointment.booked'
  | 'appointment.confirmed'
  | 'appointment.cancelled'
  | 'appointment.completed'
  | 'appointment.noshow'
  | 'appointment.rescheduled'
  // Treatment events
  | 'treatment.started'
  | 'treatment.phase_changed'
  | 'treatment.milestone_reached'
  | 'treatment.completed'
  // Patient events
  | 'patient.created'
  | 'patient.activated'
  | 'patient.birthday'
  // Billing events
  | 'payment.due'
  | 'payment.overdue'
  | 'payment.received'
  | 'insurance.claim_status'
  // Custom events
  | 'custom';

/**
 * Event payload structure
 */
export interface CampaignEventPayload {
  event: BusinessEvent;
  clinicId: string;
  patientId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

/**
 * Audience criteria for targeting patients
 */
export interface AudienceCriteria {
  patientStatus?: string[];
  treatmentTypes?: string[];
  treatmentPhases?: string[];
  tags?: string[];
  ageRange?: { min?: number; max?: number };
  lastVisitDays?: { min?: number; max?: number };
  hasEmail?: boolean;
  hasPhone?: boolean;
  communicationOptIn?: boolean;
}

/**
 * Recurrence configuration
 */
export interface RecurrenceConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  days?: number[]; // For weekly: 0-6 (Sun-Sat), for monthly: 1-31
  time: string; // HH:mm format
  timezone?: string;
}

/**
 * Condition for CONDITION/BRANCH steps
 */
export interface StepCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'exists';
  value: unknown;
}

/**
 * Branch configuration
 */
export interface BranchConfig {
  condition: StepCondition;
  nextStepId: string;
}

/**
 * Campaign step definition
 */
export interface CampaignStepConfig {
  id: string;
  stepOrder: number;
  name: string;
  type: StepType;
  // For SEND steps
  channel?: MessageChannel;
  templateId?: string;
  // For WAIT steps
  waitDuration?: number; // In minutes
  waitUntil?: string; // Dynamic expression
  // For CONDITION/BRANCH steps
  condition?: StepCondition;
  branches?: BranchConfig[];
  nextStepId?: string;
}

/**
 * Campaign execution context
 */
export interface ExecutionContext {
  campaignId: string;
  clinicId: string;
  patientId: string;
  currentStepId?: string;
  variables: Record<string, unknown>;
  startedAt: Date;
  triggeredBy: 'event' | 'schedule' | 'manual';
  triggerData?: Record<string, unknown>;
}

/**
 * Step execution result
 */
export interface StepExecutionResult {
  success: boolean;
  nextStepId?: string | null;
  skipReason?: string;
  messageId?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Campaign processing result
 */
export interface CampaignProcessingResult {
  campaignId: string;
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: Array<{
    patientId: string;
    stepId: string;
    error: string;
  }>;
}

/**
 * Processor batch result
 */
export interface BatchProcessingResult {
  scheduledProcessed: number;
  recurringProcessed: number;
  pendingSendsProcessed: number;
  errors: string[];
}
