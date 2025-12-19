import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createLabOrderItemSchema } from '@/lib/validations/lab';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/lab/orders/[id]/items
 * List items for a lab order
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

    const items = await db.labOrderItem.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
            standardTurnaround: true,
            rushTurnaround: true,
          },
        },
        inspections: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        warranties: {
          where: { status: 'ACTIVE' },
        },
        _count: {
          select: {
            remakeRequests: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: items,
    });
  },
  { permissions: ['lab:track'] }
);

/**
 * POST /api/lab/orders/[id]/items
 * Add an item to a lab order
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createLabOrderItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid item data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify order exists and is modifiable
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

    // Only allow adding items to draft orders
    if (order.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_MODIFIABLE',
            message: 'Can only add items to draft orders',
          },
        },
        { status: 400 }
      );
    }

    // Verify product exists
    const product = await db.labProduct.findFirst({
      where: withSoftDelete({
        id: data.productId,
        ...getClinicFilter(session),
      }),
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Lab product not found',
          },
        },
        { status: 404 }
      );
    }

    // Get price from fee schedule or use provided price
    let unitPrice = data.unitPrice;
    if (!unitPrice && order.vendorId) {
      const feeSchedule = await db.labFeeSchedule.findFirst({
        where: {
          productId: data.productId,
          vendorId: order.vendorId,
          isActive: true,
          effectiveDate: { lte: new Date() },
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } },
          ],
        },
        orderBy: { effectiveDate: 'desc' },
      });

      if (feeSchedule) {
        unitPrice = feeSchedule.basePrice;
      }
    }

    if (!unitPrice) {
      unitPrice = 0; // Default to 0 if no price found
    }

    const quantity = data.quantity || 1;
    const totalPrice = unitPrice * quantity;

    // Create the item
    const item = await db.labOrderItem.create({
      data: {
        orderId: id,
        productId: data.productId,
        productName: product.name,
        quantity,
        prescription: data.prescription as Prisma.InputJsonValue | undefined,
        arch: data.arch,
        toothNumbers: data.toothNumbers || [],
        unitPrice,
        totalPrice,
        status: 'PENDING',
        notes: data.notes,
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    // Update order totals
    const allItems = await db.labOrderItem.findMany({
      where: { orderId: id },
    });
    const subtotal = allItems.reduce((sum, i) => sum + i.totalPrice, 0);

    await db.labOrder.update({
      where: { id },
      data: {
        subtotal,
        totalCost: subtotal + (order.rushUpcharge || 0) + (order.shippingCost || 0),
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'LabOrderItem',
      entityId: item.id,
      details: {
        orderId: id,
        orderNumber: order.orderNumber,
        productName: product.name,
        quantity,
        totalPrice,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: item }, { status: 201 });
  },
  { permissions: ['lab:create_order'] }
);
