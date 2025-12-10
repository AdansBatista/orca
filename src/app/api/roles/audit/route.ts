import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { roleChangeHistoryQuerySchema } from '@/lib/validations/roles';

/**
 * GET /api/roles/audit
 * Get all role change history across all roles for audit dashboard
 */
export const GET = withAuth(
  async (req) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      roleId: searchParams.get('roleId') ?? undefined,
      changeType: searchParams.get('changeType') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? '1',
      pageSize: searchParams.get('pageSize') ?? '25',
    };

    const queryResult = roleChangeHistoryQuerySchema.safeParse(rawParams);

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

    const { roleId, changeType, startDate, endDate, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (roleId) {
      where.roleId = roleId;
    }

    if (changeType) {
      where.changeType = changeType;
    }

    if (startDate || endDate) {
      where.changedAt = {};
      if (startDate) {
        (where.changedAt as Record<string, Date>).gte = startDate;
      }
      if (endDate) {
        (where.changedAt as Record<string, Date>).lte = endDate;
      }
    }

    // Get total count
    const total = await db.roleChangeHistory.count({ where });

    // Get paginated results with role info
    const items = await db.roleChangeHistory.findMany({
      where,
      orderBy: { changedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Get summary stats
    const stats = await Promise.all([
      db.roleChangeHistory.count({ where: { ...where, changeType: 'CREATE' } }),
      db.roleChangeHistory.count({ where: { ...where, changeType: 'UPDATE' } }),
      db.roleChangeHistory.count({ where: { ...where, changeType: 'DELETE' } }),
      db.roleChangeHistory.count({ where: { ...where, changeType: 'PERMISSION_CHANGE' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          created: stats[0],
          updated: stats[1],
          deleted: stats[2],
          permissionChanges: stats[3],
        },
      },
    });
  },
  { permissions: ['roles:view', 'roles:edit', 'roles:full'] }
);
