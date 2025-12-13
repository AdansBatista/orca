import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { retryScheduledPayment, skipScheduledPayment } from '@/lib/billing/recurring-billing';

interface RouteParams {
  params: Promise<{ paymentId: string }>;
}

/**
 * GET /api/scheduled-payments/[paymentId]
 * Get a specific scheduled payment
 */
export const GET = withAuth(
  async (req, session, { params }: RouteParams) => {
    const { paymentId } = await params;

    const scheduledPayment = await db.scheduledPayment.findFirst({
      where: {
        id: paymentId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      include: {
        paymentPlan: {
          select: {
            id: true,
            planNumber: true,
            status: true,
            account: {
              select: {
                id: true,
                accountNumber: true,
                patient: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        payment: {
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            status: true,
            paymentDate: true,
          },
        },
      },
    });

    if (!scheduledPayment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Scheduled payment not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: scheduledPayment,
    });
  },
  { permissions: ['payment:read'] }
);

/**
 * POST /api/scheduled-payments/[paymentId]
 * Perform actions on a scheduled payment (retry, skip)
 */
export const POST = withAuth(
  async (req, session, { params }: RouteParams) => {
    const { paymentId } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    const scheduledPayment = await db.scheduledPayment.findFirst({
      where: {
        id: paymentId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!scheduledPayment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Scheduled payment not found',
          },
        },
        { status: 404 }
      );
    }

    const { ipAddress, userAgent } = getRequestMeta(req);

    switch (action) {
      case 'retry': {
        // Retry a failed scheduled payment
        if (!['FAILED', 'SCHEDULED'].includes(scheduledPayment.status)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Can only retry failed or scheduled payments',
              },
            },
            { status: 400 }
          );
        }

        const result = await retryScheduledPayment(paymentId);

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'ScheduledPayment',
          entityId: paymentId,
          details: { action: 'retry', result: result.success ? 'success' : 'failed' },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: result.success,
          data: result,
          message: result.success
            ? 'Payment processed successfully'
            : result.retryScheduled
              ? `Payment failed, retry scheduled for ${result.nextRetryDate?.toLocaleDateString()}`
              : `Payment failed: ${result.error}`,
        });
      }

      case 'skip': {
        // Skip a scheduled payment
        if (scheduledPayment.status === 'PAID') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Cannot skip a paid payment',
              },
            },
            { status: 400 }
          );
        }

        const body = await req.json().catch(() => ({}));
        const reason = body.reason || 'Skipped by user';

        await skipScheduledPayment(paymentId, reason);

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'ScheduledPayment',
          entityId: paymentId,
          details: { action: 'skip', reason },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: { status: 'SKIPPED' },
          message: 'Payment has been skipped',
        });
      }

      case 'reschedule': {
        // Reschedule a payment to a new date
        if (scheduledPayment.status === 'PAID') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Cannot reschedule a paid payment',
              },
            },
            { status: 400 }
          );
        }

        const body = await req.json();
        const newDate = body.dueDate;

        if (!newDate) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'MISSING_DATE',
                message: 'New due date is required',
              },
            },
            { status: 400 }
          );
        }

        const updatedPayment = await db.scheduledPayment.update({
          where: { id: paymentId },
          data: {
            dueDate: new Date(newDate),
            status: 'SCHEDULED',
            updatedBy: session.user.id,
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'ScheduledPayment',
          entityId: paymentId,
          details: { action: 'reschedule', newDate },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: updatedPayment,
          message: 'Payment has been rescheduled',
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Invalid action. Supported: retry, skip, reschedule',
            },
          },
          { status: 400 }
        );
    }
  },
  { permissions: ['payment:process'] }
);
