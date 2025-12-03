import { NextResponse } from 'next/server';
import type { Prisma, InventoryCategory } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { usageAnalyticsQuerySchema } from '@/lib/validations/inventory';

/**
 * GET /api/resources/inventory/analytics/usage
 * Get inventory usage analytics
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      itemId: searchParams.get('itemId') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      groupBy: searchParams.get('groupBy') ?? undefined,
      providerId: searchParams.get('providerId') ?? undefined,
    };

    const queryResult = usageAnalyticsQuerySchema.safeParse(rawParams);

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

    const { itemId, category, dateFrom, dateTo, groupBy, providerId } = queryResult.data;

    // Default date range: last 30 days
    const now = new Date();
    const defaultDateFrom = new Date(now);
    defaultDateFrom.setDate(defaultDateFrom.getDate() - 30);

    const effectiveDateFrom = dateFrom || defaultDateFrom;
    const effectiveDateTo = dateTo || now;

    // Build where clause for stock movements (USED type only)
    const where: Prisma.StockMovementWhereInput = {
      ...getClinicFilter(session),
      movementType: 'USED',
      createdAt: {
        gte: effectiveDateFrom,
        lte: effectiveDateTo,
      },
    };

    if (itemId) where.itemId = itemId;
    if (providerId) where.providerId = providerId;
    if (category) where.item = { category: category as InventoryCategory };

    // Get usage data
    const movements = await db.stockMovement.findMany({
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
      },
      orderBy: { createdAt: 'asc' },
    });

    // Calculate total usage
    const totalUsage = movements.reduce((sum, m) => sum + Math.abs(m.quantity), 0);
    const totalCost = movements.reduce(
      (sum, m) => sum + Math.abs(m.quantity) * Number(m.unitCost || m.item.unitCost || 0),
      0
    );

    // Group data based on groupBy parameter
    type GroupedData = Record<string, { label: string; quantity: number; cost: number; items: Set<string> }>;
    const groupedData: GroupedData = {};

    for (const movement of movements) {
      let key: string;
      let label: string;

      switch (groupBy) {
        case 'day':
          key = movement.createdAt.toISOString().split('T')[0];
          label = key;
          break;
        case 'week':
          const weekStart = new Date(movement.createdAt);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          key = weekStart.toISOString().split('T')[0];
          label = `Week of ${key}`;
          break;
        case 'month':
        default:
          key = `${movement.createdAt.getFullYear()}-${String(movement.createdAt.getMonth() + 1).padStart(2, '0')}`;
          label = new Date(movement.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
          });
          break;
        case 'provider':
          key = movement.providerId || 'unknown';
          label = movement.providerId ? `Provider ${movement.providerId.slice(-6)}` : 'Unknown';
          break;
        case 'procedure':
          key = movement.procedureId || 'unknown';
          label = movement.procedureId ? `Procedure ${movement.procedureId.slice(-6)}` : 'Unknown';
          break;
      }

      if (!groupedData[key]) {
        groupedData[key] = {
          label,
          quantity: 0,
          cost: 0,
          items: new Set(),
        };
      }

      groupedData[key].quantity += Math.abs(movement.quantity);
      groupedData[key].cost += Math.abs(movement.quantity) * Number(movement.unitCost || movement.item.unitCost || 0);
      groupedData[key].items.add(movement.itemId);
    }

    // Convert to array and sort
    const chartData = Object.entries(groupedData)
      .map(([key, value]) => ({
        key,
        label: value.label,
        quantity: value.quantity,
        cost: Number(value.cost.toFixed(2)),
        uniqueItems: value.items.size,
      }))
      .sort((a, b) => a.key.localeCompare(b.key));

    // Get top used items
    const itemUsage: Record<string, { item: typeof movements[0]['item']; quantity: number; cost: number }> = {};
    for (const movement of movements) {
      if (!itemUsage[movement.itemId]) {
        itemUsage[movement.itemId] = {
          item: movement.item,
          quantity: 0,
          cost: 0,
        };
      }
      itemUsage[movement.itemId].quantity += Math.abs(movement.quantity);
      itemUsage[movement.itemId].cost += Math.abs(movement.quantity) * Number(movement.unitCost || movement.item.unitCost || 0);
    }

    const topItems = Object.values(itemUsage)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((u) => ({
        id: u.item.id,
        name: u.item.name,
        sku: u.item.sku,
        category: u.item.category,
        quantity: u.quantity,
        cost: Number(u.cost.toFixed(2)),
      }));

    // Calculate average daily usage
    const daysDiff = Math.ceil(
      (effectiveDateTo.getTime() - effectiveDateFrom.getTime()) / (1000 * 60 * 60 * 24)
    );
    const averageDailyUsage = daysDiff > 0 ? totalUsage / daysDiff : 0;
    const averageDailyCost = daysDiff > 0 ? totalCost / daysDiff : 0;

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalUsage,
          totalCost: Number(totalCost.toFixed(2)),
          averageDailyUsage: Number(averageDailyUsage.toFixed(2)),
          averageDailyCost: Number(averageDailyCost.toFixed(2)),
          uniqueItems: new Set(movements.map((m) => m.itemId)).size,
          dateRange: {
            from: effectiveDateFrom,
            to: effectiveDateTo,
            days: daysDiff,
          },
        },
        chartData,
        topItems,
      },
    });
  },
  { permissions: ['inventory:read'] }
);
