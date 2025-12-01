import { NextResponse } from 'next/server';
import { z } from 'zod';
import { subDays, startOfDay, endOfDay } from 'date-fns';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

const summaryQuerySchema = z.object({
  days: z.coerce.number().min(1).max(90).default(7),
});

/**
 * GET /api/audit/summary
 * Get audit log summary/statistics
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      days: searchParams.get('days') ?? '7',
    };

    const queryResult = summaryQuerySchema.safeParse(rawParams);

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

    const { days } = queryResult.data;
    const startDate = startOfDay(subDays(new Date(), days));
    const endDate = endOfDay(new Date());

    const clinicFilter = getClinicFilter(session);

    // Get total count for period
    const totalLogs = await db.auditLog.count({
      where: {
        ...clinicFilter,
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Get counts by action
    const actionCounts = await db.auditLog.groupBy({
      by: ['action'],
      where: {
        ...clinicFilter,
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
    });

    // Get counts by entity
    const entityCounts = await db.auditLog.groupBy({
      by: ['entity'],
      where: {
        ...clinicFilter,
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        entity: true,
      },
      orderBy: {
        _count: {
          entity: 'desc',
        },
      },
      take: 10,
    });

    // Get top users by activity
    const userActivity = await db.auditLog.groupBy({
      by: ['userId', 'userName'],
      where: {
        ...clinicFilter,
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
        userId: { not: null },
      },
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    });

    // Get recent security-related events
    const securityActions = ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE'];
    const securityEvents = await db.auditLog.count({
      where: {
        ...clinicFilter,
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
        action: {
          in: securityActions,
        },
      },
    });

    // Get PHI access count
    const phiAccess = await db.auditLog.count({
      where: {
        ...clinicFilter,
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
        entity: {
          in: ['Patient', 'PatientRecord', 'TreatmentPlan', 'MedicalHistory'],
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          days,
        },
        summary: {
          totalLogs,
          securityEvents,
          phiAccess,
        },
        byAction: actionCounts.map(a => ({
          action: a.action,
          count: a._count.action,
        })),
        byEntity: entityCounts.map(e => ({
          entity: e.entity,
          count: e._count.entity,
        })),
        topUsers: userActivity.map(u => ({
          userId: u.userId,
          userName: u.userName,
          count: u._count.userId,
        })),
      },
    });
  },
  { permissions: ['audit:view', 'audit:full'] }
);
