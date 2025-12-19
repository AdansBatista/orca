import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { costAnalyticsQuerySchema } from '@/lib/validations/inventory';

/**
 * GET /api/resources/inventory/analytics/cost
 * Get inventory cost analytics
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      groupBy: searchParams.get('groupBy') ?? undefined,
    };

    const queryResult = costAnalyticsQuerySchema.safeParse(rawParams);

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

    const { dateFrom, dateTo, category, groupBy } = queryResult.data;

    // Default date range: last 12 months
    const now = new Date();
    const defaultDateFrom = new Date(now);
    defaultDateFrom.setMonth(defaultDateFrom.getMonth() - 12);

    const effectiveDateFrom = dateFrom || defaultDateFrom;
    const effectiveDateTo = dateTo || now;

    // Get current inventory value
    const inventoryItems = await db.inventoryItem.findMany({
      where: withSoftDelete({
        ...getClinicFilter(session),
        ...(category ? { category } : {}),
      }),
      select: {
        id: true,
        name: true,
        sku: true,
        category: true,
        currentStock: true,
        unitCost: true,
        averageCost: true,
      },
    });

    const currentInventoryValue = inventoryItems.reduce(
      (sum, item) => sum + item.currentStock * Number(item.averageCost || item.unitCost || 0),
      0
    );

    const currentInventoryCount = inventoryItems.reduce(
      (sum, item) => sum + item.currentStock,
      0
    );

    // Get purchase orders in date range
    const purchaseOrders = await db.purchaseOrder.findMany({
      where: {
        ...getClinicFilter(session),
        status: { in: ['RECEIVED', 'PARTIALLY_RECEIVED', 'CLOSED'] },
        orderDate: {
          gte: effectiveDateFrom,
          lte: effectiveDateTo,
        },
      },
      include: {
        supplier: { select: { id: true, name: true, code: true } },
        items: {
          include: {
            item: { select: { id: true, name: true, sku: true, category: true } },
          },
        },
      },
    });

    // Calculate purchase totals
    const totalPurchases = purchaseOrders.reduce(
      (sum, po) => sum + Number(po.totalAmount || 0),
      0
    );

    const totalItemsPurchased = purchaseOrders.reduce(
      (sum, po) => sum + po.items.reduce((itemSum, item) => itemSum + item.receivedQuantity, 0),
      0
    );

    // Group by selected dimension
    type GroupedCosts = Record<string, {
      label: string;
      purchaseCost: number;
      itemCount: number;
      orderCount: number;
    }>;
    const groupedCosts: GroupedCosts = {};

    for (const po of purchaseOrders) {
      let key: string;
      let label: string;

      switch (groupBy) {
        case 'supplier':
          key = po.supplierId;
          label = po.supplier.name;
          break;
        case 'month':
          if (po.orderDate) {
            key = `${po.orderDate.getFullYear()}-${String(po.orderDate.getMonth() + 1).padStart(2, '0')}`;
            label = po.orderDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            });
          } else {
            key = 'unknown';
            label = 'Unknown';
          }
          break;
        case 'category':
        default:
          // For category, we need to break down by items
          for (const item of po.items) {
            const catKey = item.item.category;
            const catLabel = item.item.category.replace(/_/g, ' ').toLowerCase();

            if (!groupedCosts[catKey]) {
              groupedCosts[catKey] = {
                label: catLabel.charAt(0).toUpperCase() + catLabel.slice(1),
                purchaseCost: 0,
                itemCount: 0,
                orderCount: 0,
              };
            }

            groupedCosts[catKey].purchaseCost += Number(item.lineTotal || 0);
            groupedCosts[catKey].itemCount += item.receivedQuantity;
          }
          continue; // Skip the generic grouping below
      }

      if (!groupedCosts[key]) {
        groupedCosts[key] = {
          label,
          purchaseCost: 0,
          itemCount: 0,
          orderCount: 0,
        };
      }

      groupedCosts[key].purchaseCost += Number(po.totalAmount || 0);
      groupedCosts[key].itemCount += po.items.reduce(
        (sum, item) => sum + item.receivedQuantity,
        0
      );
      groupedCosts[key].orderCount += 1;
    }

    // Convert to array
    const chartData = Object.entries(groupedCosts)
      .map(([key, value]) => ({
        key,
        label: value.label,
        purchaseCost: Number(value.purchaseCost.toFixed(2)),
        itemCount: value.itemCount,
        orderCount: value.orderCount,
        averageCostPerItem: value.itemCount > 0
          ? Number((value.purchaseCost / value.itemCount).toFixed(2))
          : 0,
      }))
      .sort((a, b) => b.purchaseCost - a.purchaseCost);

    // Get inventory value by category
    const categoryValues: Record<string, { value: number; count: number; items: number }> = {};
    for (const item of inventoryItems) {
      if (!categoryValues[item.category]) {
        categoryValues[item.category] = { value: 0, count: 0, items: 0 };
      }
      categoryValues[item.category].value += item.currentStock * Number(item.averageCost || item.unitCost || 0);
      categoryValues[item.category].count += item.currentStock;
      categoryValues[item.category].items += 1;
    }

    const inventoryByCategory = Object.entries(categoryValues)
      .map(([category, data]) => ({
        category,
        label: category.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
        value: Number(data.value.toFixed(2)),
        stockCount: data.count,
        itemTypes: data.items,
      }))
      .sort((a, b) => b.value - a.value);

    // Calculate turnover (rough estimate)
    const usageMovements = await db.stockMovement.count({
      where: {
        ...getClinicFilter(session),
        movementType: 'USED',
        createdAt: {
          gte: effectiveDateFrom,
          lte: effectiveDateTo,
        },
      },
    });

    const monthsDiff = Math.ceil(
      (effectiveDateTo.getTime() - effectiveDateFrom.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          currentInventoryValue: Number(currentInventoryValue.toFixed(2)),
          currentInventoryCount,
          totalPurchases: Number(totalPurchases.toFixed(2)),
          totalItemsPurchased,
          purchaseOrderCount: purchaseOrders.length,
          averageOrderValue: purchaseOrders.length > 0
            ? Number((totalPurchases / purchaseOrders.length).toFixed(2))
            : 0,
          dateRange: {
            from: effectiveDateFrom,
            to: effectiveDateTo,
            months: monthsDiff,
          },
        },
        chartData,
        inventoryByCategory,
        topExpensiveItems: inventoryItems
          .map((item) => ({
            id: item.id,
            name: item.name,
            sku: item.sku,
            category: item.category,
            currentStock: item.currentStock,
            unitCost: Number(item.unitCost || 0),
            totalValue: Number((item.currentStock * Number(item.averageCost || item.unitCost || 0)).toFixed(2)),
          }))
          .sort((a, b) => b.totalValue - a.totalValue)
          .slice(0, 10),
      },
    });
  },
  { permissions: ['inventory:read'] }
);
