import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { inventoryCountSchema } from '@/lib/validations/inventory';

/**
 * POST /api/resources/inventory/count
 * Submit inventory count results and record variances
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = inventoryCountSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid inventory count data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { counts, countDate, notes } = result.data;

    // Process each count
    const results = [];
    const variances = [];

    for (const count of counts) {
      // Get the item
      const item = await db.inventoryItem.findFirst({
        where: {
          id: count.itemId,
          ...getClinicFilter(session),
          deletedAt: null,
        },
      });

      if (!item) {
        results.push({
          itemId: count.itemId,
          success: false,
          error: 'Item not found',
        });
        continue;
      }

      // Calculate variance
      let previousStock = item.currentStock;
      let lotPreviousStock: number | null = null;

      // If lot is specified, get lot stock
      if (count.lotId) {
        const lot = await db.inventoryLot.findFirst({
          where: {
            id: count.lotId,
            itemId: count.itemId,
            clinicId: session.user.clinicId,
          },
        });

        if (!lot) {
          results.push({
            itemId: count.itemId,
            lotId: count.lotId,
            success: false,
            error: 'Lot not found',
          });
          continue;
        }

        lotPreviousStock = lot.currentQuantity;
        previousStock = lot.currentQuantity;
      }

      const variance = count.countedQuantity - previousStock;

      // If there's a variance, create stock movement and update stock
      if (variance !== 0) {
        // Create stock movement for variance
        await db.stockMovement.create({
          data: {
            clinicId: session.user.clinicId,
            itemId: count.itemId,
            lotId: count.lotId || undefined,
            movementType: 'COUNT_VARIANCE',
            quantity: variance,
            previousStock,
            newStock: count.countedQuantity,
            referenceType: 'INVENTORY_COUNT',
            reason: 'Physical inventory count variance',
            notes: count.notes || notes,
            createdBy: session.user.id,
          },
        });

        // Update item stock
        if (count.lotId) {
          // Update lot quantity
          await db.inventoryLot.update({
            where: { id: count.lotId },
            data: { currentQuantity: count.countedQuantity },
          });

          // Recalculate total item stock from all lots
          const allLots = await db.inventoryLot.findMany({
            where: {
              itemId: count.itemId,
              clinicId: session.user.clinicId,
              status: { in: ['AVAILABLE', 'RESERVED'] },
            },
          });
          const totalStock = allLots.reduce((sum, lot) => sum + lot.currentQuantity, 0);

          await db.inventoryItem.update({
            where: { id: count.itemId },
            data: {
              currentStock: totalStock,
              availableStock: totalStock - item.reservedStock,
              updatedBy: session.user.id,
            },
          });
        } else {
          // Update item directly
          await db.inventoryItem.update({
            where: { id: count.itemId },
            data: {
              currentStock: count.countedQuantity,
              availableStock: count.countedQuantity - item.reservedStock,
              updatedBy: session.user.id,
            },
          });
        }

        // Check for reorder alerts
        const updatedItem = await db.inventoryItem.findUnique({
          where: { id: count.itemId },
        });

        if (updatedItem && updatedItem.currentStock <= updatedItem.reorderPoint) {
          // Check if alert already exists
          const existingAlert = await db.reorderAlert.findFirst({
            where: {
              clinicId: session.user.clinicId,
              itemId: count.itemId,
              status: 'ACTIVE',
            },
          });

          if (!existingAlert) {
            const alertType = updatedItem.currentStock === 0
              ? 'OUT_OF_STOCK'
              : updatedItem.currentStock <= updatedItem.safetyStock
                ? 'CRITICAL_STOCK'
                : 'LOW_STOCK';

            await db.reorderAlert.create({
              data: {
                clinicId: session.user.clinicId,
                itemId: count.itemId,
                alertType,
                currentStock: updatedItem.currentStock,
                reorderPoint: updatedItem.reorderPoint,
                suggestedQuantity: updatedItem.reorderQuantity,
              },
            });
          }
        }

        variances.push({
          itemId: count.itemId,
          itemName: item.name,
          sku: item.sku,
          lotId: count.lotId,
          previousStock,
          countedQuantity: count.countedQuantity,
          variance,
        });
      }

      results.push({
        itemId: count.itemId,
        lotId: count.lotId,
        success: true,
        previousStock,
        countedQuantity: count.countedQuantity,
        variance,
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'InventoryCount',
      entityId: `count-${countDate.toISOString()}`,
      details: {
        countDate,
        totalItems: counts.length,
        varianceCount: variances.length,
        variances: variances.map((v) => ({
          sku: v.sku,
          variance: v.variance,
        })),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        countDate,
        totalCounted: counts.length,
        results,
        variances,
        summary: {
          itemsWithVariance: variances.length,
          totalPositiveVariance: variances
            .filter((v) => v.variance > 0)
            .reduce((sum, v) => sum + v.variance, 0),
          totalNegativeVariance: variances
            .filter((v) => v.variance < 0)
            .reduce((sum, v) => sum + v.variance, 0),
        },
      },
    });
  },
  { permissions: ['inventory:adjust'] }
);
