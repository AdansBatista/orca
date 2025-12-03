import { NextResponse } from 'next/server';
import type { Prisma, StockMovementType } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { wasteAnalyticsQuerySchema } from '@/lib/validations/inventory';

/**
 * GET /api/resources/inventory/analytics/waste
 * Get inventory waste analytics (expired, damaged, lost items)
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      wasteType: searchParams.get('wasteType') ?? undefined,
      itemId: searchParams.get('itemId') ?? undefined,
    };

    const queryResult = wasteAnalyticsQuerySchema.safeParse(rawParams);

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

    const { dateFrom, dateTo, wasteType, itemId } = queryResult.data;

    // Default date range: last 12 months
    const now = new Date();
    const defaultDateFrom = new Date(now);
    defaultDateFrom.setMonth(defaultDateFrom.getMonth() - 12);

    const effectiveDateFrom = dateFrom || defaultDateFrom;
    const effectiveDateTo = dateTo || now;

    // Waste movement types
    const wasteMovementTypes: StockMovementType[] = ['EXPIRED', 'DAMAGED', 'LOST', 'RECALLED'];

    // Build where clause
    const where: Prisma.StockMovementWhereInput = {
      ...getClinicFilter(session),
      movementType: wasteType
        ? (wasteType.toUpperCase() as StockMovementType)
        : { in: wasteMovementTypes },
      createdAt: {
        gte: effectiveDateFrom,
        lte: effectiveDateTo,
      },
    };

    if (itemId) where.itemId = itemId;

    // Get waste movements
    const wasteMovements = await db.stockMovement.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            unitCost: true,
          },
        },
        lot: {
          select: {
            id: true,
            lotNumber: true,
            expirationDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate totals
    const totalWasteQuantity = wasteMovements.reduce(
      (sum, m) => sum + Math.abs(m.quantity),
      0
    );

    const totalWasteCost = wasteMovements.reduce(
      (sum, m) => sum + Math.abs(m.quantity) * Number(m.unitCost || m.item.unitCost || 0),
      0
    );

    // Group by waste type
    const wasteByType: Record<string, { quantity: number; cost: number; count: number }> = {};
    for (const movement of wasteMovements) {
      const type = movement.movementType;
      if (!wasteByType[type]) {
        wasteByType[type] = { quantity: 0, cost: 0, count: 0 };
      }
      wasteByType[type].quantity += Math.abs(movement.quantity);
      wasteByType[type].cost += Math.abs(movement.quantity) * Number(movement.unitCost || movement.item.unitCost || 0);
      wasteByType[type].count += 1;
    }

    const wasteTypeBreakdown = Object.entries(wasteByType).map(([type, data]) => ({
      type,
      label: type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
      quantity: data.quantity,
      cost: Number(data.cost.toFixed(2)),
      incidents: data.count,
      percentage: totalWasteCost > 0
        ? Number(((data.cost / totalWasteCost) * 100).toFixed(1))
        : 0,
    }));

    // Group by month for trend data
    const wasteByMonth: Record<string, { quantity: number; cost: number }> = {};
    for (const movement of wasteMovements) {
      const monthKey = `${movement.createdAt.getFullYear()}-${String(movement.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (!wasteByMonth[monthKey]) {
        wasteByMonth[monthKey] = { quantity: 0, cost: 0 };
      }
      wasteByMonth[monthKey].quantity += Math.abs(movement.quantity);
      wasteByMonth[monthKey].cost += Math.abs(movement.quantity) * Number(movement.unitCost || movement.item.unitCost || 0);
    }

    const trendData = Object.entries(wasteByMonth)
      .map(([month, data]) => ({
        month,
        label: new Date(month + '-01').toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
        }),
        quantity: data.quantity,
        cost: Number(data.cost.toFixed(2)),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Group by item for top wasted items
    const wasteByItem: Record<string, {
      item: typeof wasteMovements[0]['item'];
      quantity: number;
      cost: number;
      incidents: number;
    }> = {};
    for (const movement of wasteMovements) {
      if (!wasteByItem[movement.itemId]) {
        wasteByItem[movement.itemId] = {
          item: movement.item,
          quantity: 0,
          cost: 0,
          incidents: 0,
        };
      }
      wasteByItem[movement.itemId].quantity += Math.abs(movement.quantity);
      wasteByItem[movement.itemId].cost += Math.abs(movement.quantity) * Number(movement.unitCost || movement.item.unitCost || 0);
      wasteByItem[movement.itemId].incidents += 1;
    }

    const topWastedItems = Object.values(wasteByItem)
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 10)
      .map((w) => ({
        id: w.item.id,
        name: w.item.name,
        sku: w.item.sku,
        category: w.item.category,
        quantity: w.quantity,
        cost: Number(w.cost.toFixed(2)),
        incidents: w.incidents,
      }));

    // Group by category
    const wasteByCategory: Record<string, { quantity: number; cost: number }> = {};
    for (const movement of wasteMovements) {
      const category = movement.item.category;
      if (!wasteByCategory[category]) {
        wasteByCategory[category] = { quantity: 0, cost: 0 };
      }
      wasteByCategory[category].quantity += Math.abs(movement.quantity);
      wasteByCategory[category].cost += Math.abs(movement.quantity) * Number(movement.unitCost || movement.item.unitCost || 0);
    }

    const categoryBreakdown = Object.entries(wasteByCategory)
      .map(([category, data]) => ({
        category,
        label: category.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase()),
        quantity: data.quantity,
        cost: Number(data.cost.toFixed(2)),
      }))
      .sort((a, b) => b.cost - a.cost);

    // Get expiring items (for preventive action)
    const expiringItems = await db.inventoryLot.findMany({
      where: {
        clinicId: session.user.clinicId,
        status: 'AVAILABLE',
        expirationDate: {
          gte: now,
          lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000), // Next 90 days
        },
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            unitCost: true,
          },
        },
      },
      orderBy: { expirationDate: 'asc' },
    });

    const atRiskValue = expiringItems.reduce(
      (sum, lot) => sum + lot.currentQuantity * Number(lot.unitCost || lot.item.unitCost || 0),
      0
    );

    // Calculate months in range
    const monthsDiff = Math.ceil(
      (effectiveDateTo.getTime() - effectiveDateFrom.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalWasteQuantity,
          totalWasteCost: Number(totalWasteCost.toFixed(2)),
          totalIncidents: wasteMovements.length,
          averageMonthlyWaste: monthsDiff > 0
            ? Number((totalWasteCost / monthsDiff).toFixed(2))
            : 0,
          atRiskValue: Number(atRiskValue.toFixed(2)),
          expiringItemCount: expiringItems.length,
          dateRange: {
            from: effectiveDateFrom,
            to: effectiveDateTo,
            months: monthsDiff,
          },
        },
        wasteTypeBreakdown,
        trendData,
        topWastedItems,
        categoryBreakdown,
        expiringItems: expiringItems.slice(0, 10).map((lot) => ({
          itemId: lot.itemId,
          itemName: lot.item.name,
          itemSku: lot.item.sku,
          lotNumber: lot.lotNumber,
          currentQuantity: lot.currentQuantity,
          expirationDate: lot.expirationDate,
          daysUntilExpiry: lot.expirationDate
            ? Math.ceil((lot.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            : null,
          atRiskValue: Number(
            (lot.currentQuantity * Number(lot.unitCost || lot.item.unitCost || 0)).toFixed(2)
          ),
        })),
      },
    });
  },
  { permissions: ['inventory:read'] }
);
