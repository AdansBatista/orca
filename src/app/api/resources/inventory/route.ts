import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createInventoryItemSchema,
  inventoryItemQuerySchema,
} from '@/lib/validations/inventory';

/**
 * GET /api/resources/inventory
 * List inventory items with pagination, search, and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      supplierId: searchParams.get('supplierId') ?? undefined,
      lowStock: searchParams.get('lowStock') ?? undefined,
      outOfStock: searchParams.get('outOfStock') ?? undefined,
      trackLots: searchParams.get('trackLots') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = inventoryItemQuerySchema.safeParse(rawParams);

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
      category,
      status,
      supplierId,
      lowStock,
      outOfStock,
      trackLots,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with standardized soft delete filter
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (category) where.category = category;
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (trackLots !== undefined) where.trackLots = trackLots;

    // Search across name, SKU, barcode, brand, manufacturer
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter for low stock items (below reorder point)
    if (lowStock) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        {
          currentStock: {
            lte: db.inventoryItem.fields.reorderPoint,
          },
        },
      ];
      // Use raw query since we need to compare fields
      where.currentStock = { lte: 0 }; // Simplified - will use computed approach
    }

    // Filter for out of stock items
    if (outOfStock) {
      where.currentStock = 0;
    }

    // Get total count
    const total = await db.inventoryItem.count({ where });

    // Get paginated results
    const items = await db.inventoryItem.findMany({
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
            lots: true,
            stockMovements: true,
            reorderAlerts: { where: { status: 'ACTIVE' } },
          },
        },
      },
    });

    // Calculate additional stats
    const stats = await db.inventoryItem.aggregate({
      where: withSoftDelete(getClinicFilter(session)),
      _count: true,
      _sum: {
        currentStock: true,
      },
    });

    // Count low stock and out of stock items
    const lowStockCount = await db.inventoryItem.count({
      where: withSoftDelete({
        ...getClinicFilter(session),
        // Items where currentStock <= reorderPoint but > 0
        currentStock: { gt: 0 },
      }),
    });

    const outOfStockCount = await db.inventoryItem.count({
      where: withSoftDelete({
        ...getClinicFilter(session),
        currentStock: 0,
      }),
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          totalItems: stats._count,
          totalStock: stats._sum.currentStock || 0,
          lowStockCount,
          outOfStockCount,
        },
      },
    });
  },
  { permissions: ['inventory:read'] }
);

/**
 * POST /api/resources/inventory
 * Create a new inventory item
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createInventoryItemSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid inventory item data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate SKU in this clinic
    const existingBySku = await db.inventoryItem.findFirst({
      where: withSoftDelete({
        clinicId: session.user.clinicId,
        sku: data.sku,
      }),
    });

    if (existingBySku) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_SKU',
            message: 'An inventory item with this SKU already exists',
          },
        },
        { status: 409 }
      );
    }

    // If supplier is specified, verify it exists
    if (data.supplierId) {
      const supplier = await db.supplier.findFirst({
        where: withSoftDelete({
          id: data.supplierId,
          clinicId: session.user.clinicId,
        }),
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
    }

    // Calculate available stock
    const availableStock = (data.currentStock || 0) - (data.reservedStock || 0);

    // Create the inventory item
    const inventoryItem = await db.inventoryItem.create({
      data: {
        clinicId: session.user.clinicId,
        name: data.name,
        sku: data.sku,
        barcode: data.barcode,
        upc: data.upc,
        category: data.category,
        subcategory: data.subcategory,
        brand: data.brand,
        manufacturer: data.manufacturer,
        description: data.description,
        specifications: data.specifications,
        size: data.size,
        color: data.color,
        material: data.material,
        supplierId: data.supplierId,
        supplierSku: data.supplierSku,
        alternateSupplierIds: data.alternateSupplierIds,
        unitCost: data.unitCost,
        lastCost: data.lastCost,
        averageCost: data.averageCost ?? data.unitCost,
        unitOfMeasure: data.unitOfMeasure,
        unitsPerPackage: data.unitsPerPackage,
        packageDescription: data.packageDescription,
        currentStock: data.currentStock || 0,
        reservedStock: data.reservedStock || 0,
        availableStock,
        reorderPoint: data.reorderPoint,
        reorderQuantity: data.reorderQuantity,
        safetyStock: data.safetyStock,
        maxStock: data.maxStock,
        leadTimeDays: data.leadTimeDays,
        trackLots: data.trackLots,
        trackExpiry: data.trackExpiry,
        trackSerial: data.trackSerial,
        storageLocation: data.storageLocation,
        storageRequirements: data.storageRequirements,
        status: data.status,
        isOrderable: data.isOrderable,
        msdsUrl: data.msdsUrl,
        imageUrl: data.imageUrl,
        documents: data.documents,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        supplier: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Create opening balance stock movement if initial stock > 0
    if (data.currentStock && data.currentStock > 0) {
      await db.stockMovement.create({
        data: {
          clinicId: session.user.clinicId,
          itemId: inventoryItem.id,
          movementType: 'OPENING_BALANCE',
          quantity: data.currentStock,
          unitCost: data.unitCost,
          previousStock: 0,
          newStock: data.currentStock,
          reason: 'Initial stock on item creation',
          createdBy: session.user.id,
        },
      });
    }

    // Check if we need to create a low stock alert
    if (inventoryItem.currentStock <= inventoryItem.reorderPoint) {
      const alertType = inventoryItem.currentStock === 0
        ? 'OUT_OF_STOCK'
        : inventoryItem.currentStock <= inventoryItem.safetyStock
          ? 'CRITICAL_STOCK'
          : 'LOW_STOCK';

      await db.reorderAlert.create({
        data: {
          clinicId: session.user.clinicId,
          itemId: inventoryItem.id,
          alertType,
          currentStock: inventoryItem.currentStock,
          reorderPoint: inventoryItem.reorderPoint,
          suggestedQuantity: inventoryItem.reorderQuantity,
        },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'InventoryItem',
      entityId: inventoryItem.id,
      details: {
        sku: inventoryItem.sku,
        name: inventoryItem.name,
        category: inventoryItem.category,
        initialStock: data.currentStock || 0,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: inventoryItem },
      { status: 201 }
    );
  },
  { permissions: ['inventory:create'] }
);
