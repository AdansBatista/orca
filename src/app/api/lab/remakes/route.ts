import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createRemakeRequestSchema,
  RemakeStatusEnum,
  RemakeReasonEnum,
} from '@/lib/validations/lab';

const remakeQuerySchema = z.object({
  status: RemakeStatusEnum.optional(),
  reason: RemakeReasonEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * GET /api/lab/remakes
 * List remake requests with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      status: searchParams.get('status') ?? undefined,
      reason: searchParams.get('reason') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = remakeQuerySchema.safeParse(rawParams);

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

    const { status, reason, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      clinicId: session.user.clinicId,
    };

    if (status) where.status = status;
    if (reason) where.reason = reason;

    const total = await db.remakeRequest.count({ where });

    const items = await db.remakeRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        originalItem: {
          select: {
            id: true,
            productName: true,
            orderId: true,
          },
        },
      },
    });

    // Fetch related order data for all items
    const orderIds = [...new Set(items.map((item) => item.originalOrderId))];
    const newOrderIds = items.map((item) => item.newOrderId).filter(Boolean) as string[];

    const [orders, newOrders] = await Promise.all([
      db.labOrder.findMany({
        where: { id: { in: orderIds } },
        select: {
          id: true,
          orderNumber: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      }),
      newOrderIds.length > 0
        ? db.labOrder.findMany({
            where: { id: { in: newOrderIds } },
            select: {
              id: true,
              orderNumber: true,
              status: true,
            },
          })
        : [],
    ]);

    // Map orders by ID for easy lookup
    const orderMap = new Map(orders.map((o) => [o.id, o]));
    const newOrderMap = new Map(newOrders.map((o) => [o.id, o]));

    // Enrich items with order data
    const enrichedItems = items.map((item) => ({
      ...item,
      originalOrder: orderMap.get(item.originalOrderId) || null,
      newOrder: item.newOrderId ? newOrderMap.get(item.newOrderId) || null : null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: enrichedItems,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['lab:track'] }
);

/**
 * POST /api/lab/remakes
 * Create a new remake request
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createRemakeRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid remake request data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify original order exists and belongs to clinic
    const originalOrder = await db.labOrder.findFirst({
      where: withSoftDelete({
        id: data.originalOrderId,
        ...getClinicFilter(session),
      }),
      include: {
        vendor: true,
      },
    });

    if (!originalOrder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Original order not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify original item exists
    const originalItem = await db.labOrderItem.findFirst({
      where: {
        id: data.originalItemId,
        orderId: data.originalOrderId,
      },
    });

    if (!originalItem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_ITEM_NOT_FOUND',
            message: 'Original order item not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if warranty claim
    let warranty = null;
    if (data.isWarrantyClaim && data.warrantyId) {
      warranty = await db.labWarranty.findFirst({
        where: {
          id: data.warrantyId,
          orderItemId: data.originalItemId,
          status: 'ACTIVE',
        },
      });

      if (!warranty) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'WARRANTY_NOT_FOUND',
              message: 'Active warranty not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Generate request number
    const year = new Date().getFullYear();
    const count = await db.remakeRequest.count({
      where: { clinicId: session.user.clinicId },
    });
    const requestNumber = `RMK-${year}-${String(count + 1).padStart(4, '0')}`;

    // Create the remake request
    const remake = await db.remakeRequest.create({
      data: {
        clinicId: session.user.clinicId,
        originalOrderId: data.originalOrderId,
        originalItemId: data.originalItemId,
        requestNumber,
        status: 'REQUESTED',
        reason: data.reason,
        reasonDetails: data.reasonDetails,
        isWarrantyClaim: data.isWarrantyClaim || false,
        warrantyId: data.warrantyId,
        costResponsibility: data.costResponsibility || 'LAB',
        estimatedCost: data.estimatedCost,
        requiresApproval: data.requiresApproval || false,
        requestedBy: session.user.id,
      },
      include: {
        originalItem: {
          select: {
            id: true,
            productName: true,
          },
        },
      },
    });

    // Update the original order status to REMAKE_REQUESTED
    await db.labOrder.update({
      where: { id: data.originalOrderId },
      data: {
        status: 'REMAKE_REQUESTED',
        updatedBy: session.user.id,
      },
    });

    await db.labOrderStatusLog.create({
      data: {
        orderId: data.originalOrderId,
        fromStatus: originalOrder.status,
        toStatus: 'REMAKE_REQUESTED',
        source: 'USER',
        notes: `Remake requested: ${data.reason}`,
        changedBy: session.user.id,
      },
    });

    // Update warranty if this is a warranty claim
    if (warranty) {
      await db.labWarranty.update({
        where: { id: warranty.id },
        data: {
          status: 'CLAIMED',
        },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'RemakeRequest',
      entityId: remake.id,
      details: {
        originalOrderId: data.originalOrderId,
        originalOrderNumber: originalOrder.orderNumber,
        originalItemId: data.originalItemId,
        reason: data.reason,
        isWarrantyClaim: data.isWarrantyClaim,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...remake,
        originalOrder: {
          id: originalOrder.id,
          orderNumber: originalOrder.orderNumber,
        },
      },
    }, { status: 201 });
  },
  { permissions: ['lab:request_remake'] }
);
