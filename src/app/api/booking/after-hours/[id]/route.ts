import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { updateAfterHoursMessageSchema, resolveAfterHoursMessageSchema } from '@/lib/validations/emergency-reminders';

/**
 * GET /api/booking/after-hours/:id
 * Get a specific after-hours message
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    const message = await db.afterHoursMessage.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
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
    });

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'After-hours message not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/after-hours/:id
 * Update an after-hours message
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const validationResult = updateAfterHoursMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const existing = await db.afterHoursMessage.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'After-hours message not found',
          },
        },
        { status: 404 }
      );
    }

    const data = validationResult.data;
    const updateData: Record<string, unknown> = { ...data };

    // Track status changes
    if (data.status === 'ACKNOWLEDGED' && existing.status === 'PENDING') {
      updateData.acknowledgedAt = new Date();
      updateData.acknowledgedBy = session.user.id;
    }

    if (data.status === 'CALLBACK_SCHEDULED' && data.callbackScheduledFor) {
      updateData.callbackScheduledFor = data.callbackScheduledFor;
    }

    const message = await db.afterHoursMessage.update({
      where: { id },
      data: updateData,
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

/**
 * POST /api/booking/after-hours/:id/resolve
 * Resolve an after-hours message
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const validationResult = resolveAfterHoursMessageSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid resolution data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const existing = await db.afterHoursMessage.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'After-hours message not found',
          },
        },
        { status: 404 }
      );
    }

    if (existing.status === 'RESOLVED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_RESOLVED',
            message: 'Message is already resolved',
          },
        },
        { status: 400 }
      );
    }

    const { resolutionNotes, appointmentId, emergencyAppointmentId } = validationResult.data;

    const message = await db.afterHoursMessage.update({
      where: { id },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
        resolutionNotes,
        appointmentId,
        emergencyAppointmentId,
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
