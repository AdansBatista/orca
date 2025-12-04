import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { updateRecurringAppointmentSchema } from '@/lib/validations/advanced-scheduling';

/**
 * GET /api/booking/recurring/[id]
 * Get a specific recurring appointment series
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    const recurring = await db.recurringAppointment.findFirst({
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
            email: true,
            phone: true,
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
            defaultDuration: true,
          },
        },
        occurrences: {
          orderBy: { scheduledDate: 'asc' },
          take: 20, // Next 20 occurrences
          where: {
            scheduledDate: { gte: new Date() },
          },
        },
        _count: {
          select: {
            occurrences: true,
          },
        },
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

    // Get stats
    const completedCount = await db.recurringOccurrence.count({
      where: {
        recurringId: id,
        status: 'SCHEDULED',
        scheduledDate: { lt: new Date() },
      },
    });

    const skippedCount = await db.recurringOccurrence.count({
      where: {
        recurringId: id,
        status: { in: ['SKIPPED', 'CANCELLED'] },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...recurring,
        stats: {
          total: recurring._count.occurrences,
          completed: completedCount,
          skipped: skippedCount,
          remaining: recurring._count.occurrences - completedCount - skippedCount,
        },
      },
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/recurring/[id]
 * Update a recurring appointment series
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    // Check if this is a single occurrence update or series update
    const updateScope = body.updateScope ?? 'series'; // 'series' | 'this' | 'future'

    const validationResult = updateRecurringAppointmentSchema.safeParse(body);

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

    // Verify recurring exists and belongs to clinic
    const existing = await db.recurringAppointment.findFirst({
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
            code: 'RECURRING_NOT_FOUND',
            message: 'Recurring appointment series not found',
          },
        },
        { status: 404 }
      );
    }

    // If cancelled, don't allow updates
    if (existing.status === 'CANCELLED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SERIES_CANCELLED',
            message: 'Cannot update a cancelled series',
          },
        },
        { status: 400 }
      );
    }

    // Verify new provider if being updated
    if (data.providerId) {
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
    }

    // Update series
    const recurring = await db.recurringAppointment.update({
      where: { id },
      data: {
        ...data,
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

    // If scope is 'future', update pending occurrences
    if (updateScope === 'future') {
      const updates: Record<string, unknown> = {};
      if (data.preferredTime) updates.scheduledTime = data.preferredTime;

      if (Object.keys(updates).length > 0) {
        await db.recurringOccurrence.updateMany({
          where: {
            recurringId: id,
            status: 'PENDING',
            scheduledDate: { gte: new Date() },
          },
          data: updates,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: recurring,
    });
  },
  { permissions: ['booking:write'] }
);

/**
 * DELETE /api/booking/recurring/[id]
 * Cancel a recurring appointment series
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const { searchParams } = new URL(req.url);

    // Check cancellation scope
    const cancelScope = searchParams.get('scope') ?? 'all'; // 'all' | 'future'

    // Verify recurring exists and belongs to clinic
    const existing = await db.recurringAppointment.findFirst({
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
            code: 'RECURRING_NOT_FOUND',
            message: 'Recurring appointment series not found',
          },
        },
        { status: 404 }
      );
    }

    if (cancelScope === 'future') {
      // Just cancel future pending occurrences
      const result = await db.recurringOccurrence.updateMany({
        where: {
          recurringId: id,
          status: 'PENDING',
          scheduledDate: { gte: new Date() },
        },
        data: {
          status: 'CANCELLED',
        },
      });

      // Update series status to COMPLETED (no more occurrences)
      await db.recurringAppointment.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          endDate: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id,
          cancelled: result.count,
          scope: 'future',
        },
      });
    }

    // Cancel entire series
    await db.recurringOccurrence.updateMany({
      where: {
        recurringId: id,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
      },
    });

    await db.recurringAppointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        cancelled: true,
        scope: 'all',
      },
    });
  },
  { permissions: ['booking:write'] }
);
