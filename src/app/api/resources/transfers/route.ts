import { NextResponse } from 'next/server';
import type { Prisma, TransferStatus } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createInventoryTransferSchema,
  transferQuerySchema,
} from '@/lib/validations/inventory';

/**
 * GET /api/resources/transfers
 * List inventory transfers with pagination and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      status: searchParams.get('status') ?? undefined,
      direction: searchParams.get('direction') ?? undefined,
      isUrgent: searchParams.get('isUrgent') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = transferQuerySchema.safeParse(rawParams);

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
      status,
      direction,
      isUrgent,
      dateFrom,
      dateTo,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause based on direction and user role
    const clinicFilter = getClinicFilter(session);
    const where: Prisma.InventoryTransferWhereInput = {};

    // Super admin (empty clinicFilter) sees all transfers
    // Regular users see only transfers involving their clinic(s)
    if (Object.keys(clinicFilter).length > 0) {
      const clinicId = session.user.clinicId;
      // Filter by direction for non-super-admin users
      if (direction === 'incoming') {
        where.toClinicId = clinicId;
      } else if (direction === 'outgoing') {
        where.fromClinicId = clinicId;
      } else {
        // All transfers involving this clinic
        where.OR = [{ fromClinicId: clinicId }, { toClinicId: clinicId }];
      }
    } else {
      // Super admin: optionally filter by direction if specified
      // but without clinic restriction
      if (direction === 'incoming' || direction === 'outgoing') {
        // Direction filter only makes sense with a specific clinic context
        // For super admin viewing all, we ignore direction filter
      }
    }

    if (status) where.status = status as TransferStatus;
    if (isUrgent !== undefined) where.isUrgent = isUrgent;

    if (dateFrom || dateTo) {
      where.requestedDate = {};
      if (dateFrom) where.requestedDate.gte = dateFrom;
      if (dateTo) where.requestedDate.lte = dateTo;
    }

    // Get total count
    const total = await db.inventoryTransfer.count({ where });

    // Get paginated results
    const transfers = await db.inventoryTransfer.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
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

    return NextResponse.json({
      success: true,
      data: {
        items: transfers,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['inventory:read'] }
);

/**
 * POST /api/resources/transfers
 * Create a new inventory transfer request
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createInventoryTransferSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid transfer data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify destination clinic exists
    const toClinic = await db.clinic.findUnique({
      where: { id: data.toClinicId },
    });

    if (!toClinic) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_CLINIC',
            message: 'Destination clinic not found',
          },
        },
        { status: 400 }
      );
    }

    // Verify all items exist and have sufficient stock
    const itemValidation = [];
    for (const item of data.items) {
      const inventoryItem = await db.inventoryItem.findFirst({
        where: {
          id: item.itemId,
          clinicId: session.user.clinicId,
          deletedAt: null,
        },
      });

      if (!inventoryItem) {
        itemValidation.push({
          itemId: item.itemId,
          error: 'Item not found',
        });
        continue;
      }

      if (inventoryItem.availableStock < item.requestedQuantity) {
        itemValidation.push({
          itemId: item.itemId,
          itemName: inventoryItem.name,
          error: `Insufficient stock. Available: ${inventoryItem.availableStock}, Requested: ${item.requestedQuantity}`,
        });
      }
    }

    if (itemValidation.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'One or more items have validation errors',
            details: itemValidation,
          },
        },
        { status: 400 }
      );
    }

    // Generate transfer number
    const year = new Date().getFullYear();
    const transferCount = await db.inventoryTransfer.count({
      where: {
        transferNumber: { startsWith: `TRF-${year}` },
      },
    });
    const transferNumber = `TRF-${year}-${String(transferCount + 1).padStart(5, '0')}`;

    // Create the transfer with items in a transaction
    const transfer = await db.$transaction(async (tx) => {
      // Create transfer
      const newTransfer = await tx.inventoryTransfer.create({
        data: {
          fromClinicId: session.user.clinicId,
          toClinicId: data.toClinicId,
          transferNumber,
          status: 'REQUESTED',
          reason: data.reason,
          notes: data.notes,
          isUrgent: data.isUrgent,
          requestedBy: session.user.id,
        },
      });

      // Create transfer items
      for (const item of data.items) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: item.itemId },
        });

        await tx.transferItem.create({
          data: {
            transferId: newTransfer.id,
            itemId: item.itemId,
            lotId: item.lotId || undefined,
            requestedQuantity: item.requestedQuantity,
            status: 'REQUESTED',
          },
        });

        // Reserve the stock (mark as reserved so it can't be used)
        if (inventoryItem) {
          await tx.inventoryItem.update({
            where: { id: item.itemId },
            data: {
              reservedStock: { increment: item.requestedQuantity },
              availableStock: inventoryItem.currentStock - inventoryItem.reservedStock - item.requestedQuantity,
            },
          });
        }
      }

      return tx.inventoryTransfer.findUnique({
        where: { id: newTransfer.id },
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
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'InventoryTransfer',
      entityId: transfer?.id || '',
      details: {
        transferNumber,
        toClinic: toClinic.name,
        itemCount: data.items.length,
        isUrgent: data.isUrgent,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: transfer },
      { status: 201 }
    );
  },
  { permissions: ['inventory:transfer'] }
);
