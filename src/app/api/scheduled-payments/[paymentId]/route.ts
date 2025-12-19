import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
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
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { paymentId } = await params;

    // ScheduledPayment has no soft delete
    const scheduledPayment = await db.scheduledPayment.findFirst({
      where: {
        id: paymentId,
        ...getClinicFilter(session),
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
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { paymentId } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    // ScheduledPayment has no soft delete
    const scheduledPayment = await db.scheduledPayment.findFirst({
      where: {
        id: paymentId,
        ...getClinicFilter(session),
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
        if (!['FAILED', 'PENDING'].includes(scheduledPayment.status)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Can only retry failed or pending payments',
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
        if (scheduledPayment.status === 'COMPLETED') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Cannot skip a completed payment',
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
        if (scheduledPayment.status === 'COMPLETED') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Cannot reschedule a completed payment',
              },
            },
            { status: 400 }
          );
        }

        const body = await req.json();
        const newDate = body.scheduledDate;

        if (!newDate) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'MISSING_DATE',
                message: 'New scheduled date is required',
              },
            },
            { status: 400 }
          );
        }

        const updatedPayment = await db.scheduledPayment.update({
          where: { id: paymentId },
          data: {
            scheduledDate: new Date(newDate),
            status: 'PENDING',
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
