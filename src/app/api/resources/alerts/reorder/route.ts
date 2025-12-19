import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { reorderAlertQuerySchema, dismissAlertSchema } from '@/lib/validations/inventory';

/**
 * GET /api/resources/alerts/reorder
 * List reorder alerts with filters
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      alertType: searchParams.get('alertType') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      itemId: searchParams.get('itemId') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = reorderAlertQuerySchema.safeParse(rawParams);

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

    const {
      alertType,
      status,
      itemId,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (alertType) where.alertType = alertType;
    if (status) where.status = status;
    if (itemId) where.itemId = itemId;

    // Get total count
    const total = await db.reorderAlert.count({ where });

    // Get paginated results
    const alerts = await db.reorderAlert.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            currentStock: true,
            reorderPoint: true,
            reorderQuantity: true,
            unitCost: true,
            supplier: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Get summary stats
    const stats = await db.reorderAlert.groupBy({
      by: ['alertType'],
      where: { ...getClinicFilter(session), status: 'ACTIVE' },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: alerts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          byType: stats.map((s) => ({
            type: s.alertType,
            count: s._count,
          })),
          totalActive: stats.reduce((sum, s) => sum + s._count, 0),
        },
      },
    });
  },
  { permissions: ['inventory:read'] }
);

/**
 * PUT /api/resources/alerts/reorder
 * Dismiss a reorder alert (using alert ID in body)
 */
export const PUT = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();
    const { alertId, ...dismissData } = body;

    if (!alertId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Alert ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate dismiss data
    const result = dismissAlertSchema.safeParse(dismissData);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid dismiss data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { reason } = result.data;

    // Get the alert
    const alert = await db.reorderAlert.findFirst({
      where: {
        id: alertId,
        ...getClinicFilter(session),
      },
      include: {
        item: {
          select: { id: true, name: true, sku: true },
        },
      },
    });

    if (!alert) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Alert not found',
          },
        },
        { status: 404 }
      );
    }

    if (alert.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALERT_NOT_ACTIVE',
            message: `Alert is already ${alert.status.toLowerCase()}`,
          },
        },
        { status: 400 }
      );
    }

    // Update the alert
    const updatedAlert = await db.reorderAlert.update({
      where: { id: alertId },
      data: {
        status: 'DISMISSED',
        dismissedAt: new Date(),
        dismissedBy: session.user.id,
        dismissReason: reason,
      },
      include: {
        item: {
          select: { id: true, name: true, sku: true },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ReorderAlert',
      entityId: alertId,
      details: {
        operation: 'DISMISS',
        itemSku: alert.item.sku,
        itemName: alert.item.name,
        alertType: alert.alertType,
        reason,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedAlert,
    });
  },
  { permissions: ['inventory:update'] }
);
