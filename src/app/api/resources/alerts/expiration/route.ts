import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { expirationAlertQuerySchema, expirationAlertActionSchema } from '@/lib/validations/inventory';

/**
 * GET /api/resources/alerts/expiration
 * List expiration alerts with filters
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      alertLevel: searchParams.get('alertLevel') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      itemId: searchParams.get('itemId') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = expirationAlertQuerySchema.safeParse(rawParams);

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
      alertLevel,
      status,
      itemId,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (alertLevel) where.alertLevel = alertLevel;
    if (status) where.status = status;
    if (itemId) where.itemId = itemId;

    // Get total count
    const total = await db.expirationAlert.count({ where });

    // Get paginated results
    const alerts = await db.expirationAlert.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        lot: {
          select: {
            id: true,
            lotNumber: true,
            currentQuantity: true,
            expirationDate: true,
            storageLocation: true,
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
          },
        },
      },
    });

    // Get summary stats
    const stats = await db.expirationAlert.groupBy({
      by: ['alertLevel'],
      where: { ...getClinicFilter(session), status: 'ACTIVE' },
      _count: true,
      _sum: { estimatedValue: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: alerts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          byLevel: stats.map((s) => ({
            level: s.alertLevel,
            count: s._count,
            value: s._sum.estimatedValue || 0,
          })),
          totalActive: stats.reduce((sum, s) => sum + s._count, 0),
          totalValueAtRisk: stats.reduce((sum, s) => sum + (s._sum.estimatedValue || 0), 0),
        },
      },
    });
  },
  { permissions: ['inventory:read'] }
);

/**
 * PUT /api/resources/alerts/expiration
 * Take action on an expiration alert
 */
export const PUT = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();
    const { alertId, ...actionData } = body;

    if (!alertId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Alert ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Validate action data
    const result = expirationAlertActionSchema.safeParse(actionData);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid action data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { action, notes } = result.data;

    // Get the alert with lot and item info
    const alert = await db.expirationAlert.findFirst({
      where: {
        id: alertId,
        ...getClinicFilter(session),
      },
      include: {
        lot: {
          include: {
            item: true,
          },
        },
      },
    });

    if (!alert) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Alert not found',
          },
        },
        { status: 404 }
      );
    }

    if (alert.status === 'RESOLVED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALERT_RESOLVED',
            message: 'Alert has already been resolved',
          },
        },
        { status: 400 }
      );
    }

    // Update the alert
    const updatedAlert = await db.expirationAlert.update({
      where: { id: alertId },
      data: {
        status: 'RESOLVED',
        action,
        actionDate: new Date(),
        actionBy: session.user.id,
        actionNotes: notes,
      },
    });

    // Handle action-specific updates
    const lot = alert.lot;
    const item = lot.item;

    switch (action) {
      case 'DISCARDED':
        // Mark lot as expired and reduce stock
        await db.inventoryLot.update({
          where: { id: lot.id },
          data: { status: 'EXPIRED' },
        });

        // Create stock movement for discarded items
        await db.stockMovement.create({
          data: {
            clinicId: session.user.clinicId,
            itemId: item.id,
            lotId: lot.id,
            movementType: 'EXPIRED',
            quantity: -lot.currentQuantity,
            unitCost: lot.unitCost || item.unitCost,
            previousStock: item.currentStock,
            newStock: item.currentStock - lot.currentQuantity,
            reason: `Lot ${lot.lotNumber} expired and discarded`,
            notes,
            createdBy: session.user.id,
          },
        });

        // Update inventory item
        await db.inventoryItem.update({
          where: { id: item.id },
          data: {
            currentStock: item.currentStock - lot.currentQuantity,
            availableStock: item.availableStock - lot.currentQuantity,
            updatedBy: session.user.id,
          },
        });

        // Create waste record
        await db.wasteRecord.create({
          data: {
            clinicId: session.user.clinicId,
            itemId: item.id,
            lotId: lot.id,
            wasteType: 'EXPIRED',
            quantity: lot.currentQuantity,
            unitCost: lot.unitCost || item.unitCost,
            totalValue: lot.currentQuantity * (lot.unitCost || item.unitCost),
            reason: `Expired on ${lot.expirationDate?.toLocaleDateString()}`,
            notes,
            createdBy: session.user.id,
          },
        });
        break;

      case 'USED':
        // Just mark as resolved - stock should have been updated via usage
        break;

      case 'RETURNED':
        // Similar to discarded but movement type is different
        await db.inventoryLot.update({
          where: { id: lot.id },
          data: { status: 'DEPLETED' },
        });

        await db.stockMovement.create({
          data: {
            clinicId: session.user.clinicId,
            itemId: item.id,
            lotId: lot.id,
            movementType: 'RETURNED_TO_SUPPLIER',
            quantity: -lot.currentQuantity,
            unitCost: lot.unitCost || item.unitCost,
            previousStock: item.currentStock,
            newStock: item.currentStock - lot.currentQuantity,
            reason: `Lot ${lot.lotNumber} returned to supplier (expiring)`,
            notes,
            createdBy: session.user.id,
          },
        });

        await db.inventoryItem.update({
          where: { id: item.id },
          data: {
            currentStock: item.currentStock - lot.currentQuantity,
            availableStock: item.availableStock - lot.currentQuantity,
            updatedBy: session.user.id,
          },
        });
        break;

      case 'EXTENDED':
        // Update lot expiration date - this should be done via lot update endpoint
        // Just mark alert as resolved
        break;

      case 'TRANSFERRED':
        // Transfer should be handled via transfer system
        // Just mark alert as resolved
        break;
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ExpirationAlert',
      entityId: alertId,
      details: {
        operation: action,
        itemSku: item.sku,
        itemName: item.name,
        lotNumber: lot.lotNumber,
        quantity: lot.currentQuantity,
        notes,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedAlert,
    });
  },
  { permissions: ['inventory:adjust'] }
);
