import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import {
  recurringAppointmentQuerySchema,
  createRecurringAppointmentSchema,
} from '@/lib/validations/advanced-scheduling';

/**
 * GET /api/booking/recurring
 * List recurring appointment series with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      patientId: searchParams.get('patientId') ?? undefined,
      providerId: searchParams.get('providerId') ?? undefined,
      appointmentTypeId: searchParams.get('appointmentTypeId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      pattern: searchParams.get('pattern') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = recurringAppointmentQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      patientId,
      providerId,
      appointmentTypeId,
      status,
      pattern,
      search,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    // Apply filters
    if (patientId) where.patientId = patientId;
    if (providerId) where.providerId = providerId;
    if (appointmentTypeId) where.appointmentTypeId = appointmentTypeId;
    if (status) where.status = status;
    if (pattern) where.pattern = pattern;

    // Search by patient name
    if (search) {
      where.patient = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Count total
    const total = await db.recurringAppointment.count({ where });

    // Fetch recurring series
    const series = await db.recurringAppointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        appointmentType: {
          select: {
            id: true,
            code: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            occurrences: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: series,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * POST /api/booking/recurring
 * Create a recurring appointment series
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();
    const validationResult = createRecurringAppointmentSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid recurring appointment data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify patient exists
    const patient = await db.patient.findFirst({
      where: {
        id: data.patientId,
        ...getClinicFilter(session),
      },
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: 'Patient not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify provider exists
    const provider = await db.staffProfile.findFirst({
      where: {
        id: data.providerId,
        ...getClinicFilter(session),
        isProvider: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROVIDER_NOT_FOUND',
            message: 'Provider not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify appointment type exists
    const appointmentType = await db.appointmentType.findFirst({
      where: {
        id: data.appointmentTypeId,
        ...getClinicFilter(session),
        isActive: true,
      },
    });

    if (!appointmentType) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPOINTMENT_TYPE_NOT_FOUND',
            message: 'Appointment type not found',
          },
        },
        { status: 404 }
      );
    }

    // Create recurring series
    const recurring = await db.recurringAppointment.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        name: data.name,
        appointmentTypeId: data.appointmentTypeId,
        providerId: data.providerId,
        chairId: data.chairId,
        duration: data.duration,
        preferredTime: data.preferredTime,
        preferredDayOfWeek: data.preferredDayOfWeek,
        pattern: data.pattern,
        interval: data.interval,
        daysOfWeek: data.daysOfWeek,
        dayOfMonth: data.dayOfMonth,
        weekOfMonth: data.weekOfMonth,
        startDate: data.startDate,
        endDate: data.endDate,
        maxOccurrences: data.maxOccurrences,
        notes: data.notes,
        createdBy: session.user.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        appointmentType: {
          select: {
            id: true,
            code: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // Generate initial occurrences (next 3 months or until maxOccurrences)
    const occurrences = await generateOccurrences(recurring, session.user.clinicId);

    return NextResponse.json(
      {
        success: true,
        data: {
          recurring,
          occurrencesGenerated: occurrences.length,
        },
      },
      { status: 201 }
    );
  },
  { permissions: ['booking:write'] }
);

/**
 * Generate occurrences for a recurring appointment series
 */
async function generateOccurrences(
  recurring: {
    id: string;
    pattern: string;
    interval: number;
    daysOfWeek: number[];
    dayOfMonth: number | null;
    weekOfMonth: number | null;
    preferredDayOfWeek: number | null;
    preferredTime: string;
    startDate: Date;
    endDate: Date | null;
    maxOccurrences: number | null;
  },
  clinicId: string
) {
  const occurrences: {
    clinicId: string;
    recurringId: string;
    occurrenceNumber: number;
    scheduledDate: Date;
    scheduledTime: string;
    status: 'PENDING';
  }[] = [];

  const maxDate = recurring.endDate ?? new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 3 months
  const maxCount = recurring.maxOccurrences ?? 52; // Max 1 year of weekly

  let current = new Date(recurring.startDate);
  let count = 0;

  while (current <= maxDate && count < maxCount) {
    let shouldAdd = false;

    switch (recurring.pattern) {
      case 'DAILY':
        shouldAdd = true;
        break;

      case 'WEEKLY':
        // Check if current day is in daysOfWeek
        if (recurring.daysOfWeek.includes(current.getDay())) {
          shouldAdd = true;
        }
        break;

      case 'BIWEEKLY':
        // Check if current day matches and it's the right week
        if (recurring.preferredDayOfWeek !== null && current.getDay() === recurring.preferredDayOfWeek) {
          const weeksSinceStart = Math.floor(
            (current.getTime() - recurring.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
          );
          if (weeksSinceStart % 2 === 0) {
            shouldAdd = true;
          }
        }
        break;

      case 'MONTHLY':
        if (recurring.dayOfMonth !== null && current.getDate() === recurring.dayOfMonth) {
          shouldAdd = true;
        } else if (recurring.weekOfMonth !== null && recurring.preferredDayOfWeek !== null) {
          // Calculate which week of the month we're in
          const firstDayOfMonth = new Date(current.getFullYear(), current.getMonth(), 1);
          const firstTargetDay = new Date(firstDayOfMonth);
          while (firstTargetDay.getDay() !== recurring.preferredDayOfWeek) {
            firstTargetDay.setDate(firstTargetDay.getDate() + 1);
          }

          const targetDate = new Date(firstTargetDay);
          if (recurring.weekOfMonth === -1) {
            // Last occurrence of the day in the month
            while (targetDate.getMonth() === current.getMonth()) {
              targetDate.setDate(targetDate.getDate() + 7);
            }
            targetDate.setDate(targetDate.getDate() - 7); // Go back to last valid
          } else {
            targetDate.setDate(targetDate.getDate() + (recurring.weekOfMonth - 1) * 7);
          }

          if (current.getDate() === targetDate.getDate()) {
            shouldAdd = true;
          }
        }
        break;

      case 'CUSTOM':
        // For custom, use interval weeks with daysOfWeek
        if (recurring.daysOfWeek.includes(current.getDay())) {
          const weeksSinceStart = Math.floor(
            (current.getTime() - recurring.startDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
          );
          if (weeksSinceStart % recurring.interval === 0) {
            shouldAdd = true;
          }
        }
        break;
    }

    if (shouldAdd) {
      count++;
      occurrences.push({
        clinicId,
        recurringId: recurring.id,
        occurrenceNumber: count,
        scheduledDate: new Date(current),
        scheduledTime: recurring.preferredTime,
        status: 'PENDING' as const,
      });
    }

    // Move to next day
    current.setDate(current.getDate() + 1);
  }

  // Bulk create occurrences
  if (occurrences.length > 0) {
    await db.recurringOccurrence.createMany({
      data: occurrences,
    });

    // Update series with count and last generated date
    await db.recurringAppointment.update({
      where: { id: recurring.id },
      data: {
        occurrencesCreated: occurrences.length,
        lastGeneratedDate: occurrences[occurrences.length - 1].scheduledDate,
      },
    });
  }

  return occurrences;
}
