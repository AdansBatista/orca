import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { createWaitlistEntrySchema, waitlistQuerySchema } from '@/lib/validations/waitlist';

/**
 * GET /api/booking/waitlist
 * List waitlist entries with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      patientId: searchParams.get('patientId') ?? undefined,
      appointmentTypeId: searchParams.get('appointmentTypeId') ?? undefined,
      preferredProviderId: searchParams.get('preferredProviderId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      dateRangeStart: searchParams.get('dateRangeStart') ?? undefined,
      dateRangeEnd: searchParams.get('dateRangeEnd') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = waitlistQuerySchema.safeParse(rawParams);

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
      appointmentTypeId,
      preferredProviderId,
      status,
      priority,
      dateRangeStart,
      dateRangeEnd,
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
    if (appointmentTypeId) where.appointmentTypeId = appointmentTypeId;
    if (preferredProviderId) where.preferredProviderId = preferredProviderId;
    if (status) where.status = status;
    if (priority) where.priority = priority;

    // Date range filter for preferences
    if (dateRangeStart || dateRangeEnd) {
      where.OR = [
        // Entries with no date preference (match all dates)
        { dateRangeStart: null, dateRangeEnd: null },
        // Entries with overlapping date range
        {
          AND: [
            dateRangeStart ? { dateRangeEnd: { gte: dateRangeStart } } : {},
            dateRangeEnd ? { dateRangeStart: { lte: dateRangeEnd } } : {},
          ],
        },
      ];
    }

    // Build order by
    let orderBy: Record<string, string> = {};
    if (sortBy === 'patientName') {
      // Will be sorted in-memory after fetch
      orderBy = { addedAt: sortOrder };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Count total
    const total = await db.waitlistEntry.count({ where });

    // Fetch entries
    const entries = await db.waitlistEntry.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        appointmentType: {
          select: {
            id: true,
            code: true,
            name: true,
            color: true,
            defaultDuration: true,
          },
        },
        preferredProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Sort by patient name if requested
    if (sortBy === 'patientName') {
      entries.sort((a, b) => {
        const nameA = `${a.patient.lastName} ${a.patient.firstName}`.toLowerCase();
        const nameB = `${b.patient.lastName} ${b.patient.firstName}`.toLowerCase();
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        items: entries,
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
 * POST /api/booking/waitlist
 * Add patient to waitlist
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();
    const validationResult = createWaitlistEntrySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid waitlist entry data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify patient belongs to clinic
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

    // Check if patient already has an active waitlist entry for this type
    const existingEntry = await db.waitlistEntry.findFirst({
      where: {
        patientId: data.patientId,
        appointmentTypeId: data.appointmentTypeId,
        status: 'ACTIVE',
        ...getClinicFilter(session),
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_ON_WAITLIST',
            message: 'Patient already has an active waitlist entry for this appointment type',
          },
        },
        { status: 409 }
      );
    }

    // Calculate position in queue
    const activeCount = await db.waitlistEntry.count({
      where: {
        appointmentTypeId: data.appointmentTypeId,
        status: 'ACTIVE',
        ...getClinicFilter(session),
      },
    });

    // Create entry
    const entry = await db.waitlistEntry.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        appointmentTypeId: data.appointmentTypeId,
        priority: data.priority,
        preferredProviderId: data.preferredProviderId,
        dateRangeStart: data.dateRangeStart,
        dateRangeEnd: data.dateRangeEnd,
        preferredTimes: data.preferredTimes,
        preferredDays: data.preferredDays,
        notes: data.notes,
        reasonForWaitlist: data.reasonForWaitlist,
        expiresAt: data.expiresAt,
        position: activeCount + 1,
        addedBy: session.user.id,
      },
      include: {
        patient: {
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

    return NextResponse.json(
      {
        success: true,
        data: entry,
      },
      { status: 201 }
    );
  },
  { permissions: ['booking:write'] }
);
