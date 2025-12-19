import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { submitPurchaseOrderSchema } from '@/lib/validations/inventory';

/**
 * POST /api/resources/purchase-orders/[id]/submit
 * Submit a purchase order to the supplier
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = submitPurchaseOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid submit data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { orderDate } = result.data;

    // Get the purchase order
    const purchaseOrder = await db.purchaseOrder.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        supplier: true,
        items: true,
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

    // Check if PO is in a submittable status
    const submittableStatuses = ['DRAFT', 'APPROVED'];
    if (!submittableStatuses.includes(purchaseOrder.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_SUBMITTABLE',
            message: `Cannot submit purchase order in ${purchaseOrder.status} status`,
          },
        },
        { status: 400 }
      );
    }

    // Check if PO has items
    if (purchaseOrder.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_ITEMS',
            message: 'Cannot submit purchase order with no items',
          },
        },
        { status: 400 }
      );
    }

    // Calculate expected date based on supplier lead time if not set
    let expectedDate = purchaseOrder.expectedDate;
    if (!expectedDate) {
      expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() + purchaseOrder.supplier.defaultLeadTimeDays);
    }

    // Update the purchase order
    const updatedOrder = await db.purchaseOrder.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        orderDate,
        expectedDate,
        updatedBy: session.user.id,
      },
      include: {
        supplier: {
          select: { id: true, name: true, code: true, email: true },
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

    // Mark any related reorder alerts as ordered
    const itemIds = purchaseOrder.items.map((item) => item.itemId);
    await db.reorderAlert.updateMany({
      where: {
        itemId: { in: itemIds },
        status: 'ACTIVE',
      },
      data: {
        status: 'ORDERED',
        purchaseOrderId: id,
      },
    });

    // TODO: Send email to supplier (integrate with email service)
    // This would be implemented based on the supplier's order method

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PurchaseOrder',
      entityId: purchaseOrder.id,
      details: {
        operation: 'SUBMIT',
        poNumber: purchaseOrder.poNumber,
        supplier: purchaseOrder.supplier.name,
        orderDate,
        totalAmount: purchaseOrder.totalAmount,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
    });
  },
  { permissions: ['inventory:order'] }
);
