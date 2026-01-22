import type {
  ScheduleBlockType,
  BookingTemplateType,
  RecurrencePattern,
} from '@prisma/client';

// =============================================================================
// DEFAULT PROVIDER SCHEDULES
// =============================================================================

interface ProviderScheduleData {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
  lunchStartTime: string | null;
  lunchEndTime: string | null;
  autoBlockLunch: boolean;
}

// Standard weekday schedule (Mon-Fri 8am-5pm)
export const DEFAULT_WEEKDAY_SCHEDULES: ProviderScheduleData[] = [
  // Sunday - not working
  { dayOfWeek: 0, startTime: '08:00', endTime: '17:00', isWorkingDay: false, lunchStartTime: null, lunchEndTime: null, autoBlockLunch: false },
  // Monday
  { dayOfWeek: 1, startTime: '08:00', endTime: '17:00', isWorkingDay: true, lunchStartTime: '12:00', lunchEndTime: '13:00', autoBlockLunch: true },
  // Tuesday
  { dayOfWeek: 2, startTime: '08:00', endTime: '17:00', isWorkingDay: true, lunchStartTime: '12:00', lunchEndTime: '13:00', autoBlockLunch: true },
  // Wednesday
  { dayOfWeek: 3, startTime: '08:00', endTime: '17:00', isWorkingDay: true, lunchStartTime: '12:00', lunchEndTime: '13:00', autoBlockLunch: true },
  // Thursday
  { dayOfWeek: 4, startTime: '08:00', endTime: '17:00', isWorkingDay: true, lunchStartTime: '12:00', lunchEndTime: '13:00', autoBlockLunch: true },
  // Friday
  { dayOfWeek: 5, startTime: '08:00', endTime: '16:00', isWorkingDay: true, lunchStartTime: '12:00', lunchEndTime: '13:00', autoBlockLunch: true },
  // Saturday - not working
  { dayOfWeek: 6, startTime: '09:00', endTime: '13:00', isWorkingDay: false, lunchStartTime: null, lunchEndTime: null, autoBlockLunch: false },
];

// Extended schedule for some providers (includes Saturday)
export const EXTENDED_SCHEDULES: ProviderScheduleData[] = [
  ...DEFAULT_WEEKDAY_SCHEDULES.slice(0, 6),
  // Saturday - working half day
  { dayOfWeek: 6, startTime: '09:00', endTime: '13:00', isWorkingDay: true, lunchStartTime: null, lunchEndTime: null, autoBlockLunch: false },
];

// =============================================================================
// SAMPLE SCHEDULE BLOCKS
// =============================================================================

interface ScheduleBlockData {
  title: string;
  blockType: ScheduleBlockType;
  reason: string | null;
  daysFromNow: number;
  startHour: number;
  endHour: number;
  allDay: boolean;
}

export const SAMPLE_SCHEDULE_BLOCKS: ScheduleBlockData[] = [
  // Staff meeting every Wednesday 8-9am
  {
    title: 'Weekly Staff Meeting',
    blockType: 'MEETING',
    reason: 'Mandatory team meeting',
    daysFromNow: 3, // Next Wednesday (approx)
    startHour: 8,
    endHour: 9,
    allDay: false,
  },
  // Training session
  {
    title: 'Invisalign Certification Training',
    blockType: 'TRAINING',
    reason: 'Annual certification renewal',
    daysFromNow: 14,
    startHour: 9,
    endHour: 12,
    allDay: false,
  },
  // Vacation (all day)
  {
    title: 'Vacation',
    blockType: 'VACATION',
    reason: 'Annual leave',
    daysFromNow: 30,
    startHour: 0,
    endHour: 0,
    allDay: true,
  },
  // Admin time
  {
    title: 'Chart Review & Documentation',
    blockType: 'ADMIN_TIME',
    reason: 'Patient chart updates',
    daysFromNow: 2,
    startHour: 16,
    endHour: 17,
    allDay: false,
  },
];

/**
 * Generate schedule blocks for a provider
 */
export function generateScheduleBlocks(
  clinicId: string,
  providerId: string,
  createdBy: string
) {
  const blocks = [];
  const now = new Date();

  for (const blockData of SAMPLE_SCHEDULE_BLOCKS) {
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + blockData.daysFromNow);

    if (blockData.allDay) {
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate.setHours(blockData.startHour, 0, 0, 0);
    }

    const endDate = new Date(startDate);
    if (blockData.allDay) {
      endDate.setHours(23, 59, 59, 999);
    } else {
      endDate.setHours(blockData.endHour, 0, 0, 0);
    }

    blocks.push({
      clinicId,
      providerId,
      title: blockData.title,
      blockType: blockData.blockType,
      reason: blockData.reason,
      startDateTime: startDate,
      endDateTime: endDate,
      allDay: blockData.allDay,
      status: 'ACTIVE' as const,
      requiresApproval: ['VACATION', 'PERSONAL', 'SICK_LEAVE'].includes(blockData.blockType),
      notifyPatients: false,
      createdBy,
    });
  }

  return blocks;
}

// =============================================================================
// DEFAULT BOOKING TEMPLATES
// =============================================================================

interface BookingTemplateData {
  name: string;
  description: string;
  templateType: BookingTemplateType;
  slots: Array<{
    startTime: string;
    endTime: string;
    dayOfWeek?: number;
    label?: string;
    isBlocked?: boolean;
  }>;
}

