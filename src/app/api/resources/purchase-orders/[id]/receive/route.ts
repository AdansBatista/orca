import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createPurchaseOrderReceiptSchema } from '@/lib/validations/inventory';

/**
 * Generate next receipt number for a clinic
 */
async function generateReceiptNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `RCV-${year}-`;

  const lastReceipt = await db.purchaseOrderReceipt.findFirst({
    where: {
      clinicId,
      receiptNumber: { startsWith: prefix },
    },
    orderBy: { receiptNumber: 'desc' },
    select: { receiptNumber: true },
  });

  let nextNumber = 1;
  if (lastReceipt) {
    const lastNumber = parseInt(lastReceipt.receiptNumber.replace(prefix, ''), 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
}

/**
 * POST /api/resources/purchase-orders/[id]/receive
 * Receive items against a purchase order
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createPurchaseOrderReceiptSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid receipt data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Get the purchase order with items
    const purchaseOrder = await db.purchaseOrder.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        supplier: true,
        items: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Purchase order not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if PO is in a receivable status
    const receivableStatuses = ['SUBMITTED', 'ACKNOWLEDGED', 'PARTIALLY_RECEIVED'];
    if (!receivableStatuses.includes(purchaseOrder.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_RECEIVABLE',
            message: `Cannot receive items for purchase order in ${purchaseOrder.status} status`,
          },
        },
        { status: 400 }
      );
    }

    // Create a map of PO items for quick lookup
    const poItemMap = new Map(purchaseOrder.items.map((item) => [item.id, item]));

    // Validate received items
    for (const receivedItem of data.items) {
      const poItem = poItemMap.get(receivedItem.purchaseOrderItemId);
      if (!poItem) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_PO_ITEM',
              message: `PO item ${receivedItem.purchaseOrderItemId} not found`,
            },
          },
          { status: 400 }
        );
      }

      // Check if receiving more than remaining
      const remaining = poItem.orderedQuantity - poItem.receivedQuantity;
      if (receivedItem.quantity > remaining) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'QUANTITY_EXCEEDED',
              message: `Cannot receive ${receivedItem.quantity} for ${poItem.item.name}. Only ${remaining} remaining.`,
            },
          },
          { status: 400 }
        );
      }
    }

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(session.user.clinicId);

    // Create the receipt
    const receipt = await db.purchaseOrderReceipt.create({
      data: {
        clinicId: session.user.clinicId,
        purchaseOrderId: id,
        receiptNumber,
        packingSlipNumber: data.packingSlipNumber,
        carrierName: data.carrierName,
        trackingNumber: data.trackingNumber,
        items: data.items,
        notes: data.notes,
        damageNotes: data.damageNotes,
        createdBy: session.user.id,
      },
    });

    // Process each received item
    for (const receivedItem of data.items) {
      const poItem = poItemMap.get(receivedItem.purchaseOrderItemId)!;
      const inventoryItem = poItem.item;

      // Update PO item received quantity
      const newReceivedQty = poItem.receivedQuantity + receivedItem.quantity;
      const itemStatus = newReceivedQty >= poItem.orderedQuantity
        ? 'RECEIVED'
        : 'PARTIALLY_RECEIVED';

      await db.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: {
          receivedQuantity: newReceivedQty,
          status: itemStatus,
        },
      });

      // Create lot if lot tracking is enabled and lot number provided
      let lotId: string | undefined;
      if (inventoryItem.trackLots && receivedItem.lotNumber) {
        // Check if lot already exists
        let lot = await db.inventoryLot.findFirst({
          where: {
            clinicId: session.user.clinicId,
            itemId: inventoryItem.id,
            lotNumber: receivedItem.lotNumber,
          },
        });

        if (lot) {
          // Add to existing lot
          await db.inventoryLot.update({
            where: { id: lot.id },
            data: {
              currentQuantity: lot.currentQuantity + receivedItem.quantity,
              initialQuantity: lot.initialQuantity + receivedItem.quantity,
            },
          });
          lotId = lot.id;
        } else {
          // Create new lot
          lot = await db.inventoryLot.create({
            data: {
              clinicId: session.user.clinicId,
              itemId: inventoryItem.id,
              lotNumber: receivedItem.lotNumber,
              initialQuantity: receivedItem.quantity,
              currentQuantity: receivedItem.quantity,
              receivedDate: new Date(),
              expirationDate: receivedItem.expirationDate,
              purchaseOrderId: id,
              supplierId: purchaseOrder.supplierId,
              unitCost: poItem.unitPrice,
              storageLocation: receivedItem.storageLocation,
            },
          });
          lotId = lot.id;

          // Create expiration alert if needed
          if (receivedItem.expirationDate) {
            const daysUntilExpiry = Math.floor(
              (receivedItem.expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
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
                  itemId: inventoryItem.id,
                  lotId: lot.id,
                  alertLevel,
                  expirationDate: receivedItem.expirationDate,
                  daysUntilExpiry: Math.max(0, daysUntilExpiry),
                  quantity: receivedItem.quantity,
                  estimatedValue: receivedItem.quantity * poItem.unitPrice,
                },
              });
            }
          }
        }
      }

      // Create stock movement
      const previousStock = inventoryItem.currentStock;
      const newStock = previousStock + receivedItem.quantity;

      await db.stockMovement.create({
        data: {
          clinicId: session.user.clinicId,
          itemId: inventoryItem.id,
          lotId,
          movementType: 'RECEIVED',
          quantity: receivedItem.quantity,
          unitCost: poItem.unitPrice,
          referenceType: 'PURCHASE_ORDER',
          referenceId: id,
          previousStock,
          newStock,
          reason: `Received from PO ${purchaseOrder.poNumber}`,
          createdBy: session.user.id,
        },
      });

      // Update inventory item
      await db.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: {
          currentStock: newStock,
          availableStock: newStock - inventoryItem.reservedStock,
          lastCost: poItem.unitPrice,
          // Update average cost using weighted average
          averageCost: inventoryItem.averageCost
            ? ((inventoryItem.averageCost * previousStock) + (poItem.unitPrice * receivedItem.quantity)) / newStock
            : poItem.unitPrice,
          updatedBy: session.user.id,
        },
      });

      // Resolve reorder alerts for this item if stock is now above reorder point
      if (newStock > inventoryItem.reorderPoint) {
        await db.reorderAlert.updateMany({
          where: {
            itemId: inventoryItem.id,
            status: { in: ['ACTIVE', 'ORDERED'] },
          },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
          },
        });
      }
    }

    // Update PO status
    const updatedItems = await db.purchaseOrderItem.findMany({
      where: { purchaseOrderId: id },
    });

    const allReceived = updatedItems.every((item) => item.status === 'RECEIVED');
    const anyReceived = updatedItems.some(
      (item) => item.status === 'RECEIVED' || item.status === 'PARTIALLY_RECEIVED'
    );

    let newPoStatus = purchaseOrder.status;
    if (allReceived) {
      newPoStatus = 'RECEIVED';
    } else if (anyReceived) {
      newPoStatus = 'PARTIALLY_RECEIVED';
    }

    await db.purchaseOrder.update({
      where: { id },
      data: {
        status: newPoStatus,
        receivedDate: allReceived ? new Date() : undefined,
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'PurchaseOrderReceipt',
      entityId: receipt.id,
      details: {
        receiptNumber: receipt.receiptNumber,
        poNumber: purchaseOrder.poNumber,
        itemsReceived: data.items.length,
        totalQuantity: data.items.reduce((sum, item) => sum + item.quantity, 0),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          receipt,
          purchaseOrderStatus: newPoStatus,
        },
      },
      { status: 201 }
    );
  },
  { permissions: ['inventory:receive'] }
);

/**
 * GET /api/resources/purchase-orders/[id]/receive
 * Get all receipts for a purchase order
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Verify PO exists and belongs to clinic
    const purchaseOrder = await db.purchaseOrder.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      select: { id: true, poNumber: true },
    });

    if (!purchaseOrder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Purchase order not found',
          },
        },
        { status: 404 }
      );
    }

    const receipts = await db.purchaseOrderReceipt.findMany({
      where: { purchaseOrderId: id },
      orderBy: { receiptDate: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: {
        purchaseOrder,
        receipts,
      },
    });
  },
  { permissions: ['inventory:read'] }
);
