import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

/**
 * GET /api/resources/transfers/[id]
 * Get transfer details
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    const transfer = await db.inventoryTransfer.findFirst({
      where: {
        id,
        OR: [
          { fromClinicId: session.user.clinicId },
          { toClinicId: session.user.clinicId },
        ],
      },
      include: {
        fromClinic: { select: { id: true, name: true } },
        toClinic: { select: { id: true, name: true } },
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                sku: true,
                category: true,
                unitOfMeasure: true,
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
        },
      },
    });

    if (!transfer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Transfer not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: transfer });
  },
  { permissions: ['inventory:read'] }
);

/**
 * PUT /api/resources/transfers/[id]
 * Update transfer (only allowed for REQUESTED status)
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    // Find the transfer
    const transfer = await db.inventoryTransfer.findFirst({
      where: {
        id,
        fromClinicId: session.user.clinicId,
        status: 'REQUESTED',
      },
    });

    if (!transfer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Transfer not found or cannot be modified',
          },
        },
        { status: 404 }
      );
    }

    // Update allowed fields
    const updatedTransfer = await db.inventoryTransfer.update({
      where: { id },
      data: {
        reason: body.reason,
        notes: body.notes,
        isUrgent: body.isUrgent,
      },
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

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'InventoryTransfer',
      entityId: id,
      details: {
        transferNumber: transfer.transferNumber,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: updatedTransfer });
  },
  { permissions: ['inventory:transfer'] }
);

/**
 * DELETE /api/resources/transfers/[id]
 * Cancel a transfer (only allowed for REQUESTED status)
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    // Find the transfer
    const transfer = await db.inventoryTransfer.findFirst({
      where: {
        id,
        fromClinicId: session.user.clinicId,
        status: 'REQUESTED',
      },
      include: {
        items: true,
      },
    });

    if (!transfer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Transfer not found or cannot be cancelled',
          },
        },
        { status: 404 }
      );
    }

    // Cancel the transfer and release reserved stock
    await db.$transaction(async (tx) => {
      // Release reserved stock for each item
      for (const item of transfer.items) {
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: item.itemId },
        });

        if (inventoryItem) {
          const newReserved = Math.max(0, inventoryItem.reservedStock - item.requestedQuantity);
          await tx.inventoryItem.update({
            where: { id: item.itemId },
            data: {
              reservedStock: newReserved,
              availableStock: inventoryItem.currentStock - newReserved,
            },
          });
        }
      }

      // Update transfer status
      await tx.inventoryTransfer.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'InventoryTransfer',
      entityId: id,
      details: {
        transferNumber: transfer.transferNumber,
        action: 'CANCELLED',
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { cancelled: true } });
  },
  { permissions: ['inventory:transfer'] }
);
