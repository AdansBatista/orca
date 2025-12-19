import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createShiftSchema } from '@/lib/validations/scheduling';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { z } from 'zod';

// Schema for bulk shift creation
const bulkShiftSchema = z.object({
  shifts: z.array(createShiftSchema.omit({ staffProfileId: true })).min(1).max(50),
  staffProfileId: z.string(),
});

/**
 * POST /api/staff/shifts/bulk
 * Create multiple shifts at once in a transaction
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = bulkShiftSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid bulk shift data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { shifts, staffProfileId } = result.data;

    // Verify staff profile exists and belongs to clinic
    const staffProfile = await db.staffProfile.findFirst({
      where: withSoftDelete({
        id: staffProfileId,
        ...getClinicFilter(session),
      }),
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

    // Validate all shifts for conflicts before creating any
    const conflicts: { index: number; shiftDate: Date; existingShiftId: string }[] = [];

    for (let i = 0; i < shifts.length; i++) {
      const shift = shifts[i];
      const startOfDay = new Date(shift.shiftDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(shift.shiftDate);
      endOfDay.setHours(23, 59, 59, 999);

      const overlappingShift = await db.staffShift.findFirst({
        where: {
          staffProfileId,
          clinicId: session.user.clinicId,
          shiftDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { notIn: ['CANCELLED'] },
          OR: [
            {
              AND: [
                { startTime: { lte: shift.startTime } },
                { endTime: { gt: shift.startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: shift.endTime } },
                { endTime: { gte: shift.endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: shift.startTime } },
                { endTime: { lte: shift.endTime } },
              ],
            },
          ],
        },
      });

      if (overlappingShift) {
        conflicts.push({
          index: i,
          shiftDate: shift.shiftDate,
          existingShiftId: overlappingShift.id,
        });
      }
    }

    // Also check for conflicts within the submitted batch itself
    for (let i = 0; i < shifts.length; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        const shift1 = shifts[i];
        const shift2 = shifts[j];

        // Same day check
        const date1 = new Date(shift1.shiftDate).toDateString();
        const date2 = new Date(shift2.shiftDate).toDateString();

        if (date1 === date2) {
          // Check time overlap
          const start1 = new Date(shift1.startTime).getTime();
          const end1 = new Date(shift1.endTime).getTime();
          const start2 = new Date(shift2.startTime).getTime();
          const end2 = new Date(shift2.endTime).getTime();

          if (
            (start2 >= start1 && start2 < end1) ||
            (end2 > start1 && end2 <= end1) ||
            (start2 <= start1 && end2 >= end1)
          ) {
            conflicts.push({
              index: j,
              shiftDate: shift2.shiftDate,
              existingShiftId: `batch-shift-${i}`,
            });
          }
        }
      }
    }

    if (conflicts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SHIFT_OVERLAP',
            message: 'One or more shifts have conflicts',
            details: { conflicts },
          },
        },
        { status: 409 }
      );
    }

    // Create all shifts in a transaction
    const createdShifts = await db.$transaction(
      shifts.map((shift) => {
        const startTime = new Date(shift.startTime);
        const endTime = new Date(shift.endTime);
        const totalMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
        const scheduledHours = (totalMinutes - shift.breakMinutes) / 60;

        return db.staffShift.create({
          data: {
            ...shift,
            staffProfileId,
            scheduledHours,
            clinicId: session.user.clinicId,
            createdBy: session.user.id,
            updatedBy: session.user.id,
          },
        });
      })
    );

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'StaffShift',
      entityId: createdShifts[0].id,
      details: {
        bulkCreate: true,
        staffProfileId,
        shiftCount: createdShifts.length,
        shiftIds: createdShifts.map((s) => s.id),
        dateRange: {
          start: shifts[0].shiftDate,
          end: shifts[shifts.length - 1].shiftDate,
        },
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          created: createdShifts.length,
          shifts: createdShifts,
        },
      },
      { status: 201 }
    );
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);
