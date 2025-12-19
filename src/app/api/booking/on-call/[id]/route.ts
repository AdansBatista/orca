import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { updateOnCallSchema, swapRequestSchema } from '@/lib/validations/emergency-reminders';

/**
 * GET /api/booking/on-call/:id
 * Get a specific on-call schedule
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    const schedule = await db.onCallSchedule.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        swapRequests: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'On-call schedule not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/on-call/:id
 * Update an on-call schedule
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const validationResult = updateOnCallSchema.safeParse(body);

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

    const existing = await db.onCallSchedule.findFirst({
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
            message: 'On-call schedule not found',
          },
        },
        { status: 404 }
      );
    }

    // Don't allow updates to completed/swapped/cancelled schedules
    if (['COMPLETED', 'SWAPPED', 'CANCELLED'].includes(existing.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SCHEDULE_FINALIZED',
            message: 'Cannot update a completed, swapped, or cancelled schedule',
          },
        },
        { status: 400 }
      );
    }

    const schedule = await db.onCallSchedule.update({
      where: { id },
      data: validationResult.data,
    });

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  },
  { permissions: ['booking:write'] }
);

/**
 * DELETE /api/booking/on-call/:id
 * Delete/cancel an on-call schedule
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    const existing = await db.onCallSchedule.findFirst({
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
            message: 'On-call schedule not found',
          },
        },
        { status: 404 }
      );
    }

    // If active, mark as cancelled instead of deleting
    if (existing.status === 'ACTIVE') {
      await db.onCallSchedule.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    } else {
      await db.onCallSchedule.delete({
        where: { id },
      });
    }

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['booking:write'] }
);

/**
 * POST /api/booking/on-call/:id/swap
 * Request a shift swap
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const validationResult = swapRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid swap request data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const existing = await db.onCallSchedule.findFirst({
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
            message: 'On-call schedule not found',
          },
        },
        { status: 404 }
      );
    }

    if (['COMPLETED', 'SWAPPED', 'CANCELLED'].includes(existing.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SCHEDULE_FINALIZED',
            message: 'Cannot swap a completed, swapped, or cancelled schedule',
          },
        },
        { status: 400 }
      );
    }

    const { targetProviderId, targetOnCallId, reason } = validationResult.data;

    const swapRequest = await db.onCallSwapRequest.create({
      data: {
        clinicId: session.user.clinicId,
        originalOnCallId: id,
        requestingProviderId: existing.providerId,
        targetProviderId,
        targetOnCallId,
        reason,
      },
    });

    return NextResponse.json({
      success: true,
      data: swapRequest,
    });
  },
  { permissions: ['booking:write'] }
);
