import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { LabOrderStatusEnum, StatusChangeSourceEnum } from '@/lib/validations/lab';

const updateStatusSchema = z.object({
  status: LabOrderStatusEnum,
  source: StatusChangeSourceEnum.optional().default('USER'),
  notes: z.string().max(500).optional().nullable(),
});

// Valid status transitions
const validTransitions: Record<string, string[]> = {
  DRAFT: ['SUBMITTED', 'CANCELLED'],
  SUBMITTED: ['ACKNOWLEDGED', 'IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  ACKNOWLEDGED: ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
  IN_PROGRESS: ['COMPLETED', 'ON_HOLD', 'CANCELLED', 'REMAKE_REQUESTED'],
  ON_HOLD: ['SUBMITTED', 'IN_PROGRESS', 'CANCELLED'],
  COMPLETED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['RECEIVED'],
  RECEIVED: ['PATIENT_PICKUP', 'REMAKE_REQUESTED'],
  PATIENT_PICKUP: ['PICKED_UP'],
  REMAKE_REQUESTED: ['SUBMITTED', 'CANCELLED'],
  PICKED_UP: [], // Terminal state
  CANCELLED: [], // Terminal state
};

/**
 * GET /api/lab/orders/[id]/status
 * Get status history for a lab order
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Verify order exists and belongs to clinic
    const order = await db.labOrder.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      select: { id: true, status: true, orderNumber: true },
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

    const statusLogs = await db.labOrderStatusLog.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        currentStatus: order.status,
        validTransitions: validTransitions[order.status] || [],
        history: statusLogs,
      },
    });
  },
  { permissions: ['lab:track'] }
);

/**
 * PUT /api/lab/orders/[id]/status
 * Update order status
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateStatusSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid status data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { status: newStatus, source, notes } = result.data;

    // Get current order
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

    // Check if transition is valid
    const allowedTransitions = validTransitions[order.status] || [];
    if (!allowedTransitions.includes(newStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: `Cannot transition from ${order.status} to ${newStatus}`,
            details: {
              currentStatus: order.status,
              requestedStatus: newStatus,
              allowedTransitions,
            },
          },
        },
        { status: 400 }
      );
    }

    // Update order status
    const updatedOrder = await db.labOrder.update({
      where: { id },
      data: {
        status: newStatus,
        // Set specific dates based on status
        ...(newStatus === 'SUBMITTED' && { submittedAt: new Date() }),
        ...(newStatus === 'DELIVERED' && { actualDelivery: new Date() }),
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

    // Create status log
    await db.labOrderStatusLog.create({
      data: {
        orderId: id,
        fromStatus: order.status,
        toStatus: newStatus,
        source,
        notes,
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
        statusChange: {
          from: order.status,
          to: newStatus,
        },
        notes,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        order: updatedOrder,
        statusChange: {
          from: order.status,
          to: newStatus,
        },
      },
    });
  },
  { permissions: ['lab:create_order'] }
);
