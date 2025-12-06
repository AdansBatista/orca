import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete, SOFT_DELETE_FILTER } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createAppointmentSchema,
  appointmentQuerySchema,
} from '@/lib/validations/booking';

/**
 * GET /api/booking/appointments
 * List appointments with filters and pagination
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      patientId: searchParams.get('patientId') ?? undefined,
      providerId: searchParams.get('providerId') ?? undefined,
      appointmentTypeId: searchParams.get('appointmentTypeId') ?? undefined,
      chairId: searchParams.get('chairId') ?? undefined,
      roomId: searchParams.get('roomId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      confirmationStatus: searchParams.get('confirmationStatus') ?? undefined,
      source: searchParams.get('source') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = appointmentQuerySchema.safeParse(rawParams);

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
      chairId,
      roomId,
      status,
      confirmationStatus,
      source,
      startDate,
      endDate,
      search,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with standardized soft delete filter
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    // Apply filters
    if (patientId) where.patientId = patientId;
    if (providerId) where.providerId = providerId;
    if (appointmentTypeId) where.appointmentTypeId = appointmentTypeId;
    if (chairId) where.chairId = chairId;
    if (roomId) where.roomId = roomId;
    if (status) where.status = status;
    if (confirmationStatus) where.confirmationStatus = confirmationStatus;
    if (source) where.source = source;

    // Date range filter
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) (where.startTime as Record<string, unknown>).gte = startDate;
      if (endDate) (where.startTime as Record<string, unknown>).lte = endDate;
    }

    // Patient name search
    if (search) {
      where.patient = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    // Get total count
    const total = await db.appointment.count({ where });

    // Build orderBy for sorting
    let orderBy: Record<string, string> | Record<string, Record<string, string>>;
    if (sortBy === 'patientName') {
      orderBy = { patient: { lastName: sortOrder } };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Get paginated results
    const items = await db.appointment.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        appointmentType: {
          select: {
            id: true,
            code: true,
            name: true,
            color: true,
            icon: true,
            defaultDuration: true,
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
        chair: {
          select: {
            id: true,
            name: true,
            chairNumber: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
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
 * POST /api/booking/appointments
 * Create a new appointment
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createAppointmentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid appointment data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify patient exists and belongs to clinic
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        id: data.patientId,
        ...getClinicFilter(session),
      }),
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
      where: withSoftDelete({
        id: data.appointmentTypeId,
        ...getClinicFilter(session),
        isActive: true,
      }),
    });

    if (!appointmentType) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPOINTMENT_TYPE_NOT_FOUND',
            message: 'Appointment type not found or inactive',
          },
        },
        { status: 404 }
      );
    }

    // Verify provider exists
    const provider = await db.staffProfile.findFirst({
      where: {
        id: data.providerId,
        clinicId: session.user.clinicId,
        status: 'ACTIVE',
      },
    });

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROVIDER_NOT_FOUND',
            message: 'Provider not found or inactive',
          },
        },
        { status: 404 }
      );
    }

    // Calculate duration and end time
    const duration = data.duration ?? appointmentType.defaultDuration;
    const endTime = data.endTime ?? new Date(data.startTime.getTime() + duration * 60 * 1000);

    // Check for scheduling conflicts with provider
    const providerConflict = await db.appointment.findFirst({
      where: {
        providerId: data.providerId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        AND: [
          SOFT_DELETE_FILTER,
          {
            OR: [
              {
                // New appointment starts during an existing appointment
                startTime: { lte: data.startTime },
                endTime: { gt: data.startTime },
              },
              {
                // New appointment ends during an existing appointment
                startTime: { lt: endTime },
                endTime: { gte: endTime },
              },
              {
                // New appointment completely contains an existing appointment
                startTime: { gte: data.startTime },
                endTime: { lte: endTime },
              },
            ],
          },
        ],
      },
    });

    if (providerConflict) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROVIDER_CONFLICT',
            message: 'Provider has a scheduling conflict at this time',
            details: {
              conflictingAppointmentId: providerConflict.id,
              conflictStart: providerConflict.startTime,
              conflictEnd: providerConflict.endTime,
            },
          },
        },
        { status: 409 }
      );
    }

    // Check for chair conflict if chair is assigned
    if (data.chairId) {
      const chairConflict = await db.appointment.findFirst({
        where: {
          chairId: data.chairId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          AND: [
            SOFT_DELETE_FILTER,
            {
              OR: [
                {
                  startTime: { lte: data.startTime },
                  endTime: { gt: data.startTime },
                },
                {
                  startTime: { lt: endTime },
                  endTime: { gte: endTime },
                },
                {
                  startTime: { gte: data.startTime },
                  endTime: { lte: endTime },
                },
              ],
            },
          ],
        },
      });

      if (chairConflict) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CHAIR_CONFLICT',
              message: 'Selected chair is not available at this time',
              details: {
                conflictingAppointmentId: chairConflict.id,
              },
            },
          },
          { status: 409 }
        );
      }
    }

    // Check for room conflict if room is assigned
    if (data.roomId) {
      const roomConflict = await db.appointment.findFirst({
        where: {
          roomId: data.roomId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          AND: [
            SOFT_DELETE_FILTER,
            {
              OR: [
                {
                  startTime: { lte: data.startTime },
                  endTime: { gt: data.startTime },
                },
                {
                  startTime: { lt: endTime },
                  endTime: { gte: endTime },
                },
                {
                  startTime: { gte: data.startTime },
                  endTime: { lte: endTime },
                },
              ],
            },
          ],
        },
      });

      if (roomConflict) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ROOM_CONFLICT',
              message: 'Selected room is not available at this time',
              details: {
                conflictingAppointmentId: roomConflict.id,
              },
            },
          },
          { status: 409 }
        );
      }
    }

    // Create the appointment
    const appointment = await db.appointment.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        appointmentTypeId: data.appointmentTypeId,
        providerId: data.providerId,
        chairId: data.chairId,
        roomId: data.roomId,
        startTime: data.startTime,
        endTime,
        duration,
        status: data.status,
        confirmationStatus: data.confirmationStatus,
        source: data.source,
        bookedBy: session.user.id,
        notes: data.notes,
        patientNotes: data.patientNotes,
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
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Appointment',
      entityId: appointment.id,
      details: {
        patientId: appointment.patientId,
        providerId: appointment.providerId,
        appointmentTypeId: appointment.appointmentTypeId,
        startTime: appointment.startTime,
        duration: appointment.duration,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: appointment },
      { status: 201 }
    );
  },
  { permissions: ['booking:create'] }
);
