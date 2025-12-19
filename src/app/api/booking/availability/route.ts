import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { SOFT_DELETE_FILTER } from '@/lib/db/soft-delete';
import { withAuth } from '@/lib/auth/with-auth';
import { availabilityCheckSchema } from '@/lib/validations/booking';

/**
 * POST /api/booking/availability
 * Check if a time slot is available for booking
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = availabilityCheckSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid availability check data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const conflicts: {
      type: 'provider' | 'chair' | 'room';
      appointmentId: string;
      startTime: Date;
      endTime: Date;
      details?: string;
    }[] = [];

    // Build exclusion criteria
    const exclusion = data.excludeAppointmentId
      ? { id: { not: data.excludeAppointmentId } }
      : {};

    // Check provider availability
    const providerConflict = await db.appointment.findFirst({
      where: {
        providerId: data.providerId,
        status: { notIn: ['CANCELLED', 'NO_SHOW'] },
        ...exclusion,
        AND: [
          SOFT_DELETE_FILTER,
          {
            OR: [
              {
                startTime: { lte: data.startTime },
                endTime: { gt: data.startTime },
              },
              {
                startTime: { lt: data.endTime },
                endTime: { gte: data.endTime },
              },
              {
                startTime: { gte: data.startTime },
                endTime: { lte: data.endTime },
              },
            ],
          },
        ],
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        appointmentType: {
          select: {
            name: true,
          },
        },
      },
    });

    if (providerConflict) {
      conflicts.push({
        type: 'provider',
        appointmentId: providerConflict.id,
        startTime: providerConflict.startTime,
        endTime: providerConflict.endTime,
        details: `${providerConflict.patient.firstName} ${providerConflict.patient.lastName} - ${providerConflict.appointmentType.name}`,
      });
    }

    // Check chair availability if provided
    if (data.chairId) {
      const chairConflict = await db.appointment.findFirst({
        where: {
          chairId: data.chairId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          ...exclusion,
          AND: [
            SOFT_DELETE_FILTER,
            {
              OR: [
                {
                  startTime: { lte: data.startTime },
                  endTime: { gt: data.startTime },
                },
                {
                  startTime: { lt: data.endTime },
                  endTime: { gte: data.endTime },
                },
                {
                  startTime: { gte: data.startTime },
                  endTime: { lte: data.endTime },
                },
              ],
            },
          ],
        },
        include: {
          chair: {
            select: {
              name: true,
            },
          },
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (chairConflict) {
        conflicts.push({
          type: 'chair',
          appointmentId: chairConflict.id,
          startTime: chairConflict.startTime,
          endTime: chairConflict.endTime,
          details: `Chair ${chairConflict.chair?.name} - ${chairConflict.patient.firstName} ${chairConflict.patient.lastName}`,
        });
      }
    }

    // Check room availability if provided
    if (data.roomId) {
      const roomConflict = await db.appointment.findFirst({
        where: {
          roomId: data.roomId,
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          ...exclusion,
          AND: [
            SOFT_DELETE_FILTER,
            {
              OR: [
                {
                  startTime: { lte: data.startTime },
                  endTime: { gt: data.startTime },
                },
                {
                  startTime: { lt: data.endTime },
                  endTime: { gte: data.endTime },
                },
                {
                  startTime: { gte: data.startTime },
                  endTime: { lte: data.endTime },
                },
              ],
            },
          ],
        },
        include: {
          room: {
            select: {
              name: true,
            },
          },
          patient: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (roomConflict) {
        conflicts.push({
          type: 'room',
          appointmentId: roomConflict.id,
          startTime: roomConflict.startTime,
          endTime: roomConflict.endTime,
          details: `Room ${roomConflict.room?.name} - ${roomConflict.patient.firstName} ${roomConflict.patient.lastName}`,
        });
      }
    }

    const isAvailable = conflicts.length === 0;

    return NextResponse.json({
      success: true,
      data: {
        isAvailable,
        conflicts,
        requestedSlot: {
          startTime: data.startTime,
          endTime: data.endTime,
          providerId: data.providerId,
          chairId: data.chairId,
          roomId: data.roomId,
        },
      },
    });
  },
  { permissions: ['booking:read'] }
);
