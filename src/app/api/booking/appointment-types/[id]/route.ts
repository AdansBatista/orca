import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete, SOFT_DELETE_FILTER } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateAppointmentTypeSchema } from '@/lib/validations/booking';

/**
 * GET /api/booking/appointment-types/:id
 * Get a single appointment type by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    const appointmentType = await db.appointmentType.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });

    if (!appointmentType) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Appointment type not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: appointmentType,
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/appointment-types/:id
 * Update an appointment type
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    // Find the existing appointment type
    const existing = await db.appointmentType.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Appointment type not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input
    const result = updateAppointmentTypeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid appointment type data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate code if being changed
    if (data.code && data.code !== existing.code) {
      const duplicateCode = await db.appointmentType.findFirst({
        where: withSoftDelete({
          clinicId: session.user.clinicId,
          code: data.code,
          id: { not: id },
        }),
      });

      if (duplicateCode) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_CODE',
              message: 'An appointment type with this code already exists',
            },
          },
          { status: 409 }
        );
      }
    }

    // Update the appointment type
    const appointmentType = await db.appointmentType.update({
      where: { id },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'AppointmentType',
      entityId: appointmentType.id,
      details: {
        code: appointmentType.code,
        name: appointmentType.name,
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: appointmentType,
    });
  },
  { permissions: ['booking:update'] }
);

/**
 * DELETE /api/booking/appointment-types/:id
 * Soft delete an appointment type
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    // Find the existing appointment type
    const existing = await db.appointmentType.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Appointment type not found',
          },
        },
        { status: 404 }
      );
    }

    // Check for upcoming appointments using this type
    const upcomingAppointments = await db.appointment.count({
      where: {
        appointmentTypeId: id,
        startTime: { gte: new Date() },
        status: { notIn: ['CANCELLED', 'NO_SHOW', 'COMPLETED'] },
        ...SOFT_DELETE_FILTER,
      },
    });

    if (upcomingAppointments > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_UPCOMING_APPOINTMENTS',
            message: 'Cannot delete appointment type with upcoming appointments',
            details: {
              upcomingAppointments,
            },
          },
        },
        { status: 400 }
      );
    }

    // Soft delete the appointment type
    await db.appointmentType.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'AppointmentType',
      entityId: existing.id,
      details: {
        code: existing.code,
        name: existing.name,
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
