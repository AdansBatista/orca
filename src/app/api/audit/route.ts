import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

const auditLogQuerySchema = z.object({
  userId: z.string().optional(),
  action: z.string().optional(),
  entity: z.string().optional(),
  entityId: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
});

/**
 * GET /api/audit
 * List audit logs with filters
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      userId: searchParams.get('userId') ?? undefined,
      action: searchParams.get('action') ?? undefined,
      entity: searchParams.get('entity') ?? undefined,
      entityId: searchParams.get('entityId') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = auditLogQuerySchema.safeParse(rawParams);

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

    const { userId, action, entity, entityId, startDate, endDate, search, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (entityId) where.entityId = entityId;

    // Date range filter
    if (startDate || endDate) {
      where.occurredAt = {};
      if (startDate) (where.occurredAt as Record<string, unknown>).gte = startDate;
      if (endDate) (where.occurredAt as Record<string, unknown>).lte = endDate;
    }

    // Search in userName or entity
    if (search) {
      where.OR = [
        { userName: { contains: search, mode: 'insensitive' } },
        { entity: { contains: search, mode: 'insensitive' } },
        { entityId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.auditLog.count({ where });

    // Get paginated results
    const items = await db.auditLog.findMany({
      where,
      orderBy: { occurredAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['audit:view', 'audit:full'] }
);
