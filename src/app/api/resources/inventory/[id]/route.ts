import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateInventoryItemSchema } from '@/lib/validations/inventory';

/**
 * GET /api/resources/inventory/[id]
 * Get a single inventory item by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const inventoryItem = await db.inventoryItem.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        supplier: {
          select: { id: true, name: true, code: true, email: true, phone: true },
        },
        lots: {
          where: { status: { not: 'DEPLETED' } },
          orderBy: { expirationDate: 'asc' },
          take: 10,
        },
        reorderAlerts: {
          where: { status: 'ACTIVE' },
          orderBy: { alertDate: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            lots: true,
            stockMovements: true,
            purchaseOrderItems: true,
          },
        },
      },
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

    return NextResponse.json({
      success: true,
      data: inventoryItem,
    });
  },
  { permissions: ['inventory:read'] }
);

/**
 * PUT /api/resources/inventory/[id]
 * Update an inventory item
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateInventoryItemSchema.safeParse(body);
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

    // Check if item exists
    const existingItem = await db.inventoryItem.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existingItem) {
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

    // If SKU is being changed, check for duplicates
    if (data.sku && data.sku !== existingItem.sku) {
      const duplicateSku = await db.inventoryItem.findFirst({
        where: withSoftDelete({
          clinicId: session.user.clinicId,
          sku: data.sku,
          id: { not: id },
        }),
      });

      if (duplicateSku) {
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
    }

    // If supplier is being changed, verify it exists
    if (data.supplierId && data.supplierId !== existingItem.supplierId) {
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

    // Prepare update data
    const updateData: Record<string, unknown> = {
      ...data,
      updatedBy: session.user.id,
    };

    // Recalculate available stock if current or reserved stock changed
    if (data.currentStock !== undefined || data.reservedStock !== undefined) {
      const currentStock = data.currentStock ?? existingItem.currentStock;
      const reservedStock = data.reservedStock ?? existingItem.reservedStock;
      updateData.availableStock = currentStock - reservedStock;
    }

    // Update the inventory item
    const inventoryItem = await db.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        supplier: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Check if we need to create/update reorder alert
    if (inventoryItem.currentStock <= inventoryItem.reorderPoint) {
      const alertType = inventoryItem.currentStock === 0
        ? 'OUT_OF_STOCK'
        : inventoryItem.currentStock <= inventoryItem.safetyStock
          ? 'CRITICAL_STOCK'
          : 'LOW_STOCK';

      // Check for existing active alert
      const existingAlert = await db.reorderAlert.findFirst({
        where: {
          itemId: id,
          status: 'ACTIVE',
        },
      });

      if (!existingAlert) {
        await db.reorderAlert.create({
          data: {
            clinicId: session.user.clinicId,
            itemId: id,
            alertType,
            currentStock: inventoryItem.currentStock,
            reorderPoint: inventoryItem.reorderPoint,
            suggestedQuantity: inventoryItem.reorderQuantity,
          },
        });
      }
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'InventoryItem',
      entityId: inventoryItem.id,
      details: {
        sku: inventoryItem.sku,
        name: inventoryItem.name,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: inventoryItem,
    });
  },
  { permissions: ['inventory:update'] }
);

/**
 * DELETE /api/resources/inventory/[id]
 * Soft delete an inventory item
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Check if item exists
    const existingItem = await db.inventoryItem.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existingItem) {
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

    // Check if item has stock - warn but allow deletion
    if (existingItem.currentStock > 0) {
      // Log warning but proceed with soft delete
    }

    // Soft delete
    await db.inventoryItem.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    });

    // Resolve any active alerts for this item
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

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'InventoryItem',
      entityId: id,
      details: {
        sku: existingItem.sku,
        name: existingItem.name,
        stockAtDeletion: existingItem.currentStock,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['inventory:delete'] }
);
