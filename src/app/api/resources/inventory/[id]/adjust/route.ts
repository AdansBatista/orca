import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { stockAdjustmentSchema } from '@/lib/validations/inventory';

/**
 * POST /api/resources/inventory/[id]/adjust
 * Adjust stock level for an inventory item
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = stockAdjustmentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid adjustment data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { quantity, reason, notes, lotId } = result.data;

    // Get the inventory item
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

    // Calculate new stock
    const previousStock = inventoryItem.currentStock;
    const newStock = previousStock + quantity;

    // Prevent negative stock
    if (newStock < 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Cannot reduce stock by ${Math.abs(quantity)}. Current stock is ${previousStock}.`,
          },
        },
        { status: 400 }
      );
    }

    // If lot is specified, validate and update lot
    let lot = null;
    if (lotId) {
      lot = await db.inventoryLot.findFirst({
        where: {
          id: lotId,
          itemId: id,
          clinicId: session.user.clinicId,
          status: { in: ['AVAILABLE', 'RESERVED'] },
        },
      });

      if (!lot) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_LOT',
              message: 'Lot not found or not available',
            },
          },
          { status: 400 }
        );
      }

      // For reductions, check lot has enough
      if (quantity < 0 && lot.currentQuantity < Math.abs(quantity)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INSUFFICIENT_LOT_STOCK',
              message: `Lot ${lot.lotNumber} only has ${lot.currentQuantity} units available.`,
            },
          },
          { status: 400 }
        );
      }

      // Update lot quantity
      const newLotQuantity = lot.currentQuantity + quantity;
      await db.inventoryLot.update({
        where: { id: lotId },
        data: {
          currentQuantity: newLotQuantity,
          status: newLotQuantity === 0 ? 'DEPLETED' : lot.status,
        },
      });
    }

    // Determine movement type
    const movementType = quantity > 0 ? 'ADJUSTMENT_ADD' : 'ADJUSTMENT_REMOVE';

    // Create stock movement record
    const stockMovement = await db.stockMovement.create({
      data: {
        clinicId: session.user.clinicId,
        itemId: id,
        lotId,
        movementType,
        quantity,
        unitCost: inventoryItem.unitCost,
        referenceType: 'ADJUSTMENT',
        previousStock,
        newStock,
        reason,
        notes,
        createdBy: session.user.id,
      },
    });

    // Update inventory item stock
    const updatedItem = await db.inventoryItem.update({
      where: { id },
      data: {
        currentStock: newStock,
        availableStock: newStock - inventoryItem.reservedStock,
        updatedBy: session.user.id,
      },
      include: {
        supplier: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Check if we need to create/resolve reorder alerts
    if (newStock <= inventoryItem.reorderPoint && previousStock > inventoryItem.reorderPoint) {
      // Stock dropped below reorder point - create alert
      const alertType = newStock === 0
        ? 'OUT_OF_STOCK'
        : newStock <= inventoryItem.safetyStock
          ? 'CRITICAL_STOCK'
          : 'LOW_STOCK';

      await db.reorderAlert.create({
        data: {
          clinicId: session.user.clinicId,
          itemId: id,
          alertType,
          currentStock: newStock,
          reorderPoint: inventoryItem.reorderPoint,
          suggestedQuantity: inventoryItem.reorderQuantity,
        },
      });
    } else if (newStock > inventoryItem.reorderPoint && previousStock <= inventoryItem.reorderPoint) {
      // Stock rose above reorder point - resolve active alerts
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

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'InventoryItem',
      entityId: id,
      details: {
        operation: 'STOCK_ADJUSTMENT',
        sku: inventoryItem.sku,
        name: inventoryItem.name,
        previousStock,
        newStock,
        adjustment: quantity,
        reason,
        lotNumber: lot?.lotNumber,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        inventoryItem: updatedItem,
        stockMovement,
      },
    });
  },
  { permissions: ['inventory:adjust'] }
);
