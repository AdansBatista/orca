import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { z } from 'zod';
import { LabOrderStatusEnum, OrderPriorityEnum } from '@/lib/validations/lab';
import { LabOrderStatus } from '@prisma/client';
import type { Session } from 'next-auth';

/**
 * Batch operation schemas
 */
const batchUpdateStatusSchema = z.object({
  operation: z.literal('UPDATE_STATUS'),
  orderIds: z.array(z.string()).min(1, 'At least one order ID required').max(50),
  newStatus: LabOrderStatusEnum,
  notes: z.string().max(500).optional().nullable(),
});

const batchUpdatePrioritySchema = z.object({
  operation: z.literal('UPDATE_PRIORITY'),
  orderIds: z.array(z.string()).min(1, 'At least one order ID required').max(50),
  newPriority: OrderPriorityEnum,
});

const batchAssignVendorSchema = z.object({
  operation: z.literal('ASSIGN_VENDOR'),
  orderIds: z.array(z.string()).min(1, 'At least one order ID required').max(50),
  vendorId: z.string().min(1, 'Vendor ID is required'),
});

const batchSubmitSchema = z.object({
  operation: z.literal('SUBMIT'),
  orderIds: z.array(z.string()).min(1, 'At least one order ID required').max(50),
});

const batchCancelSchema = z.object({
  operation: z.literal('CANCEL'),
  orderIds: z.array(z.string()).min(1, 'At least one order ID required').max(50),
  reason: z.string().min(1, 'Cancellation reason is required').max(500),
});

const batchPrintSchema = z.object({
  operation: z.literal('PRINT'),
  orderIds: z.array(z.string()).min(1, 'At least one order ID required').max(50),
  format: z.enum(['PRESCRIPTION', 'LABEL', 'PACKING_SLIP']).optional().default('PRESCRIPTION'),
});

const batchExportSchema = z.object({
  operation: z.literal('EXPORT'),
  orderIds: z.array(z.string()).min(1).max(500).optional(),
  filters: z
    .object({
      status: LabOrderStatusEnum.optional(),
      vendorId: z.string().optional(),
      dateFrom: z.coerce.date().optional(),
      dateTo: z.coerce.date().optional(),
    })
    .optional(),
  format: z.enum(['CSV', 'XLSX', 'PDF']).optional().default('CSV'),
});

const batchOperationSchema = z.discriminatedUnion('operation', [
  batchUpdateStatusSchema,
  batchUpdatePrioritySchema,
  batchAssignVendorSchema,
  batchSubmitSchema,
  batchCancelSchema,
  batchPrintSchema,
  batchExportSchema,
]);

type ClinicFilter = ReturnType<typeof getClinicFilter>;

/**
 * POST /api/lab/batch
 * Execute batch operations on lab orders
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);
    const { ipAddress, userAgent } = getRequestMeta(req);

    // Validate input
    const result = batchOperationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid batch operation data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Handle each operation type
    switch (data.operation) {
      case 'UPDATE_STATUS':
        return handleBatchStatusUpdate(data, clinicFilter, session, ipAddress ?? '', userAgent ?? '');

      case 'UPDATE_PRIORITY':
        return handleBatchPriorityUpdate(data, clinicFilter, session, ipAddress ?? '', userAgent ?? '');

      case 'ASSIGN_VENDOR':
        return handleBatchVendorAssign(data, clinicFilter, session, ipAddress ?? '', userAgent ?? '');

      case 'SUBMIT':
        return handleBatchSubmit(data, clinicFilter, session, ipAddress ?? '', userAgent ?? '');

      case 'CANCEL':
        return handleBatchCancel(data, clinicFilter, session, ipAddress ?? '', userAgent ?? '');

      case 'PRINT':
        return handleBatchPrint(data, clinicFilter);

      case 'EXPORT':
        return handleBatchExport(data, clinicFilter);

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNKNOWN_OPERATION',
              message: 'Unknown batch operation',
            },
          },
          { status: 400 }
        );
    }
  },
  { permissions: ['lab:create_order'] }
);

/**
 * Batch status update handler
 */