export const DEFAULT_BOOKING_TEMPLATES: BookingTemplateData[] = [
  {
    name: 'Standard Day',
    description: 'Standard 30-minute appointment slots throughout the day',
    templateType: 'DAY',
    slots: [
      { startTime: '08:00', endTime: '08:30', label: 'Morning slot' },
      { startTime: '08:30', endTime: '09:00' },
      { startTime: '09:00', endTime: '09:30' },
      { startTime: '09:30', endTime: '10:00' },
      { startTime: '10:00', endTime: '10:30' },
      { startTime: '10:30', endTime: '11:00' },
      { startTime: '11:00', endTime: '11:30' },
      { startTime: '11:30', endTime: '12:00' },
      // Lunch blocked
      { startTime: '12:00', endTime: '13:00', label: 'Lunch', isBlocked: true },
      // Afternoon
      { startTime: '13:00', endTime: '13:30' },
      { startTime: '13:30', endTime: '14:00' },
      { startTime: '14:00', endTime: '14:30' },
      { startTime: '14:30', endTime: '15:00' },
      { startTime: '15:00', endTime: '15:30' },
      { startTime: '15:30', endTime: '16:00' },
      { startTime: '16:00', endTime: '16:30' },
      { startTime: '16:30', endTime: '17:00' },
    ],
  },
  {
    name: 'New Patient Day',
    description: 'Extended slots for new patient consultations',
    templateType: 'DAY',
    slots: [
      { startTime: '08:00', endTime: '09:00', label: 'New Patient Consult' },
      { startTime: '09:00', endTime: '09:30' },
      { startTime: '09:30', endTime: '10:00' },
      { startTime: '10:00', endTime: '11:00', label: 'New Patient Consult' },
      { startTime: '11:00', endTime: '12:00', label: 'New Patient Consult' },
      { startTime: '12:00', endTime: '13:00', label: 'Lunch', isBlocked: true },
      { startTime: '13:00', endTime: '14:00', label: 'New Patient Consult' },
      { startTime: '14:00', endTime: '14:30' },
      { startTime: '14:30', endTime: '15:00' },
      { startTime: '15:00', endTime: '16:00', label: 'New Patient Consult' },
      { startTime: '16:00', endTime: '17:00', label: 'New Patient Consult' },
    ],
  },
  {
    name: 'Half Day AM',
    description: 'Morning only schedule',
    templateType: 'HALF_DAY_AM',
    slots: [
      { startTime: '08:00', endTime: '08:30' },
      { startTime: '08:30', endTime: '09:00' },
      { startTime: '09:00', endTime: '09:30' },
      { startTime: '09:30', endTime: '10:00' },
      { startTime: '10:00', endTime: '10:30' },
      { startTime: '10:30', endTime: '11:00' },
      { startTime: '11:00', endTime: '11:30' },
      { startTime: '11:30', endTime: '12:00' },
    ],
  },
];

// =============================================================================
// SAMPLE RECURRING APPOINTMENTS
// =============================================================================

interface RecurringAppointmentData {
  name: string;
  pattern: RecurrencePattern;
  interval: number;
  daysOfWeek: number[];
  preferredTime: string;
  duration: number;
  maxOccurrences: number;
}

export const SAMPLE_RECURRING_PATTERNS: RecurringAppointmentData[] = [
  {
    name: 'Monthly Adjustment',
    pattern: 'MONTHLY',
    interval: 1,
    daysOfWeek: [],
    preferredTime: '09:00',
    duration: 30,
    maxOccurrences: 12, // 1 year
  },
  {
    name: 'Bi-weekly Check',
    pattern: 'BIWEEKLY',
    interval: 2,
    daysOfWeek: [2], // Tuesday
    preferredTime: '14:00',
    duration: 30,
    maxOccurrences: 12, // 6 months
  },
  {
    name: 'Weekly Tray Change',
    pattern: 'WEEKLY',
    interval: 1,
    daysOfWeek: [1, 3, 5], // Mon, Wed, Fri options
    preferredTime: '10:00',
    duration: 15,
    maxOccurrences: 24, // 6 months
  },
];

/**
 * Generate recurring appointments for testing
 */
export function generateRecurringAppointments(
  clinicId: string,
  patientIds: string[],
  providerIds: string[],
  appointmentTypeMap: Map<string, string>,
  createdBy: string
) {
  const recurring = [];
  const now = new Date();

  // Create a few recurring series for different patients
  const adjustmentTypeId = appointmentTypeMap.get('ADJ') || appointmentTypeMap.values().next().value;

  for (let i = 0; i < Math.min(3, patientIds.length); i++) {
    const pattern = SAMPLE_RECURRING_PATTERNS[i % SAMPLE_RECURRING_PATTERNS.length];
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() + 7); // Start next week
    startDate.setHours(0, 0, 0, 0);

    recurring.push({
      clinicId,
      patientId: patientIds[i],
      providerId: providerIds[i % providerIds.length],
      name: pattern.name,
      appointmentTypeId: adjustmentTypeId,
      duration: pattern.duration,
      preferredTime: pattern.preferredTime,
      preferredDayOfWeek: pattern.daysOfWeek[0] ?? 1,
      pattern: pattern.pattern,
      interval: pattern.interval,
      daysOfWeek: pattern.daysOfWeek,
      dayOfMonth: pattern.pattern === 'MONTHLY' ? 15 : null,
      weekOfMonth: null,
      startDate,
      endDate: null,
      maxOccurrences: pattern.maxOccurrences,
      status: 'ACTIVE' as const,
      notes: `Auto-generated ${pattern.name} series`,
      createdBy,
    });
  }

  return recurring;
}
