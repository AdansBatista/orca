import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createInventoryLotSchema, inventoryLotQuerySchema } from '@/lib/validations/inventory';

/**
 * GET /api/resources/inventory/[id]/lots
 * Get lots for an inventory item
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      status: searchParams.get('status') ?? undefined,
      expiringSoon: searchParams.get('expiringSoon') ?? undefined,
      expired: searchParams.get('expired') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = inventoryLotQuerySchema.safeParse(rawParams);

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

    const { status, expiringSoon, expired, page, pageSize, sortBy, sortOrder } = queryResult.data;

    // Verify item exists and belongs to clinic
    const inventoryItem = await db.inventoryItem.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      select: { id: true, name: true, sku: true, trackLots: true, trackExpiry: true },
    });

    if (!inventoryItem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Inventory item not found',
          },
        },
        { status: 404 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {
      itemId: id,
      clinicId: session.user.clinicId,
    };

    if (status) where.status = status;

    // Filter for expiring soon (within X days)
    if (expiringSoon) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + expiringSoon);
      where.expirationDate = {
        lte: expirationDate,
        gte: new Date(), // Not already expired
      };
      where.status = { not: 'EXPIRED' };
    }

    // Filter for expired
    if (expired) {
      where.OR = [
        { status: 'EXPIRED' },
        {
          expirationDate: { lt: new Date() },
          status: { not: 'EXPIRED' },
        },
      ];
    }

    // Get total count
    const total = await db.inventoryLot.count({ where });

    // Get paginated results
    const lots = await db.inventoryLot.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        purchaseOrder: {
          select: { id: true, poNumber: true },
        },
        _count: {
          select: { stockMovements: true },
        },
      },
    });

    // Calculate summary stats
    const availableLots = await db.inventoryLot.aggregate({
      where: {
        itemId: id,
        clinicId: session.user.clinicId,
        status: 'AVAILABLE',
      },
      _sum: { currentQuantity: true },
      _count: true,
    });

    const expiringCount = await db.inventoryLot.count({
      where: {
        itemId: id,
        clinicId: session.user.clinicId,
        status: 'AVAILABLE',
        expirationDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          gte: new Date(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        item: inventoryItem,
        lots,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          availableLots: availableLots._count,
          availableQuantity: availableLots._sum.currentQuantity || 0,
          expiringWithin30Days: expiringCount,
        },
      },
    });
  },
  { permissions: ['inventory:read'] }
);

/**
 * POST /api/resources/inventory/[id]/lots
 * Create a new lot for an inventory item (manual lot creation)
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Add itemId to body for validation
    const result = createInventoryLotSchema.safeParse({ ...body, itemId: id });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid lot data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify item exists and tracks lots
    const inventoryItem = await db.inventoryItem.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!inventoryItem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Inventory item not found',
          },
        },
        { status: 404 }
      );
    }

    // Check for duplicate lot number
    const existingLot = await db.inventoryLot.findFirst({
      where: {
        clinicId: session.user.clinicId,
        itemId: id,
        lotNumber: data.lotNumber,
      },
    });

    if (existingLot) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_LOT',
            message: 'A lot with this number already exists for this item',
          },
        },
        { status: 409 }
      );
    }

    // Create the lot
    const lot = await db.inventoryLot.create({
      data: {
        clinicId: session.user.clinicId,
        itemId: id,
        lotNumber: data.lotNumber,
        serialNumbers: data.serialNumbers,
        initialQuantity: data.initialQuantity,
        currentQuantity: data.initialQuantity,
        receivedDate: data.receivedDate,
        manufacturingDate: data.manufacturingDate,
        expirationDate: data.expirationDate,
        purchaseOrderId: data.purchaseOrderId,
        supplierId: data.supplierId,
        unitCost: data.unitCost ?? inventoryItem.unitCost,
        storageLocation: data.storageLocation ?? inventoryItem.storageLocation,
        notes: data.notes,
      },
    });

    // Update inventory item stock
    const newStock = inventoryItem.currentStock + data.initialQuantity;
    await db.inventoryItem.update({
      where: { id },
      data: {
        currentStock: newStock,
        availableStock: newStock - inventoryItem.reservedStock,
        updatedBy: session.user.id,
      },
    });

    // Create stock movement
    await db.stockMovement.create({
      data: {
        clinicId: session.user.clinicId,
        itemId: id,
        lotId: lot.id,
        movementType: 'RECEIVED',
        quantity: data.initialQuantity,
        unitCost: data.unitCost ?? inventoryItem.unitCost,
        referenceType: data.purchaseOrderId ? 'PURCHASE_ORDER' : undefined,
        referenceId: data.purchaseOrderId,
        previousStock: inventoryItem.currentStock,
        newStock,
        reason: 'Lot created manually',
        createdBy: session.user.id,
      },
    });

    // Check if we need to resolve reorder alerts
    if (newStock > inventoryItem.reorderPoint) {
      await db.reorderAlert.updateMany({
        where: {
          itemId: id,
          status: 'ACTIVE',
        },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
      });
    }

    // Create expiration alert if needed
    if (data.expirationDate) {
      const daysUntilExpiry = Math.floor(
        (data.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 90) {
        const alertLevel = daysUntilExpiry <= 0
          ? 'EXPIRED'
          : daysUntilExpiry <= 7
            ? 'CRITICAL'
            : daysUntilExpiry <= 30
              ? 'URGENT'
              : daysUntilExpiry <= 60
                ? 'CAUTION'
                : 'WARNING';

        await db.expirationAlert.create({
          data: {
            clinicId: session.user.clinicId,
            itemId: id,
            lotId: lot.id,
            alertLevel,
            expirationDate: data.expirationDate,
            daysUntilExpiry: Math.max(0, daysUntilExpiry),
            quantity: data.initialQuantity,
            estimatedValue: data.initialQuantity * (data.unitCost ?? inventoryItem.unitCost),
          },
        });
      }
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'InventoryLot',
      entityId: lot.id,
      details: {
        itemId: id,
        itemSku: inventoryItem.sku,
        lotNumber: lot.lotNumber,
        quantity: lot.initialQuantity,
        expirationDate: lot.expirationDate,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: lot },
      { status: 201 }
    );
  },
  { permissions: ['inventory:create'] }
);