async function handleBatchStatusUpdate(
  data: z.infer<typeof batchUpdateStatusSchema>,
  clinicFilter: ClinicFilter,
  session: Session,
  ipAddress: string,
  userAgent: string
) {
  // Verify all orders belong to the clinic
  const orders = await db.labOrder.findMany({
    where: withSoftDelete({
      id: { in: data.orderIds },
      ...clinicFilter,
    }),
    select: { id: true, orderNumber: true, status: true },
  });

  const foundIds = new Set(orders.map((o) => o.id));
  const notFound = data.orderIds.filter((id) => !foundIds.has(id));

  if (notFound.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ORDERS_NOT_FOUND',
          message: `Orders not found: ${notFound.join(', ')}`,
        },
      },
      { status: 404 }
    );
  }

  // Update all orders
  const results = await Promise.all(
    orders.map(async (order) => {
      try {
        // Update order status
        await db.labOrder.update({
          where: { id: order.id },
          data: { status: data.newStatus as LabOrderStatus },
        });

        // Create status log
        await db.labOrderStatusLog.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: data.newStatus as LabOrderStatus,
            notes: data.notes || `Batch status update`,
            source: 'USER',
            changedBy: session.user.id,
          },
        });

        return { orderId: order.id, orderNumber: order.orderNumber, success: true };
      } catch {
        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          error: 'Update failed',
        };
      }
    })
  );

  // Audit log
  await logAudit(session, {
    action: 'UPDATE',
    entity: 'LabOrder',
    entityId: 'BATCH',
    details: {
      operation: 'BATCH_STATUS_UPDATE',
      orderCount: orders.length,
      newStatus: data.newStatus,
      orderIds: data.orderIds,
    },
    ipAddress,
    userAgent,
  });

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  return NextResponse.json({
    success: true,
    data: {
      operation: 'UPDATE_STATUS',
      processed: results.length,
      successful: successful.length,
      failed: failed.length,
      results,
    },
  });
}

/**
 * Batch priority update handler
 */
