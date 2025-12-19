import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { updateOccurrenceSchema } from '@/lib/validations/advanced-scheduling';

/**
 * GET /api/booking/recurring/[id]/occurrences
 * Get all occurrences for a recurring appointment series
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    // Optional filters
    const status = searchParams.get('status') ?? undefined;
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') ?? '50', 10);

    // Verify recurring exists and belongs to clinic
    const recurring = await db.recurringAppointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!recurring) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RECURRING_NOT_FOUND',
            message: 'Recurring appointment series not found',
          },
        },
        { status: 404 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {
      recurringId: id,
      ...getClinicFilter(session),
    };

    if (status) {
      where.status = status;
    }

    if (fromDate || toDate) {
      const dateFilter: Record<string, Date> = {};
      if (fromDate) dateFilter.gte = new Date(fromDate);
      if (toDate) dateFilter.lte = new Date(toDate);
      where.scheduledDate = dateFilter;
    }

    // Count total
    const total = await db.recurringOccurrence.count({ where });

    // Fetch occurrences
    const occurrences = await db.recurringOccurrence.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Get related appointments for scheduled occurrences
    const scheduledIds = occurrences
      .filter((o) => o.appointmentId)
      .map((o) => o.appointmentId as string);

    let appointments: Record<string, unknown> = {};
    if (scheduledIds.length > 0) {
      const appts = await db.appointment.findMany({
        where: {
          id: { in: scheduledIds },
        },
        select: {
          id: true,
          status: true,
          startTime: true,
          endTime: true,
          confirmationStatus: true,
        },
      });

      appointments = appts.reduce((acc, apt) => {
        acc[apt.id] = apt;
        return acc;
      }, {} as Record<string, unknown>);
    }

    // Enrich occurrences with appointment data
    const enrichedOccurrences = occurrences.map((occ) => ({
      ...occ,
      appointment: occ.appointmentId ? appointments[occ.appointmentId] : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: enrichedOccurrences,
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
 * PUT /api/booking/recurring/[id]/occurrences
 * Update a specific occurrence (by occurrence number in body)
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const occurrenceNumber = body.occurrenceNumber;
    if (!occurrenceNumber) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'occurrenceNumber is required',
          },
        },
        { status: 400 }
      );
    }

    const validationResult = updateOccurrenceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid occurrence data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify recurring exists and belongs to clinic
    const recurring = await db.recurringAppointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!recurring) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RECURRING_NOT_FOUND',
            message: 'Recurring appointment series not found',
          },
        },
        { status: 404 }
      );
    }

    // Find the occurrence
    const occurrence = await db.recurringOccurrence.findFirst({
      where: {
        recurringId: id,
        occurrenceNumber,
        ...getClinicFilter(session),
      },
    });

    if (!occurrence) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OCCURRENCE_NOT_FOUND',
            message: 'Occurrence not found',
          },
        },
        { status: 404 }
      );
    }

    // Can't modify past occurrences that are already scheduled
    if (occurrence.status === 'SCHEDULED' && occurrence.scheduledDate < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CANNOT_MODIFY_PAST',
            message: 'Cannot modify past scheduled occurrences',
          },
        },
        { status: 400 }
      );
    }

    // Update occurrence
    const updated = await db.recurringOccurrence.update({
      where: { id: occurrence.id },
      data: {
        ...data,
        isModified: true,
        modifiedAt: new Date(),
        modifiedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  },
  { permissions: ['booking:write'] }
);

/**
 * POST /api/booking/recurring/[id]/occurrences
 * Create appointment from a pending occurrence
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const occurrenceNumber = body.occurrenceNumber;
    if (!occurrenceNumber) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'occurrenceNumber is required',
          },
        },
        { status: 400 }
      );
    }

    // Verify recurring exists and belongs to clinic
    const recurring = await db.recurringAppointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!recurring) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RECURRING_NOT_FOUND',
            message: 'Recurring appointment series not found',
          },
        },
        { status: 404 }
      );
    }

    // Find the occurrence
    const occurrence = await db.recurringOccurrence.findFirst({
      where: {
        recurringId: id,
        occurrenceNumber,
        status: 'PENDING',
        ...getClinicFilter(session),
      },
    });

    if (!occurrence) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OCCURRENCE_NOT_FOUND',
            message: 'Pending occurrence not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if occurrence is in the past
    if (occurrence.scheduledDate < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OCCURRENCE_IN_PAST',
            message: 'Cannot create appointment for past occurrence',
          },
        },
        { status: 400 }
      );
    }

    // Build appointment start/end times
    const [hour, minute] = occurrence.scheduledTime.split(':').map(Number);
    const startTime = new Date(occurrence.scheduledDate);
    startTime.setHours(hour, minute, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + recurring.duration);

    // Check for conflicts
    const conflict = await db.appointment.findFirst({
      where: {
        providerId: recurring.providerId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        ...getClinicFilter(session),
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
    });

    if (conflict) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'Time slot has a conflict with an existing appointment',
            details: {
              conflictingAppointmentId: conflict.id,
            },
          },
        },
        { status: 409 }
      );
    }

    // Create appointment
    const appointment = await db.appointment.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: recurring.patientId,
        appointmentTypeId: recurring.appointmentTypeId,
        providerId: recurring.providerId,
        chairId: recurring.chairId,
        startTime,
        endTime,
        duration: recurring.duration,
        status: 'SCHEDULED',
        source: 'TREATMENT_PLAN',
        bookedBy: session.user.id,
        notes: recurring.notes,
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
            name: true,
            color: true,
          },
        },
      },
    });

    // Update occurrence status
    await db.recurringOccurrence.update({
      where: { id: occurrence.id },
      data: {
        status: 'SCHEDULED',
        appointmentId: appointment.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: appointment,
    });
  },
  { permissions: ['booking:write'] }
);
