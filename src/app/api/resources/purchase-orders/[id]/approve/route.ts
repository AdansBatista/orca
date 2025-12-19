import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { approvePurchaseOrderSchema, rejectPurchaseOrderSchema } from '@/lib/validations/inventory';

/**
 * POST /api/resources/purchase-orders/[id]/approve
 * Approve a purchase order
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = approvePurchaseOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid approval data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { notes } = result.data;

    // Get the purchase order
    const purchaseOrder = await db.purchaseOrder.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        supplier: true,
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

    // Check if PO is pending approval
    if (purchaseOrder.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_PENDING',
            message: `Purchase order is not pending approval (current status: ${purchaseOrder.status})`,
          },
        },
        { status: 400 }
      );
    }

    // Update the purchase order
    const updatedOrder = await db.purchaseOrder.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: session.user.id,
        approvedAt: new Date(),
        internalNotes: notes
          ? `${purchaseOrder.internalNotes || ''}\n[Approval Note]: ${notes}`.trim()
          : purchaseOrder.internalNotes,
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
        operation: 'APPROVE',
        poNumber: purchaseOrder.poNumber,
        supplier: purchaseOrder.supplier.name,
        totalAmount: purchaseOrder.totalAmount,
        notes,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
    });
  },
  { permissions: ['inventory:approve'] }
);

/**
 * DELETE /api/resources/purchase-orders/[id]/approve
 * Reject a purchase order
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = rejectPurchaseOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid rejection data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { reason } = result.data;

    // Get the purchase order
    const purchaseOrder = await db.purchaseOrder.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        supplier: true,
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

    // Check if PO is pending approval
    if (purchaseOrder.status !== 'PENDING_APPROVAL') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_PENDING',
            message: `Purchase order is not pending approval (current status: ${purchaseOrder.status})`,
          },
        },
        { status: 400 }
      );
    }

    // Update the purchase order
    const updatedOrder = await db.purchaseOrder.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectedBy: session.user.id,
        rejectedAt: new Date(),
        rejectionReason: reason,
        updatedBy: session.user.id,
      },
      include: {
        supplier: {
          select: { id: true, name: true, code: true },
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
        operation: 'REJECT',
        poNumber: purchaseOrder.poNumber,
        supplier: purchaseOrder.supplier.name,
        reason,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
    });
  },
  { permissions: ['inventory:approve'] }
);