async function handleBatchPriorityUpdate(
  data: z.infer<typeof batchUpdatePrioritySchema>,
  clinicFilter: ClinicFilter,
  session: Session,
  ipAddress: string,
  userAgent: string
) {
  const orders = await db.labOrder.findMany({
    where: withSoftDelete({
      id: { in: data.orderIds },
      ...clinicFilter,
    }),
    select: { id: true, orderNumber: true },
  });

  const foundIds = new Set(orders.map((o) => o.id));
  const notFound = data.orderIds.filter((id) => !foundIds.has(id));

  if (notFound.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ORDERS_NOT_FOUND',
          message: `Orders not found: ${notFound.join(', ')}`,
        },
      },
      { status: 404 }
    );
  }

  // Batch update
  await db.labOrder.updateMany({
    where: { id: { in: data.orderIds } },
    data: { priority: data.newPriority },
  });

  await logAudit(session, {
    action: 'UPDATE',
    entity: 'LabOrder',
    entityId: 'BATCH',
    details: {
      operation: 'BATCH_PRIORITY_UPDATE',
      orderCount: orders.length,
      newPriority: data.newPriority,
      orderIds: data.orderIds,
    },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({
    success: true,
    data: {
      operation: 'UPDATE_PRIORITY',
      processed: orders.length,
      successful: orders.length,
      failed: 0,
    },
  });
}

/**
 * Batch vendor assignment handler
 */
async function handleBatchVendorAssign(
  data: z.infer<typeof batchAssignVendorSchema>,
  clinicFilter: ClinicFilter,
  session: Session,
  ipAddress: string,
  userAgent: string
) {
  // Verify vendor exists
  const vendor = await db.labVendor.findFirst({
    where: {
      id: data.vendorId,
      ...clinicFilter,
      deletedAt: null,
    },
  });

  if (!vendor) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VENDOR_NOT_FOUND',
          message: 'Vendor not found',
        },
      },
      { status: 404 }
    );
  }

  const orders = await db.labOrder.findMany({
    where: withSoftDelete({
      id: { in: data.orderIds },
      ...clinicFilter,
    }),
    select: { id: true, orderNumber: true },
  });

  const foundIds = new Set(orders.map((o) => o.id));
  const notFound = data.orderIds.filter((id) => !foundIds.has(id));

  if (notFound.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ORDERS_NOT_FOUND',
          message: `Orders not found: ${notFound.join(', ')}`,
        },
      },
      { status: 404 }
    );
  }

  await db.labOrder.updateMany({
    where: { id: { in: data.orderIds } },
    data: { vendorId: data.vendorId },
  });

  await logAudit(session, {
    action: 'UPDATE',
    entity: 'LabOrder',
    entityId: 'BATCH',
    details: {
      operation: 'BATCH_VENDOR_ASSIGN',
      orderCount: orders.length,
      vendorId: data.vendorId,
      vendorName: vendor.name,
      orderIds: data.orderIds,
    },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({
    success: true,
    data: {
      operation: 'ASSIGN_VENDOR',
      processed: orders.length,
      successful: orders.length,
      failed: 0,
      vendor: { id: vendor.id, name: vendor.name },
    },
  });
}

/**
 * Batch submit handler
 */
async function handleBatchSubmit(
  data: z.infer<typeof batchSubmitSchema>,
  clinicFilter: ClinicFilter,
  session: Session,
  ipAddress: string,
  userAgent: string
) {
  // Get draft orders with vendor assigned
  const orders = await db.labOrder.findMany({
    where: withSoftDelete({
      id: { in: data.orderIds },
      ...clinicFilter,
      status: LabOrderStatus.DRAFT,
      vendorId: { not: null },
    }),
    select: { id: true, orderNumber: true, status: true, vendorId: true },
  });

  // Find orders that can't be submitted
  const allOrders = await db.labOrder.findMany({
    where: withSoftDelete({
      id: { in: data.orderIds },
      ...clinicFilter,
    }),
    select: { id: true, orderNumber: true, status: true, vendorId: true },
  });

  const cannotSubmit = allOrders.filter(
    (o) => o.status !== LabOrderStatus.DRAFT || !o.vendorId
  );

  const results = await Promise.all(
    orders.map(async (order) => {
      try {
        await db.labOrder.update({
          where: { id: order.id },
          data: {
            status: LabOrderStatus.SUBMITTED,
            submittedAt: new Date(),
            updatedBy: session.user.id,
          },
        });

        await db.labOrderStatusLog.create({
          data: {
            orderId: order.id,
            fromStatus: LabOrderStatus.DRAFT,
            toStatus: LabOrderStatus.SUBMITTED,
            notes: 'Batch submission',
            source: 'USER',
            changedBy: session.user.id,
          },
        });

        return { orderId: order.id, orderNumber: order.orderNumber, success: true };
      } catch {
        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          error: 'Submission failed',
        };
      }
    })
  );

  // Add skipped orders to results
  const skipped = cannotSubmit.map((o) => ({
    orderId: o.id,
    orderNumber: o.orderNumber,
    success: false,
    error: o.status !== LabOrderStatus.DRAFT ? `Cannot submit: status is ${o.status}` : 'Cannot submit: no vendor assigned',
  }));

  await logAudit(session, {
    action: 'UPDATE',
    entity: 'LabOrder',
    entityId: 'BATCH',
    details: {
      operation: 'BATCH_SUBMIT',
      submittedCount: results.filter((r) => r.success).length,
      skippedCount: skipped.length,
    },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({
    success: true,
    data: {
      operation: 'SUBMIT',
      processed: data.orderIds.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length + skipped.length,
      results: [...results, ...skipped],
    },
  });
}

/**
 * Batch cancel handler
 */
async function handleBatchCancel(
  data: z.infer<typeof batchCancelSchema>,
  clinicFilter: ClinicFilter,
  session: Session,
  ipAddress: string,
  userAgent: string
) {
  // Only allow cancellation of orders not yet shipped
  const cancellableStatuses: LabOrderStatus[] = [
    LabOrderStatus.DRAFT,
    LabOrderStatus.SUBMITTED,
    LabOrderStatus.ACKNOWLEDGED,
    LabOrderStatus.IN_PROGRESS,
    LabOrderStatus.ON_HOLD,
  ];

  const orders = await db.labOrder.findMany({
    where: withSoftDelete({
      id: { in: data.orderIds },
      ...clinicFilter,
      status: { in: cancellableStatuses },
    }),
    select: { id: true, orderNumber: true, status: true },
  });

  const foundIds = new Set(orders.map((o) => o.id));
  const cannotCancel = data.orderIds.filter((id) => !foundIds.has(id));

  const results = await Promise.all(
    orders.map(async (order) => {
      try {
        await db.labOrder.update({
          where: { id: order.id },
          data: {
            status: LabOrderStatus.CANCELLED,
            updatedBy: session.user.id,
          },
        });

        await db.labOrderStatusLog.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: LabOrderStatus.CANCELLED,
            notes: `Cancelled: ${data.reason}`,
            source: 'USER',
            changedBy: session.user.id,
          },
        });

        return { orderId: order.id, orderNumber: order.orderNumber, success: true };
      } catch {
        return {
          orderId: order.id,
          orderNumber: order.orderNumber,
          success: false,
          error: 'Cancellation failed',
        };
      }
    })
  );

  await logAudit(session, {
    action: 'UPDATE',
    entity: 'LabOrder',
    entityId: 'BATCH',
    details: {
      operation: 'BATCH_CANCEL',
      cancelledCount: results.filter((r) => r.success).length,
      reason: data.reason,
    },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({
    success: true,
    data: {
      operation: 'CANCEL',
      processed: data.orderIds.length,
      successful: results.filter((r) => r.success).length,
      failed: cannotCancel.length + results.filter((r) => !r.success).length,
      results,
      skipped: cannotCancel.map((id) => ({
        orderId: id,
        success: false,
        error: 'Order not found or not cancellable',
      })),
    },
  });
}

/**
 * Batch print handler
 */
async function handleBatchPrint(
  data: z.infer<typeof batchPrintSchema>,
  clinicFilter: ClinicFilter
) {
  const orders = await db.labOrder.findMany({
    where: withSoftDelete({
      id: { in: data.orderIds },
      ...clinicFilter,
    }),
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
          dateOfBirth: true,
        },
      },
      vendor: {
        select: { name: true, code: true },
      },
      items: {
        include: {
          product: {
            select: { name: true, category: true },
          },
        },
      },
    },
  });

  // In a real implementation, this would generate actual print documents
  const printData = orders.map((order) => ({
    orderId: order.id,
    orderNumber: order.orderNumber,
    format: data.format,
    data: {
      orderNumber: order.orderNumber,
      orderDate: order.orderDate,
      patient: order.patient,
      vendor: order.vendor,
      items: order.items.map((item) => ({
        product: item.product?.name,
        quantity: item.quantity,
        arch: item.arch,
        prescription: item.prescription,
      })),
      notes: order.clinicNotes,
      neededByDate: order.neededByDate,
      priority: order.priority,
    },
  }));

  return NextResponse.json({
    success: true,
    data: {
      operation: 'PRINT',
      format: data.format,
      documentCount: printData.length,
      documents: printData,
      downloadUrl: null,
    },
  });
}

