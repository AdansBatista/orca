import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { updateScheduleBlockSchema } from '@/lib/validations/advanced-scheduling';

/**
 * GET /api/booking/schedule-blocks/[id]
 * Get a specific schedule block
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    const block = await db.scheduleBlock.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
            email: true,
          },
        },
      },
    });

    if (!block) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BLOCK_NOT_FOUND',
            message: 'Schedule block not found',
          },
        },
        { status: 404 }
      );
    }

    // Get affected appointments if block is active
    let affectedAppointments: unknown[] = [];
    if (block.status === 'ACTIVE' || block.status === 'APPROVED') {
      affectedAppointments = await db.appointment.findMany({
        where: {
          providerId: block.providerId,
          status: { in: ['SCHEDULED', 'CONFIRMED'] },
          ...getClinicFilter(session),
          AND: [
            { startTime: { gte: block.startDateTime } },
            { startTime: { lt: block.endDateTime } },
          ],
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
              name: true,
              color: true,
            },
          },
        },
        orderBy: { startTime: 'asc' },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...block,
        affectedAppointments,
      },
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/schedule-blocks/[id]
 * Update a schedule block
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json();
    const validationResult = updateScheduleBlockSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid schedule block data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify block exists and belongs to clinic
    const existing = await db.scheduleBlock.findFirst({
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
            code: 'BLOCK_NOT_FOUND',
            message: 'Schedule block not found',
          },
        },
        { status: 404 }
      );
    }

    // If updating times, check for overlaps
    if (data.startDateTime || data.endDateTime) {
      const newStart = data.startDateTime || existing.startDateTime;
      const newEnd = data.endDateTime || existing.endDateTime;

      const overlapping = await db.scheduleBlock.findFirst({
        where: {
          id: { not: id },
          providerId: existing.providerId,
          status: { in: ['ACTIVE', 'APPROVED'] },
          ...getClinicFilter(session),
          AND: [
            { startDateTime: { lt: newEnd } },
            { endDateTime: { gt: newStart } },
          ],
        },
      });

      if (overlapping) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'OVERLAP_CONFLICT',
              message: 'Updated time block would overlap with an existing block',
            },
          },
          { status: 409 }
        );
      }
    }

    // Update block
    const block = await db.scheduleBlock.update({
      where: { id },
      data: {
        ...data,
      },
      include: {
        provider: {
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
      data: block,
    });
  },
  { permissions: ['booking:write'] }
);

/**
 * DELETE /api/booking/schedule-blocks/[id]
 * Cancel/delete a schedule block
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    // Verify block exists and belongs to clinic
    const existing = await db.scheduleBlock.findFirst({
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
            code: 'BLOCK_NOT_FOUND',
            message: 'Schedule block not found',
          },
        },
        { status: 404 }
      );
    }

    // If block is in the past, don't allow deletion
    if (existing.endDateTime < new Date()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CANNOT_DELETE_PAST_BLOCK',
            message: 'Cannot delete blocks that have already passed',
          },
        },
        { status: 400 }
      );
    }

    // Update status to cancelled instead of hard delete
    const block = await db.scheduleBlock.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: block.id,
        cancelled: true,
      },
    });
  },
  { permissions: ['booking:write'] }
);
