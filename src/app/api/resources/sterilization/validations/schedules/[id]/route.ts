import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateValidationScheduleSchema } from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/validations/schedules/:id
 * Get a single validation schedule by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    const schedule = await db.validationSchedule.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!schedule) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Validation schedule not found',
          },
        },
        { status: 404 }
      );
    }

    // Get equipment info
    const equipment = await db.equipment.findUnique({
      where: { id: schedule.equipmentId },
      select: { id: true, name: true, equipmentNumber: true, serialNumber: true },
    });

    // Get recent validations for this schedule
    const recentValidations = await db.sterilizerValidation.findMany({
      where: {
        clinicId: session.user.clinicId,
        equipmentId: schedule.equipmentId,
        validationType: schedule.validationType,
      },
      orderBy: { validationDate: 'desc' },
      take: 5,
    });

    // Calculate status
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    let status = 'on_track';
    if (schedule.nextDue) {
      if (schedule.nextDue < now) {
        status = 'overdue';
      } else if (schedule.nextDue <= thirtyDaysFromNow) {
        status = 'due_soon';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...schedule,
        equipment,
        recentValidations,
        status,
        daysUntilDue: schedule.nextDue
          ? Math.ceil((schedule.nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      },
    });
  },
  { permissions: ['sterilization:read'] }
);

/**
 * PUT /api/resources/sterilization/validations/schedules/:id
 * Update a validation schedule
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    // Validate input
    const result = updateValidationScheduleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid schedule data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if schedule exists
    const existing = await db.validationSchedule.findFirst({
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
            message: 'Validation schedule not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // If changing equipment, verify it exists
    if (data.equipmentId && data.equipmentId !== existing.equipmentId) {
      const equipment = await db.equipment.findFirst({
        where: {
          id: data.equipmentId,
          clinicId: session.user.clinicId,
          deletedAt: null,
          category: 'STERILIZATION',
        },
      });

      if (!equipment) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EQUIPMENT_NOT_FOUND',
              message: 'Sterilization equipment not found',
            },
          },
          { status: 404 }
        );
      }

      // Check for duplicate schedule
      const duplicate = await db.validationSchedule.findFirst({
        where: {
          equipmentId: data.equipmentId,
          validationType: data.validationType ?? existing.validationType,
          id: { not: id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SCHEDULE_EXISTS',
              message: 'A schedule already exists for this equipment and validation type',
            },
          },
          { status: 409 }
        );
      }
    }

    // Update the schedule
    const updated = await db.validationSchedule.update({
      where: { id },
      data,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ValidationSchedule',
      entityId: id,
      details: {
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: updated });
  },
  { permissions: ['sterilization:update'] }
);

/**
 * DELETE /api/resources/sterilization/validations/schedules/:id
 * Delete a validation schedule
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    // Check if schedule exists
    const existing = await db.validationSchedule.findFirst({
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
            message: 'Validation schedule not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the schedule
    await db.validationSchedule.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ValidationSchedule',
      entityId: id,
      details: {
        validationType: existing.validationType,
        equipmentId: existing.equipmentId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['sterilization:delete'] }
);
