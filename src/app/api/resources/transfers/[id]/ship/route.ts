import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { shipTransferSchema } from '@/lib/validations/inventory';

/**
 * POST /api/resources/transfers/[id]/ship
 * Mark transfer as shipped and deduct stock from source
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    // Validate input
    const result = shipTransferSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid shipping data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { shippingMethod, trackingNumber, carrierName, items } = result.data;

    // Find the transfer
    const transfer = await db.inventoryTransfer.findFirst({
      where: {
        id,
        fromClinicId: session.user.clinicId,
        status: { in: ['APPROVED', 'PREPARING'] },
      },
      include: {
        items: {
          include: {
            item: true,
            lot: true,
          },
        },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Transfer not found or cannot be shipped',
          },
        },
        { status: 404 }
      );
    }

    // Ship the transfer and update inventory
    await db.$transaction(async (tx) => {
      for (const shipItem of items) {
        const transferItem = transfer.items.find(
          (ti) => ti.id === shipItem.transferItemId
        );

        if (!transferItem) continue;

        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: transferItem.itemId },
        });

        if (!inventoryItem) continue;

        // Update transfer item with shipped quantity
        await tx.transferItem.update({
          where: { id: shipItem.transferItemId },
          data: {
            shippedQuantity: shipItem.shippedQuantity,
            status: 'SHIPPED',
          },
        });

        // Deduct from inventory (move from reserved to shipped)
        const shippedQty = shipItem.shippedQuantity;
        const approvedQty = transferItem.approvedQuantity || transferItem.requestedQuantity;

        // Release excess reserved if shipped less than approved
        const excessReserved = approvedQty - shippedQty;

        await tx.inventoryItem.update({
          where: { id: transferItem.itemId },
          data: {
            currentStock: { decrement: shippedQty },
            reservedStock: { decrement: approvedQty }, // Release all reserved for this item
            availableStock: inventoryItem.currentStock - shippedQty - (inventoryItem.reservedStock - approvedQty),
            updatedBy: session.user.id,
          },
        });

        // Update lot if specified
        if (transferItem.lotId) {
          await tx.inventoryLot.update({
            where: { id: transferItem.lotId },
            data: {
              currentQuantity: { decrement: shippedQty },
            },
          });
        }

        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            clinicId: session.user.clinicId,
            itemId: transferItem.itemId,
            lotId: transferItem.lotId || undefined,
            movementType: 'TRANSFER_OUT',
            quantity: -shippedQty,
            previousStock: inventoryItem.currentStock,
            newStock: inventoryItem.currentStock - shippedQty,
            referenceType: 'TRANSFER',
            referenceId: transfer.id,
            transferId: transfer.id,
            toLocationId: transfer.toClinicId,
            reason: `Transfer to ${transfer.toClinicId}`,
            notes: `Transfer #${transfer.transferNumber}`,
            createdBy: session.user.id,
          },
        });

        // Check if we need to create reorder alert
        const updatedItem = await tx.inventoryItem.findUnique({
          where: { id: transferItem.itemId },
        });

        if (updatedItem && updatedItem.currentStock <= updatedItem.reorderPoint) {
          const existingAlert = await tx.reorderAlert.findFirst({
            where: {
              clinicId: session.user.clinicId,
              itemId: transferItem.itemId,
              status: 'ACTIVE',
            },
          });

          if (!existingAlert) {
            const alertType = updatedItem.currentStock === 0
              ? 'OUT_OF_STOCK'
              : updatedItem.currentStock <= updatedItem.safetyStock
                ? 'CRITICAL_STOCK'
                : 'LOW_STOCK';

            await tx.reorderAlert.create({
              data: {
                clinicId: session.user.clinicId,
                itemId: transferItem.itemId,
                alertType,
                currentStock: updatedItem.currentStock,
                reorderPoint: updatedItem.reorderPoint,
                suggestedQuantity: updatedItem.reorderQuantity,
              },
            });
          }
        }
      }

      // Update transfer status
      await tx.inventoryTransfer.update({
        where: { id },
        data: {
          status: 'IN_TRANSIT',
          shippedBy: session.user.id,
          shippedDate: new Date(),
          shippingMethod,
          trackingNumber,
          carrierName,
        },
      });
    });

    // Fetch updated transfer
    const updatedTransfer = await db.inventoryTransfer.findUnique({
      where: { id },
      include: {
        fromClinic: { select: { id: true, name: true } },
        toClinic: { select: { id: true, name: true } },
        items: {
          include: {
            item: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'InventoryTransfer',
      entityId: id,
      details: {
        transferNumber: transfer.transferNumber,
        action: 'SHIPPED',
        trackingNumber,
        carrierName,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: updatedTransfer });
  },
  { permissions: ['inventory:transfer'] }
);
