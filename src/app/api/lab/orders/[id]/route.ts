import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateLabOrderSchema } from '@/lib/validations/lab';

/**
 * GET /api/lab/orders/[id]
 * Get a single lab order by ID with full details
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const order = await db.labOrder.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            email: true,
            phone: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
            primaryEmail: true,
            primaryPhone: true,
            portalUrl: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            planName: true,
            status: true,
          },
        },
        items: {
          orderBy: { createdAt: 'asc' },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
            inspections: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            warranties: {
              where: { status: 'ACTIVE' },
              take: 1,
            },
            _count: {
              select: {
                remakeRequests: true,
              },
            },
          },
        },
        attachments: {
          orderBy: { createdAt: 'desc' },
        },
        shipments: {
          orderBy: { createdAt: 'desc' },
          include: {
            events: {
              orderBy: { timestamp: 'desc' },
              take: 5,
            },
          },
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        inspections: {
          orderBy: { createdAt: 'desc' },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            items: true,
            attachments: true,
            shipments: true,
            messages: true,
          },
        },
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

    return NextResponse.json({ success: true, data: order });
  },
  { permissions: ['lab:track'] }
);

/**
 * PUT /api/lab/orders/[id]
 * Update a lab order
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateLabOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid order data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check order exists
    const existingOrder = await db.labOrder.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existingOrder) {
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

    // Check if order can be modified (not in terminal state)
    const terminalStatuses = ['PICKED_UP', 'CANCELLED'];
    if (terminalStatuses.includes(existingOrder.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_CANNOT_BE_MODIFIED',
            message: `Order in ${existingOrder.status} status cannot be modified`,
          },
        },
        { status: 400 }
      );
    }

    // Track status change
    const statusChanged = data.status && data.status !== existingOrder.status;

    // Update the order
    const order = await db.labOrder.update({
      where: { id },
      data: {
        ...data,
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
    if (statusChanged) {
      await db.labOrderStatusLog.create({
        data: {
          orderId: order.id,
          fromStatus: existingOrder.status,
          toStatus: data.status!,
          source: 'USER',
          changedBy: session.user.id,
        },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'LabOrder',
      entityId: order.id,
      details: {
        orderNumber: order.orderNumber,
        updatedFields: Object.keys(data),
        statusChanged: statusChanged
          ? { from: existingOrder.status, to: data.status }
          : undefined,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: order });
  },
  { permissions: ['lab:create_order'] }
);

/**
 * DELETE /api/lab/orders/[id]
 * Soft delete a lab order (only allowed for DRAFT orders)
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Check order exists
    const existingOrder = await db.labOrder.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existingOrder) {
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

    // Only allow deletion of draft orders
    if (existingOrder.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_CANNOT_BE_DELETED',
            message: 'Only draft orders can be deleted. Use cancel for submitted orders.',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete
    await db.labOrder.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'LabOrder',
      entityId: id,
      details: {
        orderNumber: existingOrder.orderNumber,
        patientId: existingOrder.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['lab:create_order'] }
);
