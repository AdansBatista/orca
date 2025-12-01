import type { SeedContext } from '../types';

// ============================================================================
// SCHEDULING SEED DATA
// ============================================================================

const SHIFT_TYPES = ['REGULAR', 'OVERTIME', 'ON_CALL', 'TRAINING', 'MEETING', 'COVERAGE', 'FLOAT'] as const;
const SHIFT_STATUSES = ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
const TIME_OFF_TYPES = [
  'VACATION', 'SICK', 'PERSONAL', 'BEREAVEMENT', 'JURY_DUTY',
  'MILITARY', 'MATERNITY', 'PATERNITY', 'FMLA', 'UNPAID',
  'CONTINUING_EDUCATION', 'HOLIDAY', 'OTHER'
] as const;
const TIME_OFF_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'WITHDRAWN'] as const;
const AVAILABILITY_TYPES = ['AVAILABLE', 'UNAVAILABLE', 'PREFERRED', 'IF_NEEDED', 'BLOCKED'] as const;
const TEMPLATE_TYPES = ['STANDARD', 'EXTENDED_HOURS', 'HOLIDAY', 'SEASONAL', 'CUSTOM'] as const;

// Shift start times (hours)
const SHIFT_START_TIMES = [7, 8, 9, 10, 12, 13, 14];
// Shift durations in hours
const SHIFT_DURATIONS = [4, 6, 8, 10, 12];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function randomItem<T>(array: readonly T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function setTime(date: Date, hours: number, minutes: number): Date {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ============================================================================
// SCHEDULING SEED FUNCTION
// ============================================================================

/**
 * Seed scheduling data for staff profiles.
 * Creates shifts, time-off requests, availability, and templates.
 */
export async function seedScheduling(ctx: SeedContext): Promise<void> {
  const { db, idTracker, logger } = ctx;
  const clinicIds = idTracker.getAll('Clinic');

  logger.startArea('Scheduling');

  let totalShifts = 0;
  let totalTimeOff = 0;
  let totalAvailability = 0;
  let totalTemplates = 0;

  for (const clinicId of clinicIds) {
    const clinic = await db.clinic.findUnique({ where: { id: clinicId } });
    logger.info(`Seeding scheduling for clinic: ${clinic?.name || clinicId}`);

    // Get staff profiles for this clinic
    const staffProfiles = await db.staffProfile.findMany({
      where: { clinicId },
      select: { id: true, firstName: true, lastName: true, isProvider: true, department: true },
    });

    if (staffProfiles.length === 0) {
      logger.warn('  No staff profiles found, skipping scheduling seed');
      continue;
    }

    // Get a user for createdBy
    const existingUserIds = idTracker.getByClinic('User', clinicId);
    const createdBy = existingUserIds.length > 0 ? existingUserIds[0] : undefined;

    // ========================================================================
    // 1. Create Schedule Templates
    // ========================================================================
    const templates = await createScheduleTemplates(db, clinicId, createdBy);
    totalTemplates += templates.length;
    logger.info(`  Created ${templates.length} schedule templates`);

    // ========================================================================
    // 2. Create Staff Shifts (past, current, future)
    // ========================================================================
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonday = getMonday(today);

    for (const staff of staffProfiles) {
      // Create past shifts (last 4 weeks) - mostly COMPLETED
      for (let weekOffset = -4; weekOffset < 0; weekOffset++) {
        const weekStart = addDays(thisMonday, weekOffset * 7);
        const shiftsThisWeek = randomInt(3, 5);

        for (let i = 0; i < shiftsThisWeek; i++) {
          const dayOffset = randomInt(0, 6);
          const shiftDate = addDays(weekStart, dayOffset);
          const startHour = randomItem(SHIFT_START_TIMES);
          const duration = randomItem(SHIFT_DURATIONS);

          const startTime = setTime(shiftDate, startHour, 0);
          const endTime = setTime(shiftDate, startHour + duration, 0);

          // Past shifts are mostly completed
          const status = Math.random() < 0.85 ? 'COMPLETED' :
                        Math.random() < 0.5 ? 'CANCELLED' : 'NO_SHOW';

          await db.staffShift.create({
            data: {
              staffProfileId: staff.id,
              clinicId,
              shiftDate,
              startTime,
              endTime,
              scheduledHours: duration,
              breakMinutes: duration >= 6 ? 30 : 0,
              locationId: clinicId, // Using clinic as location
              shiftType: Math.random() < 0.8 ? 'REGULAR' : randomItem(SHIFT_TYPES),
              status,
              clockIn: status === 'COMPLETED' ? startTime : null,
              clockOut: status === 'COMPLETED' ? endTime : null,
              actualHours: status === 'COMPLETED' ? duration : null,
              notes: null,
              createdBy,
            },
          });
          totalShifts++;
        }
      }

      // Create current week shifts - mix of SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED
      const currentWeekShifts = randomInt(4, 5);
      for (let i = 0; i < currentWeekShifts; i++) {
        const dayOffset = randomInt(0, 6);
        const shiftDate = addDays(thisMonday, dayOffset);
        const startHour = randomItem(SHIFT_START_TIMES);
        const duration = randomItem([6, 8, 10]);

        const startTime = setTime(shiftDate, startHour, 0);
        const endTime = setTime(shiftDate, startHour + duration, 0);

        // Determine status based on whether shift is in past, present, or future
        let status: typeof SHIFT_STATUSES[number] = 'SCHEDULED';
        const now = new Date();
        if (shiftDate < today) {
          status = 'COMPLETED';
        } else if (shiftDate.toDateString() === today.toDateString()) {
          if (startTime < now && endTime > now) {
            status = 'IN_PROGRESS';
          } else if (endTime < now) {
            status = 'COMPLETED';
          } else {
            status = 'CONFIRMED';
          }
        } else {
          status = Math.random() < 0.7 ? 'CONFIRMED' : 'SCHEDULED';
        }

        await db.staffShift.create({
          data: {
            staffProfileId: staff.id,
            clinicId,
            shiftDate,
            startTime,
            endTime,
            scheduledHours: duration,
            breakMinutes: 30,
            locationId: clinicId,
            shiftType: 'REGULAR',
            status,
            clockIn: ['COMPLETED', 'IN_PROGRESS'].includes(status) ? startTime : null,
            clockOut: status === 'COMPLETED' ? endTime : null,
            actualHours: status === 'COMPLETED' ? duration : null,
            createdBy,
          },
        });
        totalShifts++;
      }

      // Create future shifts (next 3 weeks) - SCHEDULED or CONFIRMED
      for (let weekOffset = 1; weekOffset <= 3; weekOffset++) {
        const weekStart = addDays(thisMonday, weekOffset * 7);
        const shiftsThisWeek = randomInt(4, 5);

        for (let i = 0; i < shiftsThisWeek; i++) {
          const dayOffset = randomInt(0, 5); // Mon-Sat
          const shiftDate = addDays(weekStart, dayOffset);
          const startHour = randomItem([8, 9, 10]);
          const duration = randomItem([6, 8]);

          const startTime = setTime(shiftDate, startHour, 0);
          const endTime = setTime(shiftDate, startHour + duration, 0);

          await db.staffShift.create({
            data: {
              staffProfileId: staff.id,
              clinicId,
              shiftDate,
              startTime,
              endTime,
              scheduledHours: duration,
              breakMinutes: 30,
              locationId: clinicId,
              shiftType: 'REGULAR',
              status: weekOffset === 1 ? 'CONFIRMED' : 'SCHEDULED',
              createdBy,
            },
          });
          totalShifts++;
        }
      }
    }
    logger.info(`  Created ${totalShifts} shifts`);

    // ========================================================================
    // 3. Create Time-Off Requests (various statuses)
    // ========================================================================
    for (const staff of staffProfiles) {
      // Each staff member gets 1-4 time-off requests
      const requestCount = randomInt(1, 4);

      for (let i = 0; i < requestCount; i++) {
        // Vary the timing: past, current, future
        const scenario = randomItem(['past_approved', 'past_rejected', 'pending', 'future_approved', 'future_pending', 'cancelled']);

        let startDate: Date;
        let endDate: Date;
        let status: typeof TIME_OFF_STATUSES[number];
        let reviewedBy: string | null = null;
        let reviewedAt: Date | null = null;
        let rejectionReason: string | null = null;

        switch (scenario) {
          case 'past_approved':
            startDate = addDays(today, -randomInt(14, 60));
            endDate = addDays(startDate, randomInt(1, 5));
            status = 'APPROVED';
            reviewedBy = createdBy || null;
            reviewedAt = addDays(startDate, -randomInt(7, 14));
            break;
          case 'past_rejected':
            startDate = addDays(today, -randomInt(14, 60));
            endDate = addDays(startDate, randomInt(1, 5));
            status = 'REJECTED';
            reviewedBy = createdBy || null;
            reviewedAt = addDays(startDate, -randomInt(7, 14));
            rejectionReason = randomItem([
              'Insufficient coverage during requested period',
              'Conflicts with team schedule',
              'Request submitted too late',
              'Critical project deadline',
            ]);
            break;
          case 'pending':
            startDate = addDays(today, randomInt(7, 30));
            endDate = addDays(startDate, randomInt(1, 7));
            status = 'PENDING';
            break;
          case 'future_approved':
            startDate = addDays(today, randomInt(14, 60));
            endDate = addDays(startDate, randomInt(1, 10));
            status = 'APPROVED';
            reviewedBy = createdBy || null;
            reviewedAt = addDays(today, -randomInt(1, 14));
            break;
          case 'future_pending':
            startDate = addDays(today, randomInt(30, 90));
            endDate = addDays(startDate, randomInt(1, 14));
            status = 'PENDING';
            break;
          case 'cancelled':
            startDate = addDays(today, randomInt(-30, 30));
            endDate = addDays(startDate, randomInt(1, 5));
            status = Math.random() < 0.5 ? 'CANCELLED' : 'WITHDRAWN';
            break;
          default:
            startDate = addDays(today, randomInt(7, 30));
            endDate = addDays(startDate, randomInt(1, 5));
            status = 'PENDING';
        }

        const requestType = randomItem(TIME_OFF_TYPES);
        const isPartialDay = Math.random() < 0.15;

        // Calculate total days
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        await db.timeOffRequest.create({
          data: {
            staffProfileId: staff.id,
            clinicId,
            requestType,
            startDate,
            endDate,
            totalDays,
            totalHours: isPartialDay ? 4 : totalDays * 8,
            isPartialDay,
            partialStartTime: isPartialDay ? setTime(startDate, 8, 0) : null,
            partialEndTime: isPartialDay ? setTime(startDate, 12, 0) : null,
            status,
            reason: randomItem([
              'Family vacation',
              'Medical appointment',
              'Personal matters',
              'Wedding attendance',
              'Home repairs',
              'Child care',
              'Mental health day',
              null,
            ]),
            notes: Math.random() < 0.3 ? 'Additional notes for the request' : null,
            reviewedBy,
            reviewedAt,
            approvalNotes: status === 'APPROVED' && Math.random() < 0.3 ? 'Approved - coverage arranged' : null,
            rejectionReason,
            coverageRequired: Math.random() < 0.7,
          },
        });
        totalTimeOff++;
      }
    }
    logger.info(`  Created ${totalTimeOff} time-off requests`);

    // ========================================================================
    // 4. Create Staff Availability
    // ========================================================================
    for (const staff of staffProfiles) {
      // Recurring weekly availability (each staff has preferred/unavailable times)
      const availabilityCount = randomInt(2, 5);

      for (let i = 0; i < availabilityCount; i++) {
        const isRecurring = Math.random() < 0.7;
        const availabilityType = randomItem(AVAILABILITY_TYPES);

        if (isRecurring) {
          // Weekly recurring availability
          const dayOfWeek = randomInt(0, 6);
          const startHour = randomInt(6, 12);
          const endHour = startHour + randomInt(4, 10);

          await db.staffAvailability.create({
            data: {
              staffProfileId: staff.id,
              clinicId,
              availabilityType,
              isRecurring: true,
              dayOfWeek,
              startTime: `${startHour.toString().padStart(2, '0')}:00`,
              endTime: `${Math.min(endHour, 22).toString().padStart(2, '0')}:00`,
              allDay: Math.random() < 0.2,
              locationId: clinicId,
              effectiveFrom: addDays(today, -90),
              effectiveUntil: null,
              reason: availabilityType === 'UNAVAILABLE' ? randomItem([
                'School pickup',
                'Second job',
                'Personal commitment',
                'Medical appointment (recurring)',
              ]) : null,
              isActive: true,
            },
          });
        } else {
          // Specific date availability
          const specificDate = addDays(today, randomInt(-30, 60));

          await db.staffAvailability.create({
            data: {
              staffProfileId: staff.id,
              clinicId,
              availabilityType,
              isRecurring: false,
              specificDate,
              allDay: Math.random() < 0.4,
              startTime: Math.random() < 0.4 ? null : '09:00',
              endTime: Math.random() < 0.4 ? null : '17:00',
              locationId: clinicId,
              reason: randomItem([
                'Doctor appointment',
                'Family event',
                'Vehicle maintenance',
                'Moving day',
                null,
              ]),
              isActive: true,
            },
          });
        }
        totalAvailability++;
      }
    }
    logger.info(`  Created ${totalAvailability} availability records`);

    // ========================================================================
    // 5. Create Coverage Requirements
    // ========================================================================
    const departments = ['Clinical', 'Front Office', 'Billing'];
    for (const dept of departments) {
      // Morning coverage
      await db.coverageRequirement.create({
        data: {
          clinicId,
          locationId: clinicId,
          name: `${dept} - Morning`,
          description: `Minimum staffing for ${dept.toLowerCase()} in the morning`,
          department: dept,
          minimumStaff: dept === 'Clinical' ? 3 : 1,
          optimalStaff: dept === 'Clinical' ? 5 : 2,
          maximumStaff: dept === 'Clinical' ? 8 : 3,
          dayOfWeek: null, // All days
          startTime: '08:00',
          endTime: '12:00',
          priority: dept === 'Clinical' ? 1 : 2,
          isCritical: dept === 'Clinical',
          isActive: true,
        },
      });

      // Afternoon coverage
      await db.coverageRequirement.create({
        data: {
          clinicId,
          locationId: clinicId,
          name: `${dept} - Afternoon`,
          description: `Minimum staffing for ${dept.toLowerCase()} in the afternoon`,
          department: dept,
          minimumStaff: dept === 'Clinical' ? 3 : 1,
          optimalStaff: dept === 'Clinical' ? 5 : 2,
          maximumStaff: dept === 'Clinical' ? 8 : 3,
          dayOfWeek: null,
          startTime: '12:00',
          endTime: '18:00',
          priority: dept === 'Clinical' ? 1 : 2,
          isCritical: dept === 'Clinical',
          isActive: true,
        },
      });
    }
    logger.info('  Created coverage requirements');

    // ========================================================================
    // 6. Create Overtime Logs
    // ========================================================================
    // Create overtime records for some staff in past weeks
    for (const staff of staffProfiles.slice(0, Math.min(3, staffProfiles.length))) {
      for (let weekOffset = -4; weekOffset <= -1; weekOffset++) {
        if (Math.random() < 0.3) { // 30% chance of overtime
          const weekStart = addDays(thisMonday, weekOffset * 7);
          const weekEnd = addDays(weekStart, 6);
          const regularHours = 40;
          const overtimeHours = randomInt(2, 12);

          await db.overtimeLog.create({
            data: {
              staffProfileId: staff.id,
              clinicId,
              weekStartDate: weekStart,
              weekEndDate: weekEnd,
              regularHours,
              overtimeHours,
              totalHours: regularHours + overtimeHours,
              status: randomItem(['APPROVED', 'APPROVED', 'PAID']),
              preApproved: Math.random() < 0.3,
              approvedBy: createdBy || null,
              approvedAt: addDays(weekEnd, randomInt(1, 3)),
              reason: randomItem([
                'Patient emergency',
                'Staff shortage',
                'End of month procedures',
                'Training session',
              ]),
            },
          });
        }
      }
    }
    logger.info('  Created overtime logs');
  }

  logger.endArea('Scheduling', totalShifts + totalTimeOff + totalAvailability + totalTemplates);
}

/**
 * Create schedule templates for a clinic
 * Templates are linked to employment types for easy assignment
 */
async function createScheduleTemplates(
  db: SeedContext['db'],
  clinicId: string,
  createdBy?: string
) {
  const templates = [];

  // ========================================================================
  // Full-Time Templates
  // ========================================================================

  // Full-Time Standard (default for FULL_TIME)
  const fullTimeStandard = await db.scheduleTemplate.create({
    data: {
      clinicId,
      name: 'Full-Time Standard',
      description: 'Standard 40-hour week for full-time employees (Mon-Fri 8am-5pm)',
      templateType: 'STANDARD',
      periodType: 'WEEKLY',
      employmentType: 'FULL_TIME',
      isActive: true,
      isDefault: true,
      shifts: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '17:00', breakMinutes: 60, shiftType: 'REGULAR' },
        { dayOfWeek: 2, startTime: '08:00', endTime: '17:00', breakMinutes: 60, shiftType: 'REGULAR' },
        { dayOfWeek: 3, startTime: '08:00', endTime: '17:00', breakMinutes: 60, shiftType: 'REGULAR' },
        { dayOfWeek: 4, startTime: '08:00', endTime: '17:00', breakMinutes: 60, shiftType: 'REGULAR' },
        { dayOfWeek: 5, startTime: '08:00', endTime: '17:00', breakMinutes: 60, shiftType: 'REGULAR' },
      ],
      createdBy,
    },
  });
  templates.push(fullTimeStandard);

  // Full-Time Extended Hours
  const fullTimeExtended = await db.scheduleTemplate.create({
    data: {
      clinicId,
      name: 'Full-Time Extended',
      description: 'Extended hours schedule for full-time employees (Mon-Fri 10am-7pm)',
      templateType: 'EXTENDED_HOURS',
      periodType: 'WEEKLY',
      employmentType: 'FULL_TIME',
      isActive: true,
      isDefault: false,
      shifts: [
        { dayOfWeek: 1, startTime: '10:00', endTime: '19:00', breakMinutes: 60, shiftType: 'REGULAR' },
        { dayOfWeek: 2, startTime: '10:00', endTime: '19:00', breakMinutes: 60, shiftType: 'REGULAR' },
        { dayOfWeek: 3, startTime: '10:00', endTime: '19:00', breakMinutes: 60, shiftType: 'REGULAR' },
        { dayOfWeek: 4, startTime: '10:00', endTime: '19:00', breakMinutes: 60, shiftType: 'REGULAR' },
        { dayOfWeek: 5, startTime: '10:00', endTime: '19:00', breakMinutes: 60, shiftType: 'REGULAR' },
      ],
      createdBy,
    },
  });
  templates.push(fullTimeExtended);

  // ========================================================================
  // Part-Time Templates
  // ========================================================================

  // Part-Time Morning (default for PART_TIME)
  const partTimeMorning = await db.scheduleTemplate.create({
    data: {
      clinicId,
      name: 'Part-Time Morning',
      description: 'Morning schedule for part-time staff (Mon/Wed/Fri 8am-1pm)',
      templateType: 'STANDARD',
      periodType: 'WEEKLY',
      employmentType: 'PART_TIME',
      isActive: true,
      isDefault: true,
      shifts: [
        { dayOfWeek: 1, startTime: '08:00', endTime: '13:00', breakMinutes: 0, shiftType: 'REGULAR' },
        { dayOfWeek: 3, startTime: '08:00', endTime: '13:00', breakMinutes: 0, shiftType: 'REGULAR' },
        { dayOfWeek: 5, startTime: '08:00', endTime: '13:00', breakMinutes: 0, shiftType: 'REGULAR' },
      ],
      createdBy,
    },
  });
  templates.push(partTimeMorning);

  // Part-Time Afternoon
  const partTimeAfternoon = await db.scheduleTemplate.create({
    data: {
      clinicId,
      name: 'Part-Time Afternoon',
      description: 'Afternoon schedule for part-time staff (Tue/Thu 1pm-6pm)',
      templateType: 'STANDARD',
      periodType: 'WEEKLY',
      employmentType: 'PART_TIME',
      isActive: true,
      isDefault: false,
      shifts: [
        { dayOfWeek: 2, startTime: '13:00', endTime: '18:00', breakMinutes: 0, shiftType: 'REGULAR' },
        { dayOfWeek: 4, startTime: '13:00', endTime: '18:00', breakMinutes: 0, shiftType: 'REGULAR' },
      ],
      createdBy,
    },
  });
  templates.push(partTimeAfternoon);

  // ========================================================================
  // Temporary Staff Templates
  // ========================================================================

  // Temporary Standard (default for TEMP)
  const tempStandard = await db.scheduleTemplate.create({
    data: {
      clinicId,
      name: 'Temporary Standard',
      description: 'Standard schedule for temporary employees (Mon-Fri 9am-5pm)',
      templateType: 'STANDARD',
      periodType: 'WEEKLY',
      employmentType: 'TEMP',
      isActive: true,
      isDefault: true,
      shifts: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '17:00', breakMinutes: 30, shiftType: 'REGULAR' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '17:00', breakMinutes: 30, shiftType: 'REGULAR' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '17:00', breakMinutes: 30, shiftType: 'REGULAR' },
        { dayOfWeek: 4, startTime: '09:00', endTime: '17:00', breakMinutes: 30, shiftType: 'REGULAR' },
        { dayOfWeek: 5, startTime: '09:00', endTime: '17:00', breakMinutes: 30, shiftType: 'REGULAR' },
      ],
      createdBy,
    },
  });
  templates.push(tempStandard);

  // ========================================================================
  // Custom Templates (for any employment type)
  // ========================================================================

  // Saturday Coverage
  const saturdayCoverage = await db.scheduleTemplate.create({
    data: {
      clinicId,
      name: 'Saturday Coverage',
      description: 'Saturday-only schedule for weekend coverage (Sat 9am-2pm)',
      templateType: 'CUSTOM',
      periodType: 'WEEKLY',
      employmentType: null, // Any employment type
      isActive: true,
      isDefault: false,
      shifts: [
        { dayOfWeek: 6, startTime: '09:00', endTime: '14:00', breakMinutes: 0, shiftType: 'COVERAGE' },
      ],
      createdBy,
    },
  });
  templates.push(saturdayCoverage);

  // Holiday Week Template
  const holidayWeek = await db.scheduleTemplate.create({
    data: {
      clinicId,
      name: 'Holiday Week',
      description: 'Reduced schedule for holiday weeks (Mon-Wed 9am-3pm)',
      templateType: 'HOLIDAY',
      periodType: 'WEEKLY',
      employmentType: null, // Any employment type
      isActive: true,
      isDefault: false,
      shifts: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '15:00', breakMinutes: 30, shiftType: 'REGULAR' },
        { dayOfWeek: 2, startTime: '09:00', endTime: '15:00', breakMinutes: 30, shiftType: 'REGULAR' },
        { dayOfWeek: 3, startTime: '09:00', endTime: '15:00', breakMinutes: 30, shiftType: 'REGULAR' },
      ],
      createdBy,
    },
  });
  templates.push(holidayWeek);

  // 4-Day Week Template
  const fourDayWeek = await db.scheduleTemplate.create({
    data: {
      clinicId,
      name: '4-Day Week (10hr)',
      description: 'Four 10-hour days (Mon-Thu 7am-6pm)',
      templateType: 'CUSTOM',
      periodType: 'WEEKLY',
      employmentType: 'FULL_TIME',
      isActive: true,
      isDefault: false,
      shifts: [
        { dayOfWeek: 1, startTime: '07:00', endTime: '18:00', breakMinutes: 60, shiftType: 'REGULAR' },
        { dayOfWeek: 2, startTime: '07:00', endTime: '18:00', breakMinutes: 60, shiftType: 'REGULAR' },
        { dayOfWeek: 3, startTime: '07:00', endTime: '18:00', breakMinutes: 60, shiftType: 'REGULAR' },
        { dayOfWeek: 4, startTime: '07:00', endTime: '18:00', breakMinutes: 60, shiftType: 'REGULAR' },
      ],
      createdBy,
    },
  });
  templates.push(fourDayWeek);

  return templates;
}

/**
 * Clear all scheduling data
 */
export async function clearScheduling(ctx: SeedContext): Promise<void> {
  const { db, logger } = ctx;

  logger.info('Clearing scheduling data...');

  // Clear in correct order due to foreign keys
  await db.overtimeLog.deleteMany({});
  await db.shiftSwapRequest.deleteMany({});
  await db.staffShift.deleteMany({});
  await db.timeOffRequest.deleteMany({});
  await db.staffAvailability.deleteMany({});
  await db.coverageRequirement.deleteMany({});
  await db.scheduleTemplate.deleteMany({});

  logger.info('Scheduling data cleared');
}
