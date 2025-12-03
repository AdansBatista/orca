import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateAppointmentSchema } from '@/lib/validations/booking';

/**
 * GET /api/booking/appointments/:id
 * Get a single appointment by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    // Note: MongoDB requires OR with isSet:false for null checks
    const appointment = await db.appointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }],
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
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
            requiresChair: true,
            requiresRoom: true,
          },
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Appointment not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appointment,
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/appointments/:id
 * Update an appointment
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    // Find the existing appointment
    // Note: MongoDB requires OR with isSet:false for null checks
    const existing = await db.appointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Appointment not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot update completed, cancelled, or no-show appointments
    if (['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(existing.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPOINTMENT_CLOSED',
            message: `Cannot update a ${existing.status.toLowerCase()} appointment`,
          },
        },
        { status: 400 }
      );
    }

    // Validate input
    const result = updateAppointmentSchema.safeParse(body);
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

    // Calculate new times if changed
    const startTime = data.startTime ?? existing.startTime;
    const duration = data.duration ?? existing.duration;
    const endTime = data.endTime ?? new Date(startTime.getTime() + duration * 60 * 1000);

    // Check for provider conflict if provider or time changed
    const newProviderId = data.providerId ?? existing.providerId;
    if (data.providerId || data.startTime || data.duration) {
      const providerConflict = await db.appointment.findFirst({
        where: {
          providerId: newProviderId,
          id: { not: id },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          AND: [
            { OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }] },
            {
              OR: [
                {
                  startTime: { lte: startTime },
                  endTime: { gt: startTime },
                },
                {
                  startTime: { lt: endTime },
                  endTime: { gte: endTime },
                },
                {
                  startTime: { gte: startTime },
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
            },
          },
          { status: 409 }
        );
      }
    }

    // Check for chair conflict if chair or time changed
    const newChairId = data.chairId !== undefined ? data.chairId : existing.chairId;
    if (newChairId && (data.chairId || data.startTime || data.duration)) {
      const chairConflict = await db.appointment.findFirst({
        where: {
          chairId: newChairId,
          id: { not: id },
          status: { notIn: ['CANCELLED', 'NO_SHOW'] },
          AND: [
            { OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }] },
            {
              OR: [
                {
                  startTime: { lte: startTime },
                  endTime: { gt: startTime },
                },
                {
                  startTime: { lt: endTime },
                  endTime: { gte: endTime },
                },
                {
                  startTime: { gte: startTime },
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
            },
          },
          { status: 409 }
        );
      }
    }

    // Update the appointment
    const appointment = await db.appointment.update({
      where: { id },
      data: {
        ...(data.appointmentTypeId && { appointmentTypeId: data.appointmentTypeId }),
        ...(data.providerId && { providerId: data.providerId }),
        ...(data.chairId !== undefined && { chairId: data.chairId }),
        ...(data.roomId !== undefined && { roomId: data.roomId }),
        ...(data.startTime && { startTime }),
        endTime,
        duration,
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.patientNotes !== undefined && { patientNotes: data.patientNotes }),
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
      action: 'UPDATE',
      entity: 'Appointment',
      entityId: appointment.id,
      details: {
        updatedFields: Object.keys(data),
        startTime: appointment.startTime,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: appointment,
    });
  },
  { permissions: ['booking:update'] }
);

/**
 * DELETE /api/booking/appointments/:id
 * Soft delete an appointment
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    // Find the existing appointment
    // Note: MongoDB requires OR with isSet:false for null checks
    const existing = await db.appointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Appointment not found',
          },
        },
        { status: 404 }
      );
    }

    // Soft delete the appointment
    await db.appointment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'Appointment',
      entityId: existing.id,
      details: {
        patientId: existing.patientId,
        startTime: existing.startTime,
        reason: 'Soft deleted by user',
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['booking:delete'] }
);
