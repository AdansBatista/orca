import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateAccountBalance } from '@/lib/billing/utils';
import { createRefund } from '@/lib/payments/stripe';

interface RouteParams {
  params: Promise<{ refundId: string }>;
}

/**
 * GET /api/refunds/[refundId]
 * Get a specific refund by ID
 */
export const GET = withAuth(
  async (req, session, { params }: RouteParams) => {
    const { refundId } = await params;

    const refund = await db.refund.findFirst({
      where: withSoftDelete({
        id: refundId,
        ...getClinicFilter(session),
      }),
      include: {
        payment: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            account: {
              select: {
                id: true,
                accountNumber: true,
              },
            },
          },
        },
        requestedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        processedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!refund) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REFUND_NOT_FOUND',
            message: 'Refund not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: refund,
    });
  },
  { permissions: ['payment:read'] }
);

/**
 * POST /api/refunds/[refundId]
 * Perform actions on a refund (approve, reject, process)
 */
export const POST = withAuth(
  async (req, session, { params }: RouteParams) => {
    const { refundId } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    const refund = await db.refund.findFirst({
      where: withSoftDelete({
        id: refundId,
        ...getClinicFilter(session),
      }),
      include: {
        payment: true,
      },
    });

    if (!refund) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REFUND_NOT_FOUND',
            message: 'Refund not found',
          },
        },
        { status: 404 }
      );
    }

    const { ipAddress, userAgent } = getRequestMeta(req);

    switch (action) {
      case 'approve': {
        if (refund.status !== 'PENDING') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Only pending refunds can be approved',
              },
            },
            { status: 400 }
          );
        }

        const body = await req.json().catch(() => ({}));

        const updatedRefund = await db.refund.update({
          where: { id: refundId },
          data: {
            status: 'APPROVED',
            approvedBy: session.user.id,
            approvedAt: new Date(),
            approvalNotes: body.notes,
            updatedBy: session.user.id,
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'Refund',
          entityId: refund.id,
          details: { action: 'approve', refundNumber: refund.refundNumber },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: updatedRefund,
        });
      }

      case 'reject': {
        if (refund.status !== 'PENDING') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Only pending refunds can be rejected',
              },
            },
            { status: 400 }
          );
        }

        const body = await req.json();
        if (!body.reason) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'REASON_REQUIRED',
                message: 'Rejection reason is required',
              },
            },
            { status: 400 }
          );
        }

        const updatedRefund = await db.refund.update({
          where: { id: refundId },
          data: {
            status: 'REJECTED',
            approvedBy: session.user.id,
            approvedAt: new Date(),
            approvalNotes: body.reason,
            updatedBy: session.user.id,
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'Refund',
          entityId: refund.id,
          details: { action: 'reject', refundNumber: refund.refundNumber, reason: body.reason },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: updatedRefund,
        });
      }

      case 'process': {
        if (refund.status !== 'APPROVED') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Only approved refunds can be processed',
              },
            },
            { status: 400 }
          );
        }

        // Process through payment gateway
        if (refund.payment.gatewayPaymentId && refund.payment.gateway === 'STRIPE') {
          try {
            const stripeRefund = await createRefund({
              paymentIntentId: refund.payment.gatewayPaymentId,
              amount: Math.round(refund.amount * 100),
              reason: refund.reason as 'duplicate' | 'fraudulent' | 'requested_by_customer' | undefined,
              metadata: {
                clinicId: session.user.clinicId,
                refundId: refund.id,
                refundNumber: refund.refundNumber,
              },
            });

            const updatedRefund = await db.refund.update({
              where: { id: refundId },
              data: {
                status: stripeRefund.status === 'succeeded' ? 'COMPLETED' : 'PROCESSING',
                gatewayRefundId: stripeRefund.id,
                gatewayResponse: JSON.stringify({
                  status: stripeRefund.status,
                  processedAt: new Date().toISOString(),
                }),
                processedBy: session.user.id,
                processedAt: new Date(),
                updatedBy: session.user.id,
              },
            });

            // Update payment status
            const payment = refund.payment;
            const newPaymentStatus =
              refund.amount === payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

            await db.payment.update({
              where: { id: payment.id },
              data: {
                status: newPaymentStatus,
                updatedBy: session.user.id,
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
              entity: 'Refund',
              entityId: refund.id,
              details: {
                action: 'process',
                refundNumber: refund.refundNumber,
                gatewayRefundId: stripeRefund.id,
              },
              ipAddress,
              userAgent,
            });

            return NextResponse.json({
              success: true,
              data: updatedRefund,
            });
          } catch (error) {
            const stripeError = error as { message?: string };
            return NextResponse.json(
              {
                success: false,
                error: {
                  code: 'REFUND_PROCESSING_FAILED',
                  message: stripeError.message || 'Failed to process refund',
                },
              },
              { status: 400 }
            );
          }
        } else {
          // Manual refund (cash, check, etc.)
          const updatedRefund = await db.refund.update({
            where: { id: refundId },
            data: {
              status: 'COMPLETED',
              processedBy: session.user.id,
              processedAt: new Date(),
              updatedBy: session.user.id,
            },
          });

          // Update payment status
          const payment = refund.payment;
          const newPaymentStatus =
            refund.amount === payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

          await db.payment.update({
            where: { id: payment.id },
            data: {
              status: newPaymentStatus,
              updatedBy: session.user.id,
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
            entity: 'Refund',
            entityId: refund.id,
            details: { action: 'process', refundNumber: refund.refundNumber },
            ipAddress,
            userAgent,
          });

          return NextResponse.json({
            success: true,
            data: updatedRefund,
          });
        }
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Invalid action. Supported: approve, reject, process',
            },
          },
          { status: 400 }
        );
    }
  },
  { permissions: ['payment:approve_refund'] }
);
