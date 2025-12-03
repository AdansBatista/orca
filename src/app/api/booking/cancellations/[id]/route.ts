import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { updateCancellationSchema, logRecoveryAttemptSchema } from '@/lib/validations/waitlist';

/**
 * GET /api/booking/cancellations/:id
 * Get a specific cancellation record
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    const cancellation = await db.appointmentCancellation.findFirst({
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

    if (!cancellation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Cancellation record not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cancellation,
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/cancellations/:id
 * Update a cancellation record (reason, recovery status, fees)
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const validationResult = updateCancellationSchema.safeParse(body);

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

    // Check if cancellation exists
    const existing = await db.appointmentCancellation.findFirst({
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
            message: 'Cancellation record not found',
          },
        },
        { status: 404 }
      );
    }

    const updateData = { ...validationResult.data };

    // If waiving fee, record who waived it
    if (updateData.feeWaived && !existing.feeWaived) {
      (updateData as Record<string, unknown>).feeWaivedBy = session.user.id;
    }

    const cancellation = await db.appointmentCancellation.update({
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
      data: cancellation,
    });
  },
  { permissions: ['booking:write'] }
);

/**
 * POST /api/booking/cancellations/:id/recovery
 * Log a recovery attempt for a cancelled/no-show appointment
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const validationResult = logRecoveryAttemptSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid recovery attempt data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { notes, result, rescheduledAppointmentId } = validationResult.data;

    // Check if cancellation exists
    const existing = await db.appointmentCancellation.findFirst({
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
            message: 'Cancellation record not found',
          },
        },
        { status: 404 }
      );
    }

    // Determine new recovery status
    let recoveryStatus = existing.recoveryStatus;
    if (result === 'RESCHEDULED') {
      recoveryStatus = 'RECOVERED';
    } else if (result === 'DECLINED') {
      recoveryStatus = 'LOST';
    } else if (existing.recoveryStatus === 'PENDING') {
      recoveryStatus = 'IN_PROGRESS';
    }

    const cancellation = await db.appointmentCancellation.update({
      where: { id },
      data: {
        recoveryStatus,
        recoveryAttempts: existing.recoveryAttempts + 1,
        lastRecoveryAttemptAt: new Date(),
        recoveryNotes: notes || existing.recoveryNotes,
        rescheduledAppointmentId: rescheduledAppointmentId || existing.rescheduledAppointmentId,
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
      data: cancellation,
    });
  },
  { permissions: ['booking:write'] }
);
