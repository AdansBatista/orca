import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { stockMovementQuerySchema } from '@/lib/validations/inventory';

/**
 * GET /api/resources/inventory/[id]/movements
 * Get stock movement history for an inventory item
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      movementType: searchParams.get('movementType') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      providerId: searchParams.get('providerId') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = stockMovementQuerySchema.safeParse(rawParams);

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

    const {
      movementType,
      patientId,
      providerId,
      dateFrom,
      dateTo,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Verify item exists and belongs to clinic
    const inventoryItem = await db.inventoryItem.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      select: { id: true, name: true, sku: true },
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

    // Build where clause
    const where: Record<string, unknown> = {
      itemId: id,
      clinicId: session.user.clinicId,
    };

    if (movementType) where.movementType = movementType;
    if (patientId) where.patientId = patientId;
    if (providerId) where.providerId = providerId;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, Date>).gte = dateFrom;
      if (dateTo) (where.createdAt as Record<string, Date>).lte = dateTo;
    }

    // Get total count
    const total = await db.stockMovement.count({ where });

    // Get paginated results
    const movements = await db.stockMovement.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        lot: {
          select: { id: true, lotNumber: true, expirationDate: true },
        },
      },
    });

    // Calculate summary stats
    const stats = await db.stockMovement.aggregate({
      where: { itemId: id, clinicId: session.user.clinicId },
      _sum: {
        quantity: true,
      },
      _count: true,
    });

    // Get breakdown by movement type
    const byType = await db.stockMovement.groupBy({
      by: ['movementType'],
      where: { itemId: id, clinicId: session.user.clinicId },
      _sum: {
        quantity: true,
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        item: inventoryItem,
        movements,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          totalMovements: stats._count,
          netQuantityChange: stats._sum.quantity || 0,
          byType: byType.map((t) => ({
            type: t.movementType,
            count: t._count,
            quantity: t._sum.quantity || 0,
          })),
        },
      },
    });
  },
  { permissions: ['inventory:read'] }
);
