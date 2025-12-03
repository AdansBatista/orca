import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/resources/inventory/expiring
 * Get inventory lots that are expiring or expired
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    const daysAhead = parseInt(searchParams.get('days') ?? '90');
    const includeExpired = searchParams.get('includeExpired') !== 'false';
    const category = searchParams.get('category') ?? undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    // Build where clause for lots
    const where: Record<string, unknown> = {
      clinicId: session.user.clinicId,
      status: { in: ['AVAILABLE', 'RESERVED'] },
      expirationDate: { not: null },
    };

    if (includeExpired) {
      where.expirationDate = { lte: futureDate };
    } else {
      where.expirationDate = {
        gte: now,
        lte: futureDate,
      };
    }

    // Get expiring lots with item info
    const lots = await db.inventoryLot.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            name: true,
            sku: true,
            category: true,
            unitCost: true,
            supplier: {
              select: { id: true, name: true },
            },
          },
        },
        expirationAlerts: {
          where: { status: 'ACTIVE' },
          take: 1,
        },
      },
      orderBy: { expirationDate: 'asc' },
      take: limit,
    });

    // Filter by category if specified
    const filteredLots = category
      ? lots.filter((lot) => lot.item.category === category)
      : lots;

    // Calculate expiration status for each lot
    const expiringItems = filteredLots.map((lot) => {
      const daysUntilExpiry = lot.expirationDate
        ? Math.floor((lot.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      const expirationStatus = daysUntilExpiry === null
        ? 'UNKNOWN'
        : daysUntilExpiry < 0
          ? 'EXPIRED'
          : daysUntilExpiry <= 7
            ? 'CRITICAL'
            : daysUntilExpiry <= 30
              ? 'URGENT'
              : daysUntilExpiry <= 60
                ? 'CAUTION'
                : 'WARNING';

      return {
        ...lot,
        daysUntilExpiry,
        expirationStatus,
        estimatedValue: lot.currentQuantity * (lot.unitCost ?? lot.item.unitCost),
      };
    });

    // Calculate summary stats
    const expiredCount = expiringItems.filter((i) => i.expirationStatus === 'EXPIRED').length;
    const criticalCount = expiringItems.filter((i) => i.expirationStatus === 'CRITICAL').length;
    const urgentCount = expiringItems.filter((i) => i.expirationStatus === 'URGENT').length;
    const cautionCount = expiringItems.filter((i) => i.expirationStatus === 'CAUTION').length;
    const warningCount = expiringItems.filter((i) => i.expirationStatus === 'WARNING').length;

    const totalValueAtRisk = expiringItems.reduce(
      (sum, item) => sum + (item.estimatedValue || 0),
      0
    );

    const expiredValue = expiringItems
      .filter((i) => i.expirationStatus === 'EXPIRED')
      .reduce((sum, item) => sum + (item.estimatedValue || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        items: expiringItems,
        total: expiringItems.length,
        stats: {
          expired: expiredCount,
          critical: criticalCount,
          urgent: urgentCount,
          caution: cautionCount,
          warning: warningCount,
          totalValueAtRisk,
          expiredValue,
        },
      },
    });
  },
  { permissions: ['inventory:read'] }
);
