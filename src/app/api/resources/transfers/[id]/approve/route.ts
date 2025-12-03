import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { approveTransferSchema, rejectTransferSchema } from '@/lib/validations/inventory';

/**
 * POST /api/resources/transfers/[id]/approve
 * Approve or reject a transfer request (source clinic action)
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    // Determine if this is an approval or rejection
    const isRejection = body.reject === true;

    // Find the transfer
    const transfer = await db.inventoryTransfer.findFirst({
      where: {
        id,
        fromClinicId: session.user.clinicId,
        status: 'REQUESTED',
      },
      include: {
        items: {
          include: {
            item: true,
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
            message: 'Transfer not found or cannot be approved/rejected',
          },
        },
        { status: 404 }
      );
    }

    if (isRejection) {
      // Validate rejection input
      const result = rejectTransferSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid rejection data',
              details: result.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const { reason } = result.data;

      // Reject transfer and release reserved stock
      await db.$transaction(async (tx) => {
        // Release reserved stock
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

          // Update item status
          await tx.transferItem.update({
            where: { id: item.id },
            data: { status: 'REJECTED' },
          });
        }

        // Update transfer status
        await tx.inventoryTransfer.update({
          where: { id },
          data: {
            status: 'REJECTED',
            notes: transfer.notes ? `${transfer.notes}\n\nRejection reason: ${reason}` : `Rejection reason: ${reason}`,
          },
        });
      });

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'UPDATE',
        entity: 'InventoryTransfer',
        entityId: id,
        details: {
          transferNumber: transfer.transferNumber,
          action: 'REJECTED',
          reason,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        data: { rejected: true, reason },
      });
    } else {
      // Validate approval input
      const result = approveTransferSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid approval data',
              details: result.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const { items, notes } = result.data;

      // Process approval with potentially adjusted quantities
      await db.$transaction(async (tx) => {
        for (const approvalItem of items) {
          const transferItem = transfer.items.find(
            (ti) => ti.id === approvalItem.transferItemId
          );

          if (!transferItem) continue;

          const inventoryItem = await tx.inventoryItem.findUnique({
            where: { id: transferItem.itemId },
          });

          if (!inventoryItem) continue;

          // Calculate the difference between requested and approved
          const quantityDifference = transferItem.requestedQuantity - approvalItem.approvedQuantity;

          // Update transfer item
          const itemStatus = approvalItem.approvedQuantity === 0
            ? 'REJECTED'
            : approvalItem.approvedQuantity < transferItem.requestedQuantity
              ? 'PARTIALLY_APPROVED'
              : 'APPROVED';

          await tx.transferItem.update({
            where: { id: approvalItem.transferItemId },
            data: {
              approvedQuantity: approvalItem.approvedQuantity,
              status: itemStatus,
            },
          });

          // Adjust reserved stock if quantity was reduced
          if (quantityDifference > 0) {
            const newReserved = Math.max(0, inventoryItem.reservedStock - quantityDifference);
            await tx.inventoryItem.update({
              where: { id: transferItem.itemId },
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
          data: {
            status: 'APPROVED',
            approvedBy: session.user.id,
            approvedDate: new Date(),
            notes: notes ? (transfer.notes ? `${transfer.notes}\n\nApproval notes: ${notes}` : `Approval notes: ${notes}`) : transfer.notes,
          },
        });
      });

      // Fetch updated transfer
      const updatedTransfer = await db.inventoryTransfer.findUnique({
        where: { id },
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
          action: 'APPROVED',
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({ success: true, data: updatedTransfer });
    }
  },
  { permissions: ['inventory:approve'] }
);
