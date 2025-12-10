/**
 * Appointment Reminder Service Types
 */

/**
 * Reminder channel types (mirrors Prisma enum)
 */
export type ReminderChannel = 'SMS' | 'EMAIL' | 'VOICE' | 'PUSH';

/**
 * Reminder types
 */
export type ReminderType =
  | 'STANDARD'
  | 'CONFIRMATION'
  | 'FINAL'
  | 'PRE_VISIT'
  | 'FIRST_VISIT'
  | 'FOLLOW_UP';

/**
 * Reminder status
 */
export type ReminderStatus =
  | 'SCHEDULED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'CANCELLED'
  | 'SKIPPED';

/**
 * Confirmation response types
 */
export type ConfirmationResponse =
  | 'CONFIRMED'
  | 'DECLINED'
  | 'RESCHEDULE_REQUESTED'
  | 'NO_RESPONSE';

/**
 * Default reminder timing configuration
 */
export interface ReminderTiming {
  /** Hours before appointment */
  hoursBefore: number;
  /** Type of reminder */
  type: ReminderType;
  /** Channel to use */
  channel: ReminderChannel;
  /** Skip if already confirmed */
  skipIfConfirmed?: boolean;
}

/**
 * Default reminder sequence
 */
export const DEFAULT_REMINDER_SEQUENCE: ReminderTiming[] = [
  {
    hoursBefore: 48, // 2 days before
    type: 'STANDARD',
    channel: 'EMAIL',
    skipIfConfirmed: false,
  },
  {
    hoursBefore: 24, // 1 day before
    type: 'CONFIRMATION',
    channel: 'SMS',
    skipIfConfirmed: false,
  },
  {
    hoursBefore: 2, // 2 hours before
    type: 'FINAL',
    channel: 'SMS',
    skipIfConfirmed: true,
  },
];

/**
 * Reminder scheduling result
 */
export interface ScheduleReminderResult {
  success: boolean;
  reminderId?: string;
  scheduledFor?: Date;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Reminder processing result
 */
export interface ProcessRemindersResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: Array<{
    reminderId: string;
    error: string;
  }>;
}

/**
 * Template variables available for reminders
 */
export interface ReminderVariables {
  patient: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
  };
  appointment: {
    date: string;
    time: string;
    duration: number;
    type: string;
  };
  provider: {
    name: string;
    title?: string;
  };
  clinic: {
    name: string;
    phone?: string;
    address?: string;
  };
  links?: {
    confirm?: string;
    cancel?: string;
    reschedule?: string;
    directions?: string;
  };
}
