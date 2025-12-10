/**
 * Content Delivery Automation Types
 *
 * Type definitions for automated content delivery system.
 */

import type { DeliveryMethod, ContentStatus } from '@prisma/client';

/**
 * Delivery triggers that can initiate content delivery
 */
export type DeliveryTrigger =
  | 'treatment_start' // When patient starts treatment
  | 'phase_change' // When treatment phase changes
  | 'appointment_scheduled' // When appointment is scheduled
  | 'appointment_reminder' // Before an appointment
  | 'post_appointment' // After an appointment
  | 'milestone_reached' // Treatment milestone achieved
  | 'compliance_alert' // Compliance issue detected
  | 'manual' // Staff-initiated
  | 'scheduled' // Scheduled delivery
  | 'campaign'; // Campaign-triggered

/**
 * Content targeting criteria for automated delivery
 */
export interface ContentTargetingCriteria {
  treatmentTypes?: string[];
  treatmentPhases?: string[];
  ageGroups?: string[];
  appointmentTypes?: string[];
  daysInTreatment?: { min?: number; max?: number };
  complianceScore?: { min?: number; max?: number };
}

/**
 * Content delivery rule for automation
 */
export interface DeliveryRule {
  id: string;
  name: string;
  description?: string;
  trigger: DeliveryTrigger;
  targeting: ContentTargetingCriteria;
  articleIds: string[];
  deliveryMethod: DeliveryMethod;
  delayMinutes?: number; // Delay after trigger
  isActive: boolean;
  priority: number; // Higher = more important
}

/**
 * Scheduled content delivery
 */
export interface ScheduledDelivery {
  id: string;
  clinicId: string;
  patientId: string;
  articleId: string;
  method: DeliveryMethod;
  scheduledFor: Date;
  trigger: DeliveryTrigger;
  ruleId?: string;
  status: 'PENDING' | 'SENT' | 'FAILED' | 'CANCELLED';
  sentAt?: Date;
  failureReason?: string;
}

/**
 * Content recommendation based on patient context
 */
export interface ContentRecommendation {
  articleId: string;
  title: string;
  category: string;
  relevanceScore: number;
  reason: string;
  recommendedMethod: DeliveryMethod;
}

/**
 * Delivery result from processing
 */
export interface DeliveryResult {
  success: boolean;
  deliveryId?: string;
  articleId: string;
  patientId: string;
  method: DeliveryMethod;
  error?: string;
  messageId?: string; // External message ID if sent via SMS/Email
}

/**
 * Batch delivery request
 */
export interface BatchDeliveryRequest {
  articleId: string;
  patientIds: string[];
  method: DeliveryMethod;
  personalMessage?: string;
  scheduledFor?: Date;
}

/**
 * Content delivery statistics
 */
export interface DeliveryStats {
  totalDelivered: number;
  deliveredByMethod: Record<DeliveryMethod, number>;
  viewRate: number;
  averageTimeToView?: number; // in minutes
  topArticles: Array<{
    articleId: string;
    title: string;
    deliveryCount: number;
    viewCount: number;
  }>;
}

/**
 * Default delivery rules for new treatments
 */
export const DEFAULT_DELIVERY_RULES: Omit<DeliveryRule, 'id'>[] = [
  {
    name: 'Welcome to Treatment',
    description: 'Send getting started content when treatment begins',
    trigger: 'treatment_start',
    targeting: {},
    articleIds: [], // Will be populated with category: getting-started articles
    deliveryMethod: 'EMAIL',
    delayMinutes: 0,
    isActive: true,
    priority: 10,
  },
  {
    name: 'Pre-Appointment Reminder',
    description: 'Send helpful content before appointments',
    trigger: 'appointment_reminder',
    targeting: {},
    articleIds: [], // Will be populated with category: appointments articles
    deliveryMethod: 'SMS_LINK',
    delayMinutes: 0, // Sent with appointment reminder
    isActive: true,
    priority: 5,
  },
  {
    name: 'Phase Change Education',
    description: 'Send relevant content when treatment phase changes',
    trigger: 'phase_change',
    targeting: {},
    articleIds: [], // Will be populated based on new phase
    deliveryMethod: 'EMAIL',
    delayMinutes: 60, // 1 hour after phase change
    isActive: true,
    priority: 8,
  },
  {
    name: 'Compliance Support',
    description: 'Send compliance tips when issues detected',
    trigger: 'compliance_alert',
    targeting: { complianceScore: { max: 70 } },
    articleIds: [], // Will be populated with category: compliance articles
    deliveryMethod: 'IN_APP',
    delayMinutes: 0,
    isActive: true,
    priority: 9,
  },
];
