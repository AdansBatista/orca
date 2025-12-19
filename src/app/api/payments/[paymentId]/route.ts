import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateAccountBalance } from '@/lib/billing/utils';
import {
  capturePaymentIntent,
  cancelPaymentIntent,
  getPaymentIntent,
} from '@/lib/payments/stripe';

interface RouteParams {
  params: Promise<{ paymentId: string }>;
}

/**
 * GET /api/payments/[paymentId]
 * Get a specific payment by ID
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { paymentId } = await params;

    const payment = await db.payment.findFirst({
      where: withSoftDelete({
        id: paymentId,
        ...getClinicFilter(session),
      }),
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        account: {
          select: {
            id: true,
            accountNumber: true,
            currentBalance: true,
          },
        },
        allocations: {
          include: {
            invoice: {
              select: {
                id: true,
                invoiceNumber: true,
                subtotal: true,
                balance: true,
                status: true,
              },
            },
          },
        },
        refunds: {
          select: {
            id: true,
            refundNumber: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
        storedMethod: {
          select: {
            id: true,
            cardBrand: true,
            cardLast4: true,
            cardExpMonth: true,
            cardExpYear: true,
            isDefault: true,
          },
        },
        receipts: {
          select: {
            id: true,
            receiptNumber: true,
            sentAt: true,
            deliveryMethod: true,
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

    return NextResponse.json({
      success: true,
      data: payment,
    });
  },
  { permissions: ['payment:read'] }
);

/**
 * POST /api/payments/[paymentId]
 * Perform actions on a payment (capture, cancel, sync)
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { paymentId } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    const payment = await db.payment.findFirst({
      where: withSoftDelete({
        id: paymentId,
        ...getClinicFilter(session),
      }),
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

    const { ipAddress, userAgent } = getRequestMeta(req);

    switch (action) {
      case 'capture': {
        // Capture a previously authorized payment
        if (payment.status !== 'PENDING') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Payment is not in a capturable state',
              },
            },
            { status: 400 }
          );
        }

        if (!payment.gatewayPaymentId) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NO_GATEWAY_PAYMENT',
                message: 'Payment has no gateway reference to capture',
              },
            },
            { status: 400 }
          );
        }

        try {
          const body = await req.json().catch(() => ({}));
          const amountToCapture = body.amount ? Math.round(body.amount * 100) : undefined;

          const capturedIntent = await capturePaymentIntent(
            payment.gatewayPaymentId,
            amountToCapture
          );

          const updatedPayment = await db.payment.update({
            where: { id: paymentId },
            data: {
              status: 'COMPLETED',
            },
          });

          // Update account balance
          await updateAccountBalance(
            payment.accountId,
            session.user.clinicId,
            session.user.id
          );

          await logAudit(session, {
            action: 'UPDATE',
            entity: 'Payment',
            entityId: payment.id,
            details: { action: 'capture', previousStatus: payment.status },
            ipAddress,
            userAgent,
          });

          return NextResponse.json({
            success: true,
            data: updatedPayment,
          });
        } catch (error) {
          const stripeError = error as { message?: string };
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'CAPTURE_FAILED',
                message: stripeError.message || 'Failed to capture payment',
              },
            },
            { status: 400 }
          );
        }
      }

      case 'cancel': {
        // Cancel a pending payment
        if (payment.status !== 'PENDING') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Only pending payments can be cancelled',
              },
            },
            { status: 400 }
          );
        }

        try {
          // Cancel in Stripe if applicable
          if (payment.gatewayPaymentId) {
            await cancelPaymentIntent(payment.gatewayPaymentId, 'requested_by_customer');
          }

          const updatedPayment = await db.payment.update({
            where: { id: paymentId },
            data: {
              status: 'CANCELLED',
            },
          });

          await logAudit(session, {
            action: 'UPDATE',
            entity: 'Payment',
            entityId: payment.id,
            details: { action: 'cancel', previousStatus: payment.status },
            ipAddress,
            userAgent,
          });

          return NextResponse.json({
            success: true,
            data: updatedPayment,
          });
        } catch (error) {
          const stripeError = error as { message?: string };
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'CANCEL_FAILED',
                message: stripeError.message || 'Failed to cancel payment',
              },
            },
            { status: 400 }
          );
        }
      }

      case 'sync': {
        // Sync status with payment gateway
        if (!payment.gatewayPaymentId) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'NO_GATEWAY_PAYMENT',
                message: 'Payment has no gateway reference to sync',
              },
            },
            { status: 400 }
          );
        }

        try {
          const paymentIntent = await getPaymentIntent(payment.gatewayPaymentId);

          let newStatus = payment.status;
          if (paymentIntent.status === 'succeeded') {
            newStatus = 'COMPLETED';
          } else if (paymentIntent.status === 'canceled') {
            newStatus = 'CANCELLED';
          } else if (paymentIntent.status === 'processing') {
            newStatus = 'PROCESSING';
          }

          const updatedPayment = await db.payment.update({
            where: { id: paymentId },
            data: {
              status: newStatus,
            },
          });

          // Update account balance if status changed to completed
          if (newStatus === 'COMPLETED' && payment.status !== 'COMPLETED') {
            await updateAccountBalance(
              payment.accountId,
              session.user.clinicId,
              session.user.id
            );
          }

          return NextResponse.json({
            success: true,
            data: updatedPayment,
          });
        } catch (error) {
          const stripeError = error as { message?: string };
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'SYNC_FAILED',
                message: stripeError.message || 'Failed to sync payment status',
              },
            },
            { status: 400 }
          );
        }
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Invalid action. Supported: capture, cancel, sync',
            },
          },
          { status: 400 }
        );
    }
  },
  { permissions: ['payment:process'] }
);
