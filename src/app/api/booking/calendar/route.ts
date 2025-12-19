import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { calendarQuerySchema } from '@/lib/validations/booking';

/**
 * FullCalendar Event interface
 */
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  extendedProps: {
    appointmentId: string;
    patientId: string;
    patientName: string;
    providerId: string;
    providerName: string;
    appointmentTypeId: string;
    appointmentTypeName: string;
    appointmentTypeCode: string;
    status: string;
    confirmationStatus: string;
    chairId: string | null;
    chairName: string | null;
    roomId: string | null;
    roomName: string | null;
    duration: number;
    notes: string | null;
  };
}

/**
 * GET /api/booking/calendar
 * Get appointments formatted for FullCalendar
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      startDate: searchParams.get('startDate') ?? searchParams.get('start') ?? undefined,
      endDate: searchParams.get('endDate') ?? searchParams.get('end') ?? undefined,
      providerId: searchParams.get('providerId') ?? undefined,
      providerIds: searchParams.get('providerIds') ?? undefined,
      appointmentTypeId: searchParams.get('appointmentTypeId') ?? undefined,
      chairId: searchParams.get('chairId') ?? undefined,
      roomId: searchParams.get('roomId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      includeInactive: searchParams.get('includeInactive') ?? undefined,
    };

    const queryResult = calendarQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      startDate,
      endDate,
      providerId,
      providerIds,
      appointmentTypeId,
      chairId,
      roomId,
      status,
      includeInactive,
    } = queryResult.data;

    // Build where clause with standardized soft delete filter
    const where: Record<string, unknown> = withSoftDelete({
      ...getClinicFilter(session),
      startTime: { gte: startDate },
      endTime: { lte: endDate },
    });

    // Filter by provider(s)
    if (providerId) {
      where.providerId = providerId;
    } else if (providerIds && providerIds.length > 0) {
      where.providerId = { in: providerIds };
    }

    // Apply other filters
    if (appointmentTypeId) where.appointmentTypeId = appointmentTypeId;
    if (chairId) where.chairId = chairId;
    if (roomId) where.roomId = roomId;
    if (status) where.status = status;

    // Exclude cancelled/no-show unless requested
    if (!includeInactive) {
      where.status = { notIn: ['CANCELLED', 'NO_SHOW'] };
    }

    // Fetch appointments
    const appointments = await db.appointment.findMany({
      where,
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
        chair: {
          select: {
            id: true,
            name: true,
          },
        },
        room: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    // Transform to FullCalendar format
    const events: CalendarEvent[] = appointments.map((apt) => {
      const patientName = `${apt.patient.firstName} ${apt.patient.lastName}`;
      const providerName = `${apt.provider.firstName} ${apt.provider.lastName}`;

      // Determine colors based on status
      let backgroundColor = apt.appointmentType.color;
      let borderColor = apt.appointmentType.color;
      const textColor = '#ffffff';

      // Adjust colors for different statuses
      if (apt.status === 'CANCELLED') {
        backgroundColor = '#9CA3AF'; // gray-400
        borderColor = '#6B7280'; // gray-500
      } else if (apt.status === 'NO_SHOW') {
        backgroundColor = '#EF4444'; // red-500
        borderColor = '#DC2626'; // red-600
      } else if (apt.status === 'COMPLETED') {
        backgroundColor = '#10B981'; // green-500
        borderColor = '#059669'; // green-600
      } else if (apt.status === 'IN_PROGRESS') {
        backgroundColor = '#F59E0B'; // amber-500
        borderColor = '#D97706'; // amber-600
      } else if (apt.status === 'ARRIVED') {
        backgroundColor = '#3B82F6'; // blue-500
        borderColor = '#2563EB'; // blue-600
      }

      return {
        id: apt.id,
        title: `${patientName} - ${apt.appointmentType.name}`,
        start: apt.startTime.toISOString(),
        end: apt.endTime.toISOString(),
        allDay: false,
        backgroundColor,
        borderColor,
        textColor,
        extendedProps: {
          appointmentId: apt.id,
          patientId: apt.patient.id,
          patientName,
          providerId: apt.provider.id,
          providerName,
          appointmentTypeId: apt.appointmentType.id,
          appointmentTypeName: apt.appointmentType.name,
          appointmentTypeCode: apt.appointmentType.code,
          status: apt.status,
          confirmationStatus: apt.confirmationStatus,
          chairId: apt.chair?.id ?? null,
          chairName: apt.chair?.name ?? null,
          roomId: apt.room?.id ?? null,
          roomName: apt.room?.name ?? null,
          duration: apt.duration,
          notes: apt.notes,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: events,
    });
  },
  { permissions: ['booking:read'] }
);
