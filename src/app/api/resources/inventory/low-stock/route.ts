import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { InventoryCategory } from '@prisma/client';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/resources/inventory/low-stock
 * Get inventory items that are low on stock
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const includeOutOfStock = searchParams.get('includeOutOfStock') !== 'false';
    const categoryParam = searchParams.get('category');
    const category = categoryParam as InventoryCategory | undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    // Get all items to check against their reorder points
    const items = await db.inventoryItem.findMany({
      where: withSoftDelete({
        ...getClinicFilter(session),
        status: 'ACTIVE' as const,
        ...(category ? { category } : {}),
      }),
      include: {
        supplier: {
          select: { id: true, name: true, code: true },
        },
        reorderAlerts: {
          where: { status: 'ACTIVE' },
          orderBy: { alertDate: 'desc' },
          take: 1,
        },
      },
    });

    // Filter items where currentStock <= reorderPoint
    const lowStockItems = items
      .filter((item) => {
        if (item.currentStock === 0) {
          return includeOutOfStock;
        }
        return item.currentStock <= item.reorderPoint;
      })
      .map((item) => ({
        ...item,
        stockStatus: item.currentStock === 0
          ? 'OUT_OF_STOCK'
          : item.currentStock <= item.safetyStock
            ? 'CRITICAL'
            : 'LOW',
        suggestedOrderQuantity: item.reorderQuantity,
        daysOfStockRemaining: item.averageDailyUsage && item.averageDailyUsage > 0
          ? Math.floor(item.currentStock / item.averageDailyUsage)
          : null,
      }))
      .sort((a, b) => {
        // Sort by criticality: OUT_OF_STOCK > CRITICAL > LOW
        const priority: Record<string, number> = { OUT_OF_STOCK: 0, CRITICAL: 1, LOW: 2 };
        return priority[a.stockStatus] - priority[b.stockStatus];
      })
      .slice(0, limit);

    // Get summary stats
    const outOfStockCount = lowStockItems.filter((i) => i.stockStatus === 'OUT_OF_STOCK').length;
    const criticalCount = lowStockItems.filter((i) => i.stockStatus === 'CRITICAL').length;
    const lowCount = lowStockItems.filter((i) => i.stockStatus === 'LOW').length;

    // Calculate total suggested order value
    const totalSuggestedValue = lowStockItems.reduce(
      (sum, item) => sum + item.suggestedOrderQuantity * item.unitCost,
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        items: lowStockItems,
        total: lowStockItems.length,
        stats: {
          outOfStock: outOfStockCount,
          critical: criticalCount,
          low: lowCount,
          totalSuggestedOrderValue: totalSuggestedValue,
        },
      },
    });
  },
  { permissions: ['inventory:read'] }
);
