import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { createEmergencySchema, emergencyQuerySchema } from '@/lib/validations/emergency-reminders';

/**
 * GET /api/booking/emergencies
 * List emergency appointment requests with filtering and pagination
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = emergencyQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      patientId,
      emergencyType,
      severity,
      triageStatus,
      requestChannel,
      resolution,
      isAfterHours,
      startDate,
      endDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = validationResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (patientId) where.patientId = patientId;
    if (emergencyType) where.emergencyType = emergencyType;
    if (severity) where.severity = severity;
    if (triageStatus) where.triageStatus = triageStatus;
    if (requestChannel) where.requestChannel = requestChannel;
    if (resolution) where.resolution = resolution;
    if (isAfterHours !== undefined) where.isAfterHours = isAfterHours;

    if (startDate || endDate) {
      where.requestedAt = {};
      if (startDate) (where.requestedAt as Record<string, Date>).gte = startDate;
      if (endDate) (where.requestedAt as Record<string, Date>).lte = endDate;
    }

    // Get total count
    const total = await db.emergencyAppointment.count({ where });

    // Build order by
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    // Get paginated results
    const emergencies = await db.emergencyAppointment.findMany({
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
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: emergencies,
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
 * POST /api/booking/emergencies
 * Create a new emergency appointment request
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    const validationResult = createEmergencySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid emergency data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // If patientId provided, verify it exists and belongs to this clinic
    if (data.patientId) {
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
    }

    const emergency = await db.emergencyAppointment.create({
      data: {
        ...data,
        clinicId: session.user.clinicId,
        requestedBy: session.user.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: emergency,
    });
  },
  { permissions: ['booking:write'] }
);
