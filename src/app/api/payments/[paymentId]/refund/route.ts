import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createRefundSchema } from '@/lib/validations/billing';
import { generateRefundNumber, updateAccountBalance } from '@/lib/billing/utils';
import { createRefund } from '@/lib/payments/stripe';

interface RouteParams {
  params: Promise<{ paymentId: string }>;
}

/**
 * POST /api/payments/[paymentId]/refund
 * Create a refund for a payment
 */
export const POST = withAuth(
  async (req, session, { params }: RouteParams) => {
    const { paymentId } = await params;
    const body = await req.json();

    // Find the payment
    const payment = await db.payment.findFirst({
      where: withSoftDelete({
        id: paymentId,
        ...getClinicFilter(session),
      }),
      include: {
        refunds: {
          where: {
            status: { in: ['PENDING', 'APPROVED', 'COMPLETED'] },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_NOT_FOUND',
            message: 'Payment not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate the payment can be refunded
    if (payment.status !== 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PAYMENT_STATUS',
            message: 'Only completed payments can be refunded',
          },
        },
        { status: 400 }
      );
    }

    // Calculate already refunded amount
    const alreadyRefunded = payment.refunds.reduce(
      (sum, r) => sum + r.amount,
      0
    );
    const availableForRefund = payment.amount - alreadyRefunded;

    // Validate refund request
    const result = createRefundSchema.safeParse({
      ...body,
      paymentId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid refund data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const refundAmount = data.amount || payment.amount;

    // Check if refund amount is valid
    if (refundAmount > availableForRefund) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REFUND_EXCEEDS_AVAILABLE',
            message: `Refund amount exceeds available amount. Available: $${availableForRefund.toFixed(2)}`,
          },
        },
        { status: 400 }
      );
    }

    // Generate refund number
    const refundNumber = await generateRefundNumber(session.user.clinicId);

    // Determine if this is a full or partial refund
    const refundType = refundAmount === payment.amount ? 'FULL' : 'PARTIAL';

    // Determine initial status - if no approval required, process immediately
    // For now, we'll require approval for refunds over a threshold
    const APPROVAL_THRESHOLD = 100; // $100
    const requiresApproval = refundAmount >= APPROVAL_THRESHOLD;
    const initialStatus = requiresApproval ? 'PENDING' : 'APPROVED';

    let gatewayRefundId: string | null = null;
    let gatewayResponse: unknown = null;
    let finalStatus = initialStatus;

    // If approved immediately and payment has a gateway reference, process refund
    if (!requiresApproval && payment.gatewayPaymentId && payment.gateway === 'STRIPE') {
      try {
        const stripeRefund = await createRefund({
          paymentIntentId: payment.gatewayPaymentId,
          amount: Math.round(refundAmount * 100),
          reason: data.reason as 'duplicate' | 'fraudulent' | 'requested_by_customer' | undefined,
          metadata: {
            clinicId: session.user.clinicId,
            paymentId,
            refundNumber,
          },
        });

        gatewayRefundId = stripeRefund.id;
        gatewayResponse = {
          status: stripeRefund.status,
          processedAt: new Date().toISOString(),
        };
        finalStatus = stripeRefund.status === 'succeeded' ? 'COMPLETED' : 'PROCESSING';
      } catch (error) {
        const stripeError = error as { message?: string };
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'REFUND_FAILED',
              message: stripeError.message || 'Failed to process refund',
            },
          },
          { status: 400 }
        );
      }
    }

    // Create the refund record
    const refund = await db.refund.create({
      data: {
        clinicId: session.user.clinicId,
        paymentId,
        refundNumber,
        amount: refundAmount,
        refundType,
        reason: data.reason,
        notes: data.notes,
        status: finalStatus,
        gatewayRefundId,
        gatewayResponse: gatewayResponse ? JSON.stringify(gatewayResponse) : null,
        requestedBy: session.user.id,
        requestedAt: new Date(),
        processedBy: finalStatus === 'COMPLETED' ? session.user.id : null,
        processedAt: finalStatus === 'COMPLETED' ? new Date() : null,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        payment: {
          select: {
            paymentNumber: true,
            amount: true,
          },
        },
        requestedByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update payment status if full refund completed
    if (finalStatus === 'COMPLETED') {
      const newPaymentStatus =
        refundAmount === payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

      await db.payment.update({
        where: { id: paymentId },
        data: {
          status: newPaymentStatus,
          updatedBy: session.user.id,
        },
      });

      // Reverse invoice allocations if needed
      const allocations = await db.paymentAllocation.findMany({
        where: { paymentId },
        include: { invoice: true },
      });

      // For simplicity, we'll proportionally reverse allocations
      const refundRatio = refundAmount / payment.amount;
      for (const allocation of allocations) {
        const reverseAmount = allocation.amount * refundRatio;
        const invoice = allocation.invoice;

        if (invoice) {
          const newBalance = invoice.balance + reverseAmount;
          const newStatus = newBalance > 0 ? 'PARTIAL' : invoice.status;

          await db.invoice.update({
            where: { id: invoice.id },
            data: {
              balance: newBalance,
              status: newStatus,
              paidAt: newBalance > 0 ? null : invoice.paidAt,
              updatedBy: session.user.id,
            },
          });
        }
      }

      // Update account balance
      await updateAccountBalance(
        payment.accountId,
        session.user.clinicId,
        session.user.id
      );
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Refund',
      entityId: refund.id,
      details: {
        refundNumber: refund.refundNumber,
        amount: refund.amount,
        paymentId,
        paymentNumber: payment.paymentNumber,
        reason: refund.reason,
        status: refund.status,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: refund,
      },
      { status: 201 }
    );
  },
  { permissions: ['payment:process_refund'] }
);
