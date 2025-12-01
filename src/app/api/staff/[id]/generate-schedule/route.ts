import { NextResponse } from 'next/server';
import type { ShiftType, ShiftStatus } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { generateScheduleSchema } from '@/lib/validations/scheduling';

interface TemplateShift {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  shiftType?: string;
}

/**
 * POST /api/staff/[id]/generate-schedule
 * Generate shifts for a staff member from their default schedule template
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id: staffProfileId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = generateScheduleSchema.safeParse({
      ...body,
      staffProfileId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { templateId, startDate, endDate, skipConflicts, locationId } = result.data;

    // Verify staff profile exists and belongs to clinic
    const staffProfile = await db.staffProfile.findFirst({
      where: {
        id: staffProfileId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        defaultScheduleTemplateId: true,
        defaultClinicId: true,
      },
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Staff profile not found',
          },
        },
        { status: 404 }
      );
    }

    // Determine which template to use
    const templateIdToUse = templateId || staffProfile.defaultScheduleTemplateId;

    if (!templateIdToUse) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_TEMPLATE',
            message: 'No schedule template specified and staff has no default template assigned',
          },
        },
        { status: 400 }
      );
    }

    // Fetch the template
    const template = await db.scheduleTemplate.findFirst({
      where: {
        id: templateIdToUse,
        ...getClinicFilter(session),
        isActive: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Schedule template not found or inactive',
          },
        },
        { status: 404 }
      );
    }

    const shifts = template.shifts as unknown as TemplateShift[];
    if (!shifts || shifts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EMPTY_TEMPLATE',
            message: 'Schedule template has no shifts defined',
          },
        },
        { status: 400 }
      );
    }

    // Determine location
    const effectiveLocationId = locationId || template.locationId || staffProfile.defaultClinicId || session.user.clinicId;

    // Get existing shifts in the date range to check for conflicts
    const existingShifts = await db.staffShift.findMany({
      where: {
        staffProfileId,
        shiftDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { not: 'CANCELLED' },
      },
      select: {
        shiftDate: true,
      },
    });

    const existingDates = new Set(
      existingShifts.map((s) => s.shiftDate.toISOString().split('T')[0])
    );

    // Generate shifts for each day in the range
    const shiftsToCreate: {
      staffProfileId: string;
      shiftDate: Date;
      startTime: Date;
      endTime: Date;
      breakMinutes: number;
      scheduledHours: number;
      locationId: string;
      shiftType: ShiftType;
      status: ShiftStatus;
      templateId: string;
      clinicId: string;
      createdBy: string;
      updatedBy: string;
    }[] = [];
    const conflictDates: string[] = [];

    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
      const dateStr = currentDate.toISOString().split('T')[0];

      // Find shifts for this day of week
      const dayShifts = shifts.filter((s) => s.dayOfWeek === dayOfWeek);

      for (const shift of dayShifts) {
        // Check for conflict
        if (existingDates.has(dateStr)) {
          if (skipConflicts) {
            conflictDates.push(dateStr);
            continue;
          }
        }

        // Parse times
        const [startH, startM] = shift.startTime.split(':').map(Number);
        const [endH, endM] = shift.endTime.split(':').map(Number);

        const shiftStartTime = new Date(currentDate);
        shiftStartTime.setHours(startH, startM, 0, 0);

        const shiftEndTime = new Date(currentDate);
        shiftEndTime.setHours(endH, endM, 0, 0);

        // Calculate scheduled hours
        const durationMs = shiftEndTime.getTime() - shiftStartTime.getTime();
        const scheduledHours = (durationMs / (1000 * 60 * 60)) - (shift.breakMinutes / 60);

        shiftsToCreate.push({
          staffProfileId,
          shiftDate: new Date(currentDate),
          startTime: shiftStartTime,
          endTime: shiftEndTime,
          breakMinutes: shift.breakMinutes || 0,
          scheduledHours,
          locationId: effectiveLocationId,
          shiftType: (shift.shiftType as ShiftType) || 'REGULAR',
          status: 'SCHEDULED' as ShiftStatus,
          templateId: templateIdToUse,
          clinicId: session.user.clinicId,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        });
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    if (shiftsToCreate.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SHIFTS_TO_CREATE',
            message: conflictDates.length > 0
              ? `All days in the range already have shifts (${conflictDates.length} conflicts)`
              : 'No shifts to create for the selected date range',
          },
        },
        { status: 400 }
      );
    }

    // Create all shifts in a transaction
    const createdShifts = await db.$transaction(
      shiftsToCreate.map((shift) => db.staffShift.create({ data: shift }))
    );

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'StaffShift',
      entityId: staffProfileId,
      details: {
        action: 'bulk_generate',
        templateId: templateIdToUse,
        templateName: template.name,
        staffName: `${staffProfile.firstName} ${staffProfile.lastName}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        shiftsCreated: createdShifts.length,
        conflictsSkipped: conflictDates.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        shifts: createdShifts,
        summary: {
          created: createdShifts.length,
          skipped: conflictDates.length,
          conflictDates: conflictDates.length > 0 ? conflictDates : undefined,
        },
      },
    });
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);