/**
 * Batch export handler
 */
async function handleBatchExport(
  data: z.infer<typeof batchExportSchema>,
  clinicFilter: ClinicFilter
) {
  // Build query based on filters or specific IDs
  const baseFilter = data.orderIds
    ? { id: { in: data.orderIds } }
    : {
        ...(data.filters?.status && { status: data.filters.status as LabOrderStatus }),
        ...(data.filters?.vendorId && { vendorId: data.filters.vendorId }),
        ...(data.filters?.dateFrom && { orderDate: { gte: data.filters.dateFrom } }),
        ...(data.filters?.dateTo && { orderDate: { lte: data.filters.dateTo } }),
      };

  const orders = await db.labOrder.findMany({
    where: withSoftDelete({
      ...clinicFilter,
      ...baseFilter,
    }),
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      vendor: {
        select: { name: true },
      },
      items: {
        include: {
          product: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { orderDate: 'desc' },
    take: 500,
  });

  // Transform for export
  const exportData = orders.map((order) => ({
    orderNumber: order.orderNumber,
    orderDate: order.orderDate?.toISOString(),
    status: order.status,
    priority: order.priority,
    patient: `${order.patient?.lastName}, ${order.patient?.firstName}`,
    vendor: order.vendor?.name,
    itemCount: order.items.length,
    items: order.items.map((i) => i.product?.name).join(', '),
    totalCost: order.totalCost,
    neededByDate: order.neededByDate?.toISOString(),
    isRush: order.isRush,
  }));

  return NextResponse.json({
    success: true,
    data: {
      operation: 'EXPORT',
      format: data.format,
      recordCount: exportData.length,
      exportData,
      downloadUrl: null,
    },
  });
}
