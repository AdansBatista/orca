import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { receiveTransferSchema } from '@/lib/validations/inventory';

/**
 * POST /api/resources/transfers/[id]/receive
 * Receive transfer items at destination clinic
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    // Validate input
    const result = receiveTransferSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid receiving data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { items, notes } = result.data;

    // Find the transfer (destination clinic)
    const transfer = await db.inventoryTransfer.findFirst({
      where: {
        id,
        toClinicId: session.user.clinicId,
        status: 'IN_TRANSIT',
      },
      include: {
        items: {
          include: {
            item: true,
            lot: true,
          },
        },
        fromClinic: { select: { id: true, name: true } },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Transfer not found or cannot be received',
          },
        },
        { status: 404 }
      );
    }

    // Receive the transfer and update inventory
    await db.$transaction(async (tx) => {
      const variances = [];

      for (const receiveItem of items) {
        const transferItem = transfer.items.find(
          (ti) => ti.id === receiveItem.transferItemId
        );

        if (!transferItem) continue;

        const shippedQty = transferItem.shippedQuantity || 0;
        const receivedQty = receiveItem.receivedQuantity;
        const variance = receivedQty - shippedQty;

        // Update transfer item
        const itemStatus = variance !== 0 ? 'VARIANCE' : 'RECEIVED';

        await tx.transferItem.update({
          where: { id: receiveItem.transferItemId },
          data: {
            receivedQuantity: receivedQty,
            status: itemStatus,
            varianceReason: receiveItem.varianceReason,
          },
        });

        if (variance !== 0) {
          variances.push({
            itemId: transferItem.itemId,
            itemName: transferItem.item.name,
            shipped: shippedQty,
            received: receivedQty,
            variance,
            reason: receiveItem.varianceReason,
          });
        }

        // Find or create the corresponding inventory item at destination
        let destItem = await tx.inventoryItem.findFirst({
          where: withSoftDelete({
            clinicId: session.user.clinicId,
            sku: transferItem.item.sku,
          }),
        });

        if (!destItem) {
          // Create a new inventory item at destination based on source
          destItem = await tx.inventoryItem.create({
            data: {
              clinicId: session.user.clinicId,
              name: transferItem.item.name,
              sku: transferItem.item.sku,
              barcode: transferItem.item.barcode,
              category: transferItem.item.category,
              subcategory: transferItem.item.subcategory,
              brand: transferItem.item.brand,
              manufacturer: transferItem.item.manufacturer,
              description: transferItem.item.description,
              size: transferItem.item.size,
              color: transferItem.item.color,
              material: transferItem.item.material,
              unitCost: transferItem.item.unitCost,
              averageCost: transferItem.item.averageCost,
              unitOfMeasure: transferItem.item.unitOfMeasure,
              unitsPerPackage: transferItem.item.unitsPerPackage,
              currentStock: 0,
              reservedStock: 0,
              availableStock: 0,
              reorderPoint: transferItem.item.reorderPoint,
              reorderQuantity: transferItem.item.reorderQuantity,
              safetyStock: transferItem.item.safetyStock,
              leadTimeDays: transferItem.item.leadTimeDays,
              trackLots: transferItem.item.trackLots,
              trackExpiry: transferItem.item.trackExpiry,
              status: 'ACTIVE',
              createdBy: session.user.id,
              updatedBy: session.user.id,
            },
          });
        }

        // Add received quantity to destination inventory
        await tx.inventoryItem.update({
          where: { id: destItem.id },
          data: {
            currentStock: { increment: receivedQty },
            availableStock: { increment: receivedQty },
            updatedBy: session.user.id,
          },
        });

        // Create lot at destination if source had lot tracking
        if (transferItem.lot && transferItem.item.trackLots) {
          // Check if lot already exists at destination
          let destLot = await tx.inventoryLot.findFirst({
            where: {
              clinicId: session.user.clinicId,
              itemId: destItem.id,
              lotNumber: transferItem.lot.lotNumber,
            },
          });

          if (destLot) {
            // Add to existing lot
            await tx.inventoryLot.update({
              where: { id: destLot.id },
              data: {
                currentQuantity: { increment: receivedQty },
              },
            });
          } else {
            // Create new lot
            await tx.inventoryLot.create({
              data: {
                clinicId: session.user.clinicId,
                itemId: destItem.id,
                lotNumber: transferItem.lot.lotNumber,
                initialQuantity: receivedQty,
                currentQuantity: receivedQty,
                expirationDate: transferItem.lot.expirationDate,
                receivedDate: new Date(),
                status: 'AVAILABLE',
              },
            });
          }
        }

        // Create stock movement record at destination
        await tx.stockMovement.create({
          data: {
            clinicId: session.user.clinicId,
            itemId: destItem.id,
            movementType: 'TRANSFER_IN',
            quantity: receivedQty,
            previousStock: destItem.currentStock,
            newStock: destItem.currentStock + receivedQty,
            referenceType: 'TRANSFER',
            referenceId: transfer.id,
            transferId: transfer.id,
            fromLocationId: transfer.fromClinicId,
            reason: `Transfer from ${transfer.fromClinic.name}`,
            notes: `Transfer #${transfer.transferNumber}${variance !== 0 ? ` (Variance: ${variance})` : ''}`,
            createdBy: session.user.id,
          },
        });
      }

      // Update transfer status
      const hasVariances = variances.length > 0;
      await tx.inventoryTransfer.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          receivedBy: session.user.id,
          receivedDate: new Date(),
          notes: notes
            ? (transfer.notes ? `${transfer.notes}\n\nReceiving notes: ${notes}` : `Receiving notes: ${notes}`)
            : transfer.notes,
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
        action: 'RECEIVED',
        itemCount: items.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: updatedTransfer });
  },
  { permissions: ['inventory:receive'] }
);
