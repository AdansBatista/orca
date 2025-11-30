import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { applyTemplateSchema, TemplateShiftData } from '@/lib/validations/scheduling';

/**
 * POST /api/staff/schedule-templates/:templateId/apply
 * Apply a schedule template to create shifts
 */
export const POST = withAuth<{ templateId: string }>(
  async (req, session, context) => {
    const { templateId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = applyTemplateSchema.safeParse({ ...body, templateId });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid apply template data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { startDate, endDate, staffProfileIds, locationId } = result.data;

    // Find the template
    const template = await db.scheduleTemplate.findFirst({
      where: {
        id: templateId,
        ...getClinicFilter(session),
        isActive: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Schedule template not found or inactive',
          },
        },
        { status: 404 }
      );
    }

    // Determine date range based on period type
    const start = new Date(startDate);
    let end = endDate ? new Date(endDate) : new Date(startDate);

    // If no end date, apply for one period
    if (!endDate) {
      switch (template.periodType) {
        case 'DAILY':
          end = new Date(start);
          break;
        case 'WEEKLY':
          end = new Date(start);
          end.setDate(end.getDate() + 6);
          break;
        case 'BI_WEEKLY':
          end = new Date(start);
          end.setDate(end.getDate() + 13);
          break;
        case 'MONTHLY':
          end = new Date(start);
          end.setMonth(end.getMonth() + 1);
          end.setDate(end.getDate() - 1);
          break;
      }
    }

    // Parse template shifts
    const templateShifts = template.shifts as TemplateShiftData[];

    // Get staff profiles to assign
    let staffProfiles;
    if (staffProfileIds && staffProfileIds.length > 0) {
      staffProfiles = await db.staffProfile.findMany({
        where: {
          id: { in: staffProfileIds },
          ...getClinicFilter(session),
          deletedAt: null,
        },
      });
    } else {
      // Get staff from template shift assignments
      const assignedIds = templateShifts
        .filter(s => s.staffProfileId)
        .map(s => s.staffProfileId as string);

      if (assignedIds.length > 0) {
        staffProfiles = await db.staffProfile.findMany({
          where: {
            id: { in: assignedIds },
            ...getClinicFilter(session),
            deletedAt: null,
          },
        });
      } else {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_STAFF_ASSIGNED',
              message: 'No staff profiles specified and template has no assignments',
            },
          },
          { status: 400 }
        );
      }
    }

    const effectiveLocationId = locationId || template.locationId;
    if (!effectiveLocationId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_LOCATION',
            message: 'Location must be specified either in template or request',
          },
        },
        { status: 400 }
      );
    }

    // Generate shifts for each day in range
    const createdShifts = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();

      // Find template shifts for this day
      const dayShifts = templateShifts.filter(s => s.dayOfWeek === dayOfWeek);

      for (const templateShift of dayShifts) {
        // Determine which staff to assign
        const assignedStaff = templateShift.staffProfileId
          ? staffProfiles.filter(s => s.id === templateShift.staffProfileId)
          : staffProfiles;

        for (const staff of assignedStaff) {
          // Parse times
          const [startHour, startMin] = templateShift.startTime.split(':').map(Number);
          const [endHour, endMin] = templateShift.endTime.split(':').map(Number);

          const shiftStart = new Date(currentDate);
          shiftStart.setHours(startHour, startMin, 0, 0);

          const shiftEnd = new Date(currentDate);
          shiftEnd.setHours(endHour, endMin, 0, 0);

          // Handle overnight shifts
          if (shiftEnd <= shiftStart) {
            shiftEnd.setDate(shiftEnd.getDate() + 1);
          }

          // Calculate hours
          const totalMinutes = (shiftEnd.getTime() - shiftStart.getTime()) / (1000 * 60);
          const scheduledHours = (totalMinutes - templateShift.breakMinutes) / 60;

          // Check for existing shift to avoid duplicates
          const existingShift = await db.staffShift.findFirst({
            where: {
              staffProfileId: staff.id,
              clinicId: session.user.clinicId,
              shiftDate: new Date(currentDate.toISOString().split('T')[0]),
              startTime: shiftStart,
              status: { notIn: ['CANCELLED'] },
            },
          });

          if (!existingShift) {
            const shift = await db.staffShift.create({
              data: {
                staffProfileId: staff.id,
                shiftDate: new Date(currentDate.toISOString().split('T')[0]),
                startTime: shiftStart,
                endTime: shiftEnd,
                breakMinutes: templateShift.breakMinutes,
                scheduledHours,
                locationId: effectiveLocationId,
                shiftType: templateShift.shiftType,
                status: 'SCHEDULED',
                notes: templateShift.notes,
                templateId: template.id,
                clinicId: session.user.clinicId,
                createdBy: session.user.id,
                updatedBy: session.user.id,
              },
            });
            createdShifts.push(shift);
          }
        }
      }

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'StaffShift',
      entityId: template.id,
      details: {
        action: 'APPLY_TEMPLATE',
        templateName: template.name,
        startDate: start,
        endDate: end,
        shiftsCreated: createdShifts.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        message: `Created ${createdShifts.length} shifts from template`,
        shiftsCreated: createdShifts.length,
        shifts: createdShifts,
      },
    });
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);
