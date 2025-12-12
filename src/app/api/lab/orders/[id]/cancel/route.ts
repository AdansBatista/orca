import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

const cancelOrderSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required').max(500),
});

/**
 * POST /api/lab/orders/[id]/cancel
 * Cancel a lab order
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = cancelOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid cancellation data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { reason } = result.data;

    // Get the order
    const order = await db.labOrder.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
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

    // Check if order can be cancelled
    const nonCancellableStatuses = ['DELIVERED', 'RECEIVED', 'PATIENT_PICKUP', 'PICKED_UP', 'CANCELLED'];
    if (nonCancellableStatuses.includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_CANNOT_BE_CANCELLED',
            message: `Order in ${order.status} status cannot be cancelled`,
          },
        },
        { status: 400 }
      );
    }

    const previousStatus = order.status;

    // Update order status to CANCELLED
    const updatedOrder = await db.labOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        clinicNotes: order.clinicNotes
          ? `${order.clinicNotes}\n\n---\nCANCELLED: ${reason}`
          : `CANCELLED: ${reason}`,
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
      },
    });

    // Log status change
    await db.labOrderStatusLog.create({
      data: {
        orderId: order.id,
        fromStatus: previousStatus,
        toStatus: 'CANCELLED',
        source: 'USER',
        notes: `Order cancelled: ${reason}`,
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
        action: 'CANCEL',
        previousStatus,
        reason,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedOrder,
      message: 'Order cancelled successfully',
    });
  },
  { permissions: ['lab:create_order'] }
);
