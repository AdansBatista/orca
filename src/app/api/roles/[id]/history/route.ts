import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { roleChangeHistoryQuerySchema } from '@/lib/validations/roles';

/**
 * GET /api/roles/[id]/history
 * Get change history for a specific role
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);

    // Verify role exists
    const role = await db.role.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!role) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Role not found',
          },
        },
        { status: 404 }
      );
    }

    // Parse query parameters
    const rawParams = {
      changeType: searchParams.get('changeType') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
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

    const { changeType, startDate, endDate, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      roleId: id,
    };

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

    // Get paginated results
    const items = await db.roleChangeHistory.findMany({
      where,
      orderBy: { changedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        role: {
          id: role.id,
          name: role.name,
        },
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['roles:view', 'roles:edit', 'roles:full'] }
);
