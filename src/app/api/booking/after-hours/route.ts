import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { createAfterHoursMessageSchema, afterHoursQuerySchema } from '@/lib/validations/emergency-reminders';

/**
 * GET /api/booking/after-hours
 * List after-hours messages with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = afterHoursQuerySchema.safeParse(queryParams);

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
      messageType,
      urgency,
      status,
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
    if (messageType) where.messageType = messageType;
    if (urgency) where.urgency = urgency;
    if (status) where.status = status;

    if (startDate || endDate) {
      where.receivedAt = {};
      if (startDate) (where.receivedAt as Record<string, Date>).gte = startDate;
      if (endDate) (where.receivedAt as Record<string, Date>).lte = endDate;
    }

    // Get total count
    const total = await db.afterHoursMessage.count({ where });

    // Build order by
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    // Get paginated results
    const messages = await db.afterHoursMessage.findMany({
      where,
      include: {
        patient: {
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

    return NextResponse.json({
      success: true,
      data: {
        items: messages,
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
 * POST /api/booking/after-hours
 * Create a new after-hours message record
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const validationResult = createAfterHoursMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid message data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // If patientId provided, verify it exists
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

    const message = await db.afterHoursMessage.create({
      data: {
        ...data,
        clinicId: session.user.clinicId,
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
      data: message,
    });
  },
  { permissions: ['booking:write'] }
);
