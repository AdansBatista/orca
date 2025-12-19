import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { reminderQuerySchema, sendReminderSchema } from '@/lib/validations/emergency-reminders';

/**
 * GET /api/booking/reminders
 * List appointment reminders with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = reminderQuerySchema.safeParse(queryParams);

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
      appointmentId,
      patientId,
      channel,
      status,
      reminderType,
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

    if (appointmentId) where.appointmentId = appointmentId;
    if (patientId) where.patientId = patientId;
    if (channel) where.channel = channel;
    if (status) where.status = status;
    if (reminderType) where.reminderType = reminderType;

    if (startDate || endDate) {
      where.scheduledFor = {};
      if (startDate) (where.scheduledFor as Record<string, Date>).gte = startDate;
      if (endDate) (where.scheduledFor as Record<string, Date>).lte = endDate;
    }

    // Get total count
    const total = await db.appointmentReminder.count({ where });

    // Build order by
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    // Get paginated results
    const reminders = await db.appointmentReminder.findMany({
      where,
      include: {
        appointment: {
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
                name: true,
                code: true,
                color: true,
              },
            },
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
        items: reminders,
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
 * POST /api/booking/reminders/send
 * Manually trigger sending a reminder
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const validationResult = sendReminderSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid reminder data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { appointmentId, channel, reminderType, templateId } = validationResult.data;

    // Verify appointment exists and belongs to clinic
    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
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

    // Validate contact info for channel
    if (channel === 'SMS' && !appointment.patient.phone) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_PHONE',
            message: 'Patient does not have a phone number for SMS',
          },
        },
        { status: 400 }
      );
    }

    if (channel === 'EMAIL' && !appointment.patient.email) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_EMAIL',
            message: 'Patient does not have an email address',
          },
        },
        { status: 400 }
      );
    }

    // Create the reminder record (actual sending would be handled by a background job/service)
    const reminder = await db.appointmentReminder.create({
      data: {
        clinicId: session.user.clinicId,
        appointmentId,
        patientId: appointment.patientId,
        channel,
        reminderType,
        templateId,
        scheduledFor: new Date(), // Send immediately
        status: 'SCHEDULED',
      },
      include: {
        appointment: {
          select: {
            id: true,
            startTime: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Note: In a real implementation, this would queue the reminder for sending
    // via Twilio (SMS), SendGrid (Email), etc. For now, we just create the record.

    return NextResponse.json({
      success: true,
      data: reminder,
      message: 'Reminder scheduled for sending',
    });
  },
  { permissions: ['booking:write'] }
);
