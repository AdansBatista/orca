import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { stockUsageSchema } from '@/lib/validations/inventory';

/**
 * POST /api/resources/inventory/[id]/use
 * Record usage of an inventory item (deduct from stock)
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = stockUsageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid usage data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { quantity, lotId, patientId, appointmentId, procedureId, providerId, notes } = result.data;

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

    // Check available stock
    if (inventoryItem.availableStock < quantity) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSUFFICIENT_STOCK',
            message: `Insufficient stock. Available: ${inventoryItem.availableStock}, Requested: ${quantity}`,
          },
        },
        { status: 400 }
      );
    }

    let selectedLotId: string | undefined = lotId ?? undefined;
    let lot = null;

    // If item tracks lots, handle lot selection
    if (inventoryItem.trackLots) {
      if (lotId) {
        // Use specified lot
        lot = await db.inventoryLot.findFirst({
          where: {
            id: lotId,
            itemId: id,
            clinicId: session.user.clinicId,
            status: 'AVAILABLE',
            currentQuantity: { gte: quantity },
          },
        });

        if (!lot) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_LOT',
                message: 'Lot not found, not available, or has insufficient quantity',
              },
            },
            { status: 400 }
          );
        }
      } else {
        // FIFO: Find oldest available lot with sufficient quantity
        lot = await db.inventoryLot.findFirst({
          where: {
            itemId: id,
            clinicId: session.user.clinicId,
            status: 'AVAILABLE',
            currentQuantity: { gte: quantity },
          },
          orderBy: [
            { expirationDate: 'asc' }, // Expiring soonest first
            { receivedDate: 'asc' },   // Then oldest received
          ],
        });

        if (!lot) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NO_AVAILABLE_LOT',
                message: 'No available lot with sufficient quantity',
              },
            },
            { status: 400 }
          );
        }

        selectedLotId = lot.id;
      }

      // Update lot quantity
      const newLotQuantity = lot.currentQuantity - quantity;
      await db.inventoryLot.update({
        where: { id: selectedLotId },
        data: {
          currentQuantity: newLotQuantity,
          status: newLotQuantity === 0 ? 'DEPLETED' : 'AVAILABLE',
        },
      });
    }

    // Calculate new stock
    const previousStock = inventoryItem.currentStock;
    const newStock = previousStock - quantity;

    // Create stock movement record
    const stockMovement = await db.stockMovement.create({
      data: {
        clinicId: session.user.clinicId,
        itemId: id,
        lotId: selectedLotId,
        movementType: 'USED',
        quantity: -quantity, // Negative for usage
        unitCost: inventoryItem.unitCost,
        referenceType: patientId ? 'PATIENT_TREATMENT' : undefined,
        patientId,
        appointmentId,
        procedureId,
        providerId: providerId ?? session.user.id,
        previousStock,
        newStock,
        notes,
        createdBy: session.user.id,
      },
    });

    // Update inventory item
    const updatedItem = await db.inventoryItem.update({
      where: { id },
      data: {
        currentStock: newStock,
        availableStock: newStock - inventoryItem.reservedStock,
        lastUsedAt: new Date(),
        updatedBy: session.user.id,
      },
      include: {
        supplier: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Check if we need to create reorder alert
    if (newStock <= inventoryItem.reorderPoint && previousStock > inventoryItem.reorderPoint) {
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
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'InventoryItem',
      entityId: id,
      details: {
        operation: 'USAGE',
        sku: inventoryItem.sku,
        name: inventoryItem.name,
        quantity,
        previousStock,
        newStock,
        lotNumber: lot?.lotNumber,
        patientId,
        providerId: providerId ?? session.user.id,
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
  { permissions: ['inventory:use'] }
);
