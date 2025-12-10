import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { getReminderService } from '@/lib/services/reminders';

/**
 * GET /api/appointments/[id]/reminders
 *
 * Get all reminders for an appointment.
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    // Verify appointment exists
    const appointment = await db.appointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      select: { id: true },
    });

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPOINTMENT_NOT_FOUND',
            message: 'Appointment not found',
          },
        },
        { status: 404 }
      );
    }

    const reminders = await db.appointmentReminder.findMany({
      where: { appointmentId: id },
      orderBy: { scheduledFor: 'asc' },
      select: {
        id: true,
        channel: true,
        reminderType: true,
        scheduledFor: true,
        sentAt: true,
        status: true,
        failureReason: true,
        responseType: true,
        respondedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: reminders,
    });
  },
  { permissions: ['appointments:view'] }
);

/**
 * POST /api/appointments/[id]/reminders
 *
 * Schedule reminders for an appointment.
 * Optionally specify custom reminder timing.
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    // Verify appointment exists
    const appointment = await db.appointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      select: {
        id: true,
        status: true,
        startTime: true,
      },
    });

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPOINTMENT_NOT_FOUND',
            message: 'Appointment not found',
          },
        },
        { status: 404 }
      );
    }

    // Check appointment status
    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Cannot schedule reminders for cancelled or completed appointments',
          },
        },
        { status: 400 }
      );
    }

    const service = getReminderService();
    const results = await service.scheduleRemindersForAppointment(id);

    const scheduled = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'AppointmentReminder',
      entityId: id,
      details: {
        scheduled,
        failed,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        scheduled,
        failed,
        results,
      },
    });
  },
  { permissions: ['appointments:manage'] }
);

/**
 * DELETE /api/appointments/[id]/reminders
 *
 * Cancel all pending reminders for an appointment.
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    // Verify appointment exists
    const appointment = await db.appointment.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      select: { id: true },
    });

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPOINTMENT_NOT_FOUND',
            message: 'Appointment not found',
          },
        },
        { status: 404 }
      );
    }

    const service = getReminderService();
    const cancelled = await service.cancelRemindersForAppointment(id);

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'AppointmentReminder',
      entityId: id,
      details: {
        cancelled,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        cancelled,
      },
    });
  },
  { permissions: ['appointments:manage'] }
);
