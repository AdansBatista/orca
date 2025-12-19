import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updatePurchaseOrderSchema } from '@/lib/validations/inventory';

/**
 * GET /api/resources/purchase-orders/[id]
 * Get a single purchase order by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const purchaseOrder = await db.purchaseOrder.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            postalCode: true,
          },
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: true,
                currentStock: true,
                reorderPoint: true,
              },
            },
          },
          orderBy: { lineNumber: 'asc' },
        },
        receipts: {
          orderBy: { receiptDate: 'desc' },
        },
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Purchase order not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
    });
  },
  { permissions: ['inventory:read'] }
);

/**
 * PUT /api/resources/purchase-orders/[id]
 * Update a purchase order (only allowed in DRAFT status)
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updatePurchaseOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid purchase order data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check if order exists and is in DRAFT status
    const existingOrder = await db.purchaseOrder.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Purchase order not found',
          },
        },
        { status: 404 }
      );
    }

    // Only allow edits to draft orders (or limited edits to others)
    const editableStatuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'];
    if (!editableStatuses.includes(existingOrder.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_EDITABLE',
            message: `Cannot edit purchase order in ${existingOrder.status} status`,
          },
        },
        { status: 400 }
      );
    }

    // Update the purchase order
    const purchaseOrder = await db.purchaseOrder.update({
      where: { id },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
      include: {
        supplier: {
          select: { id: true, name: true, code: true },
        },
        items: {
          include: {
            item: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PurchaseOrder',
      entityId: purchaseOrder.id,
      details: {
        poNumber: purchaseOrder.poNumber,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: purchaseOrder,
    });
  },
  { permissions: ['inventory:order'] }
);

/**
 * DELETE /api/resources/purchase-orders/[id]
 * Cancel a purchase order
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Check if order exists
    const existingOrder = await db.purchaseOrder.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Purchase order not found',
          },
        },
        { status: 404 }
      );
    }

    // Only allow cancellation of certain statuses
    const cancellableStatuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SUBMITTED'];
    if (!cancellableStatuses.includes(existingOrder.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_CANCELLABLE',
            message: `Cannot cancel purchase order in ${existingOrder.status} status`,
          },
        },
        { status: 400 }
      );
    }

    // Update status to cancelled
    await db.purchaseOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        updatedBy: session.user.id,
      },
    });

    // Cancel all items
    await db.purchaseOrderItem.updateMany({
      where: { purchaseOrderId: id },
      data: { status: 'CANCELLED' },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'PurchaseOrder',
      entityId: id,
      details: {
        poNumber: existingOrder.poNumber,
        previousStatus: existingOrder.status,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['inventory:order'] }
);
