import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/resources/sterilization/validations/due
 * Get summary of overdue and upcoming validation schedules
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const clinicFilter = getClinicFilter(session);
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Get all active schedules with their equipment
    const schedules = await db.validationSchedule.findMany({
      where: {
        ...clinicFilter,
        isActive: true,
      },
      orderBy: { nextDue: 'asc' },
    });

    // Get equipment info
    const equipmentIds = [...new Set(schedules.map((s) => s.equipmentId))];
    const equipment = await db.equipment.findMany({
      where: { id: { in: equipmentIds } },
      select: { id: true, name: true, equipmentNumber: true },
    });
    const equipmentMap = new Map(equipment.map((e) => [e.id, e]));

    // Categorize schedules
    const overdue: typeof schedules = [];
    const dueWithin7Days: typeof schedules = [];
    const dueWithin30Days: typeof schedules = [];

    for (const schedule of schedules) {
      if (!schedule.nextDue) continue;

      if (schedule.nextDue < now) {
        overdue.push(schedule);
      } else if (schedule.nextDue <= sevenDaysFromNow) {
        dueWithin7Days.push(schedule);
      } else if (schedule.nextDue <= thirtyDaysFromNow) {
        dueWithin30Days.push(schedule);
      }
    }

    // Format schedules with equipment info
    const formatSchedules = (items: typeof schedules) =>
      items.map((s) => ({
        ...s,
        equipment: equipmentMap.get(s.equipmentId) || null,
        daysOverdue: s.nextDue
          ? Math.ceil((now.getTime() - s.nextDue.getTime()) / (1000 * 60 * 60 * 24))
          : null,
        daysUntilDue: s.nextDue
          ? Math.ceil((s.nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      }));

    // Get recent validation results for context
    const recentFailures = await db.sterilizerValidation.findMany({
      where: {
        ...clinicFilter,
        result: 'FAIL',
        validationDate: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { validationDate: 'desc' },
      take: 5,
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          overdue: overdue.length,
          dueWithin7Days: dueWithin7Days.length,
          dueWithin30Days: dueWithin30Days.length,
          recentFailures: recentFailures.length,
        },
        overdue: formatSchedules(overdue),
        dueWithin7Days: formatSchedules(dueWithin7Days),
        dueWithin30Days: formatSchedules(dueWithin30Days),
        recentFailures: recentFailures.map((v) => ({
          ...v,
          equipment: equipmentMap.get(v.equipmentId) || null,
        })),
      },
    });
  },
  { permissions: ['sterilization:read'] }
);
