import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createLabShipmentSchema, updateLabShipmentSchema } from '@/lib/validations/lab';

/**
 * GET /api/lab/orders/[id]/shipments
 * List shipments for a lab order
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Verify order exists and belongs to clinic
    const order = await db.labOrder.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      select: { id: true },
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

    const shipments = await db.labShipment.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        events: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: shipments,
    });
  },
  { permissions: ['lab:track'] }
);

/**
 * POST /api/lab/orders/[id]/shipments
 * Create a new shipment for a lab order
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createLabShipmentSchema.omit({ orderId: true }).safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid shipment data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify order exists and is in a valid status for shipment
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

    const validStatusesForShipment = ['SUBMITTED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatusesForShipment.includes(order.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ORDER_STATUS',
            message: `Cannot create shipment for order in ${order.status} status`,
          },
        },
        { status: 400 }
      );
    }

    // Create the shipment
    const shipment = await db.labShipment.create({
      data: {
        orderId: id,
        carrier: data.carrier,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        status: data.status || 'PENDING',
        shippedAt: data.shippedAt,
        estimatedDelivery: data.estimatedDelivery,
        packageCount: data.packageCount || 1,
        weight: data.weight,
        dimensions: data.dimensions,
      },
      include: {
        events: true,
      },
    });

    // Update order status to SHIPPED if not already
    if (order.status !== 'SHIPPED' && data.status === 'IN_TRANSIT') {
      await db.labOrder.update({
        where: { id },
        data: {
          status: 'SHIPPED',
          updatedBy: session.user.id,
        },
      });

      await db.labOrderStatusLog.create({
        data: {
          orderId: id,
          fromStatus: order.status,
          toStatus: 'SHIPPED',
          source: 'SHIPPING',
          notes: `Shipment created with tracking: ${data.trackingNumber || 'N/A'}`,
          changedBy: session.user.id,
        },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'LabShipment',
      entityId: shipment.id,
      details: {
        orderId: id,
        orderNumber: order.orderNumber,
        carrier: shipment.carrier,
        trackingNumber: shipment.trackingNumber,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: shipment }, { status: 201 });
  },
  { permissions: ['lab:track'] }
);
