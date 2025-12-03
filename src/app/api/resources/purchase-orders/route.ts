import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createPurchaseOrderSchema,
  purchaseOrderQuerySchema,
} from '@/lib/validations/inventory';

/**
 * Generate next PO number for a clinic
 */
async function generatePoNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PO-${year}-`;

  // Get the last PO number for this year
  const lastPo = await db.purchaseOrder.findFirst({
    where: {
      clinicId,
      poNumber: { startsWith: prefix },
    },
    orderBy: { poNumber: 'desc' },
    select: { poNumber: true },
  });

  let nextNumber = 1;
  if (lastPo) {
    const lastNumber = parseInt(lastPo.poNumber.replace(prefix, ''), 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
}

/**
 * GET /api/resources/purchase-orders
 * List purchase orders with pagination and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      supplierId: searchParams.get('supplierId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = purchaseOrderQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      search,
      supplierId,
      status,
      dateFrom,
      dateTo,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { externalPoNumber: { contains: search, mode: 'insensitive' } },
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) (where.orderDate as Record<string, Date>).gte = dateFrom;
      if (dateTo) (where.orderDate as Record<string, Date>).lte = dateTo;
    }

    // Get total count
    const total = await db.purchaseOrder.count({ where });

    // Get paginated results
    const orders = await db.purchaseOrder.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        supplier: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            items: true,
            receipts: true,
          },
        },
      },
    });

    // Get summary stats
    const stats = await db.purchaseOrder.groupBy({
      by: ['status'],
      where: getClinicFilter(session),
      _count: true,
      _sum: { totalAmount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: orders,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: stats.map((s) => ({
          status: s.status,
          count: s._count,
          totalValue: s._sum.totalAmount || 0,
        })),
      },
    });
  },
  { permissions: ['inventory:read'] }
);

/**
 * POST /api/resources/purchase-orders
 * Create a new purchase order
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createPurchaseOrderSchema.safeParse(body);
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

    // Build clinic filter - super_admin can access any clinic's data
    const clinicFilter = getClinicFilter(session);
    const isSuperAdmin = Object.keys(clinicFilter).length === 0;

    // Verify supplier exists
    const supplier = await db.supplier.findFirst({
      where: {
        id: data.supplierId,
        ...clinicFilter,
        deletedAt: null,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_SUPPLIER',
            message: 'Supplier not found',
          },
        },
        { status: 400 }
      );
    }

    // Determine target clinicId - use supplier's clinic for super_admin
    const targetClinicId = isSuperAdmin ? supplier.clinicId : session.user.clinicId;

    // Verify all items exist and belong to the same clinic as the supplier
    const itemIds = data.items.map((item) => item.itemId);
    const items = await db.inventoryItem.findMany({
      where: {
        id: { in: itemIds },
        clinicId: targetClinicId,
        deletedAt: null,
      },
    });

    if (items.length !== itemIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ITEMS',
            message: 'One or more items not found',
          },
        },
        { status: 400 }
      );
    }

    const itemMap = new Map(items.map((i) => [i.id, i]));

    // Generate PO number
    const poNumber = await generatePoNumber(targetClinicId);

    // Calculate totals
    let subtotal = 0;
    const poItems = data.items.map((item, index) => {
      const inventoryItem = itemMap.get(item.itemId)!;
      const lineTotal = item.orderedQuantity * item.unitPrice * (1 - item.discountPercent / 100);
      subtotal += lineTotal;

      return {
        lineNumber: index + 1,
        itemId: item.itemId,
        description: inventoryItem.name,
        sku: inventoryItem.sku,
        supplierSku: inventoryItem.supplierSku,
        orderedQuantity: item.orderedQuantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        lineTotal,
        notes: item.notes,
      };
    });

    const totalAmount = subtotal; // Tax and shipping can be added later

    // Create the purchase order with items
    const purchaseOrder = await db.purchaseOrder.create({
      data: {
        clinicId: targetClinicId,
        supplierId: data.supplierId,
        poNumber,
        status: 'DRAFT',
        expectedDate: data.expectedDate,
        subtotal,
        totalAmount,
        shippingMethod: data.shippingMethod,
        paymentTerms: data.paymentTerms ?? supplier.paymentTerms,
        shipTo: data.shipTo,
        notes: data.notes,
        internalNotes: data.internalNotes,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        items: {
          create: poItems,
        },
      },
      include: {
        supplier: {
          select: { id: true, name: true, code: true },
        },
        items: {
          include: {
            item: {
              select: { id: true, name: true, sku: true, category: true },
            },
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'PurchaseOrder',
      entityId: purchaseOrder.id,
      details: {
        poNumber: purchaseOrder.poNumber,
        supplier: supplier.name,
        itemCount: poItems.length,
        totalAmount: purchaseOrder.totalAmount,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: purchaseOrder },
      { status: 201 }
    );
  },
  { permissions: ['inventory:order'] }
);
