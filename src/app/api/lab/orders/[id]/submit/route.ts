import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

/**
 * POST /api/lab/orders/[id]/submit
 * Submit a lab order to the lab vendor
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Get the order with validation
    const order = await db.labOrder.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        items: true,
        vendor: true,
        attachments: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Lab order not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate order can be submitted
    if (order.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ORDER_STATUS',
            message: `Order is already ${order.status}. Only DRAFT orders can be submitted.`,
          },
        },
        { status: 400 }
      );
    }

    // Validate order has vendor
    if (!order.vendorId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VENDOR_REQUIRED',
            message: 'Order must have a vendor assigned before submission',
          },
        },
        { status: 400 }
      );
    }

    // Validate order has items
    if (order.items.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ITEMS_REQUIRED',
            message: 'Order must have at least one item before submission',
          },
        },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = order.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const rushUpcharge = order.isRush ? subtotal * 0.5 : 0; // 50% rush upcharge
    const totalCost = subtotal + rushUpcharge + (order.shippingCost || 0);

    // Update order status to SUBMITTED
    const updatedOrder = await db.labOrder.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
        subtotal,
        rushUpcharge,
        totalCost,
        updatedBy: session.user.id,
      },
      include: {
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
        items: true,
      },
    });

    // Log status change
    await db.labOrderStatusLog.create({
      data: {
        orderId: order.id,
        fromStatus: 'DRAFT',
        toStatus: 'SUBMITTED',
        source: 'USER',
        notes: 'Order submitted to lab',
        changedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'LabOrder',
      entityId: order.id,
      details: {
        orderNumber: order.orderNumber,
        action: 'SUBMIT',
        vendorId: order.vendorId,
        itemCount: order.items.length,
        totalCost,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order submitted successfully',
    });
  },
  { permissions: ['lab:submit_order'] }
);
