import type { TimeOffType } from '@prisma/client';

/**
 * Time-off policy configuration
 * Defines advance notice requirements and special handling for different request types
 */

export interface TimeOffPolicy {
  /** Minimum days notice required before the start date */
  advanceNoticeDays: number;
  /** Whether HR review is required */
  requiresHRReview: boolean;
  /** Maximum consecutive days allowed (0 = unlimited) */
  maxConsecutiveDays: number;
  /** Description of the policy */
  description: string;
}

/**
 * Default time-off policies by request type
 */
export const DEFAULT_POLICIES: Record<TimeOffType, TimeOffPolicy> = {
  VACATION: {
    advanceNoticeDays: 14,
    requiresHRReview: false,
    maxConsecutiveDays: 0,
    description: 'Vacation leave',
  },
  SICK: {
    advanceNoticeDays: 0, // No advance notice required
    requiresHRReview: false,
    maxConsecutiveDays: 3, // After 3 days, may require doctor's note
    description: 'Sick leave - no advance notice required',
  },
  PERSONAL: {
    advanceNoticeDays: 7,
    requiresHRReview: false,
    maxConsecutiveDays: 3,
    description: 'Personal day',
  },
  BEREAVEMENT: {
    advanceNoticeDays: 0, // No advance notice required
    requiresHRReview: false,
    maxConsecutiveDays: 5,
    description: 'Bereavement leave - no advance notice required',
  },
  JURY_DUTY: {
    advanceNoticeDays: 0,
    requiresHRReview: false,
    maxConsecutiveDays: 0, // As long as required
    description: 'Jury duty - documentation required',
  },
  MILITARY: {
    advanceNoticeDays: 30,
    requiresHRReview: true,
    maxConsecutiveDays: 0,
    description: 'Military leave - HR review required',
  },
  FMLA: {
    advanceNoticeDays: 30, // 30 days when foreseeable
    requiresHRReview: true, // HR must review FMLA requests
    maxConsecutiveDays: 0, // Up to 12 weeks per federal law
    description: 'Family and Medical Leave Act - HR review required',
  },
  MATERNITY: {
    advanceNoticeDays: 30,
    requiresHRReview: true,
    maxConsecutiveDays: 0,
    description: 'Maternity leave - HR review required',
  },
  PATERNITY: {
    advanceNoticeDays: 30,
    requiresHRReview: true,
    maxConsecutiveDays: 0,
    description: 'Paternity leave - HR review required',
  },
  UNPAID: {
    advanceNoticeDays: 14,
    requiresHRReview: true, // HR should approve unpaid leave
    maxConsecutiveDays: 0,
    description: 'Unpaid leave - HR review required',
  },
  CONTINUING_EDUCATION: {
    advanceNoticeDays: 14,
    requiresHRReview: false,
    maxConsecutiveDays: 0,
    description: 'Continuing education leave',
  },
  HOLIDAY: {
    advanceNoticeDays: 0,
    requiresHRReview: false,
    maxConsecutiveDays: 0,
    description: 'Holiday',
  },
  OTHER: {
    advanceNoticeDays: 7,
    requiresHRReview: false,
    maxConsecutiveDays: 0,
    description: 'Other leave type',
  },
};

export interface AdvanceNoticeResult {
  isValid: boolean;
  requiredDays: number;
  actualDays: number;
  message?: string;
}

/**
 * Validate that a time-off request meets advance notice requirements
 */
export function validateAdvanceNotice(
  requestType: TimeOffType,
  startDate: Date,
  requestDate: Date = new Date()
): AdvanceNoticeResult {
  const policy = DEFAULT_POLICIES[requestType];

  // Calculate days between request date and start date
  const requestDateOnly = new Date(requestDate);
  requestDateOnly.setHours(0, 0, 0, 0);

  const startDateOnly = new Date(startDate);
  startDateOnly.setHours(0, 0, 0, 0);

  const diffTime = startDateOnly.getTime() - requestDateOnly.getTime();
  const actualDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isValid = actualDays >= policy.advanceNoticeDays;

  return {
    isValid,
    requiredDays: policy.advanceNoticeDays,
    actualDays,
    message: isValid
      ? undefined
      : `${requestType} requests require ${policy.advanceNoticeDays} days advance notice. This request provides only ${actualDays} days.`,
  };
}

/**
 * Check if a time-off request type requires HR review
 */
export function requiresHRReview(requestType: TimeOffType): boolean {
  return DEFAULT_POLICIES[requestType]?.requiresHRReview ?? false;
}

/**
 * Get the policy for a specific request type
 */
export function getPolicy(requestType: TimeOffType): TimeOffPolicy {
  return DEFAULT_POLICIES[requestType];
}

/**
 * Check if the request duration exceeds the maximum consecutive days
 * Returns null if within limits, or a warning message if exceeded
 */
export function checkConsecutiveDays(
  requestType: TimeOffType,
  totalDays: number
): string | null {
  const policy = DEFAULT_POLICIES[requestType];

  if (policy.maxConsecutiveDays === 0) {
    return null; // No limit
  }

  if (totalDays > policy.maxConsecutiveDays) {
    return `${requestType} requests exceeding ${policy.maxConsecutiveDays} consecutive days may require additional documentation or approval.`;
  }

  return null;
}
