import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { approveRemakeSchema } from '@/lib/validations/lab';

/**
 * POST /api/lab/remakes/[id]/approve
 * Approve or deny a remake request
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = approveRemakeSchema.safeParse(body);
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

    const { approved, notes } = result.data;

    // Check remake exists with related data
    const existingRemake = await db.remakeRequest.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        originalItem: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!existingRemake) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REMAKE_NOT_FOUND',
            message: 'Remake request not found',
          },
        },
        { status: 404 }
      );
    }

    // Fetch the original order separately
    const originalOrder = await db.labOrder.findUnique({
      where: { id: existingRemake.originalOrderId },
    });

    if (!originalOrder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Original order not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if remake requires approval and is in correct status
    if (!existingRemake.requiresApproval) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPROVAL_NOT_REQUIRED',
            message: 'This remake request does not require approval',
          },
        },
        { status: 400 }
      );
    }

    if (existingRemake.status !== 'REQUESTED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot approve/deny remake in ${existingRemake.status} status`,
          },
        },
        { status: 400 }
      );
    }

    if (approved) {
      // Approve: Update status and optionally create new order
      const remake = await db.remakeRequest.update({
        where: { id },
        data: {
          status: 'ACKNOWLEDGED',
          approvedBy: session.user.id,
          approvedAt: new Date(),
        },
      });

      // Create a new order for the remake
      const newOrderNumber = `${originalOrder.orderNumber}-R`;
      const newOrder = await db.labOrder.create({
        data: {
          clinicId: session.user.clinicId,
          patientId: originalOrder.patientId,
          vendorId: originalOrder.vendorId,
          orderNumber: newOrderNumber,
          status: 'DRAFT',
          priority: originalOrder.priority,
          isRush: false,
          clinicNotes: `Remake for order ${originalOrder.orderNumber}. Reason: ${existingRemake.reason}. ${existingRemake.reasonDetails || ''}`,
          createdBy: session.user.id,
          updatedBy: session.user.id,
        },
      });

      // Copy original item to new order with zero cost if warranty/lab responsibility
      const cost =
        existingRemake.costResponsibility === 'LAB' ||
        existingRemake.costResponsibility === 'WARRANTY'
          ? 0
          : existingRemake.originalItem.unitPrice;

      await db.labOrderItem.create({
        data: {
          orderId: newOrder.id,
          productId: existingRemake.originalItem.productId,
          productName: existingRemake.originalItem.productName,
          quantity: existingRemake.originalItem.quantity,
          prescription: existingRemake.originalItem.prescription,
          arch: existingRemake.originalItem.arch,
          toothNumbers: existingRemake.originalItem.toothNumbers,
          unitPrice: cost,
          totalPrice: cost * existingRemake.originalItem.quantity,
          status: 'PENDING',
          notes: `Remake - Original Order: ${originalOrder.orderNumber}`,
        },
      });

      // Link new order to remake request
      await db.remakeRequest.update({
        where: { id },
        data: {
          newOrderId: newOrder.id,
        },
      });

      // Create status log for new order
      await db.labOrderStatusLog.create({
        data: {
          orderId: newOrder.id,
          toStatus: 'DRAFT',
          source: 'SYSTEM',
          notes: `Remake order created from request ${id}`,
          changedBy: session.user.id,
        },
      });

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'UPDATE',
        entity: 'RemakeRequest',
        entityId: id,
        details: {
          action: 'APPROVED',
          newOrderId: newOrder.id,
          newOrderNumber,
          notes,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        data: {
          remake,
          newOrder: {
            id: newOrder.id,
            orderNumber: newOrderNumber,
          },
        },
      });
    } else {
      // Deny: Update status to cancelled
      const remake = await db.remakeRequest.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          approvedBy: session.user.id,
          approvedAt: new Date(),
        },
      });

      // Revert original order status
      await db.labOrder.update({
        where: { id: existingRemake.originalOrderId },
        data: {
          status: 'RECEIVED',
          updatedBy: session.user.id,
        },
      });

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'UPDATE',
        entity: 'RemakeRequest',
        entityId: id,
        details: {
          action: 'DENIED',
          notes,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        data: { remake },
      });
    }
  },
  { permissions: ['lab:approve_remake'] }
);
