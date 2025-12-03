import { NextResponse } from 'next/server';
import { WaitlistStatus } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { updateWaitlistEntrySchema, resolveWaitlistEntrySchema } from '@/lib/validations/waitlist';

/**
 * GET /api/booking/waitlist/:id
 * Get a specific waitlist entry
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    const entry = await db.waitlistEntry.findFirst({
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
    });

    if (!entry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Waitlist entry not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: entry,
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/waitlist/:id
 * Update a waitlist entry
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const validationResult = updateWaitlistEntrySchema.safeParse(body);

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

    // Check if entry exists
    const existing = await db.waitlistEntry.findFirst({
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
            message: 'Waitlist entry not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot update resolved entries
    if (['BOOKED', 'EXPIRED', 'REMOVED', 'DECLINED'].includes(existing.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ENTRY_RESOLVED',
            message: 'Cannot update a resolved waitlist entry',
          },
        },
        { status: 400 }
      );
    }

    const entry = await db.waitlistEntry.update({
      where: { id },
      data: validationResult.data,
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

    return NextResponse.json({
      success: true,
      data: entry,
    });
  },
  { permissions: ['booking:write'] }
);

/**
 * DELETE /api/booking/waitlist/:id
 * Remove a patient from the waitlist
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    // Check if entry exists
    const existing = await db.waitlistEntry.findFirst({
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
            message: 'Waitlist entry not found',
          },
        },
        { status: 404 }
      );
    }

    // Mark as removed instead of deleting
    const entry = await db.waitlistEntry.update({
      where: { id },
      data: {
        status: 'REMOVED',
        resolution: 'STAFF_REMOVED',
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: entry,
    });
  },
  { permissions: ['booking:write'] }
);

/**
 * PATCH /api/booking/waitlist/:id/resolve
 * Resolve a waitlist entry (book, expire, etc.)
 */
export const PATCH = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    const validationResult = resolveWaitlistEntrySchema.safeParse(body);

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

    const { resolution, bookedAppointmentId } = validationResult.data;

    // Check if entry exists and is active
    const existing = await db.waitlistEntry.findFirst({
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
            message: 'Waitlist entry not found',
          },
        },
        { status: 404 }
      );
    }

    if (['BOOKED', 'EXPIRED', 'REMOVED', 'DECLINED'].includes(existing.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_RESOLVED',
            message: 'Waitlist entry is already resolved',
          },
        },
        { status: 400 }
      );
    }

    // Map resolution to status
    const statusMap: Record<string, WaitlistStatus> = {
      BOOKED: 'BOOKED',
      EXPIRED: 'EXPIRED',
      PATIENT_REMOVED: 'REMOVED',
      STAFF_REMOVED: 'REMOVED',
      DECLINED_ALL_OFFERS: 'DECLINED',
    };

    const entry = await db.waitlistEntry.update({
      where: { id },
      data: {
        status: statusMap[resolution] || 'REMOVED',
        resolution,
        resolvedAt: new Date(),
        resolvedBy: session.user.id,
        bookedAppointmentId,
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
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: entry,
    });
  },
  { permissions: ['booking:write'] }
);
