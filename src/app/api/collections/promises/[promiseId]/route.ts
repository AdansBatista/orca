import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  updatePaymentPromiseSchema,
  fulfillPromiseSchema,
  markPromiseBrokenSchema,
} from '@/lib/validations/collections';
import { logCollectionActivity } from '@/lib/billing/collections-utils';

interface RouteParams {
  params: Promise<{ promiseId: string }>;
}

/**
 * GET /api/collections/promises/:promiseId
 * Get promise details
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { promiseId } = await params;

    const promise = await db.paymentPromise.findFirst({
      where: {
        id: promiseId,
        accountCollection: {
          clinicId: session.user.clinicId,
        },
      },
      include: {
        accountCollection: {
          select: {
            id: true,
            currentBalance: true,
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

    if (!promise) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROMISE_NOT_FOUND',
            message: 'Payment promise not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: promise,
    });
  },
  { permissions: ['collections:read'] }
);

/**
 * PATCH /api/collections/promises/:promiseId
 * Update a promise
 */
export const PATCH = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { promiseId } = await params;
    const body = await req.json();

    const result = updatePaymentPromiseSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid promise data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify promise exists and belongs to clinic
    const existingPromise = await db.paymentPromise.findFirst({
      where: {
        id: promiseId,
        accountCollection: {
          clinicId: session.user.clinicId,
        },
      },
    });

    if (!existingPromise) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROMISE_NOT_FOUND',
            message: 'Payment promise not found',
          },
        },
        { status: 404 }
      );
    }

    if (existingPromise.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Only pending promises can be updated',
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    const promise = await db.paymentPromise.update({
      where: { id: promiseId },
      data: {
        ...(data.promisedAmount !== undefined && { promisedAmount: data.promisedAmount }),
        ...(data.promisedDate !== undefined && { promisedDate: data.promisedDate }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PaymentPromise',
      entityId: promiseId,
      details: { changes: data },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: promise,
    });
  },
  { permissions: ['collections:manage'] }
);

/**
 * POST /api/collections/promises/:promiseId
 * Actions: fulfill, broken
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { promiseId } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const body = await req.json();

    // Verify promise exists
    const promise = await db.paymentPromise.findFirst({
      where: {
        id: promiseId,
        accountCollection: {
          clinicId: session.user.clinicId,
        },
      },
    });

    if (!promise) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROMISE_NOT_FOUND',
            message: 'Payment promise not found',
          },
        },
        { status: 404 }
      );
    }

    if (promise.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Promise is not pending',
          },
        },
        { status: 400 }
      );
    }

    const { ipAddress, userAgent } = getRequestMeta(req);

    switch (action) {
      case 'fulfill': {
        const fulfillResult = fulfillPromiseSchema.safeParse(body);
        if (!fulfillResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid fulfill data',
                details: fulfillResult.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        const data = fulfillResult.data;
        const isFull = data.paidAmount >= promise.promisedAmount;

        const updated = await db.paymentPromise.update({
          where: { id: promiseId },
          data: {
            status: isFull ? 'FULFILLED' : 'PARTIAL',
            paidAmount: data.paidAmount,
            paidDate: data.paidDate || new Date(),
          },
        });

        // Log activity
        await logCollectionActivity(
          promise.accountCollectionId,
          'PAYMENT_RECEIVED',
          `Payment received: $${data.paidAmount}${isFull ? ' (promise fulfilled)' : ' (partial)'}`,
          session.user.id,
          { paymentReceived: data.paidAmount }
        );

        // Update account collection paid amount
        await db.accountCollection.update({
          where: { id: promise.accountCollectionId },
          data: {
            paidAmount: { increment: data.paidAmount },
            currentBalance: { decrement: data.paidAmount },
            lastActionAt: new Date(),
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'PaymentPromise',
          entityId: promiseId,
          details: { action: 'fulfill', paidAmount: data.paidAmount },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({ success: true, data: updated });
      }

      case 'broken': {
        const brokenResult = markPromiseBrokenSchema.safeParse(body);
        if (!brokenResult.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid broken data',
                details: brokenResult.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        const updated = await db.paymentPromise.update({
          where: { id: promiseId },
          data: {
            status: 'BROKEN',
            brokenAt: new Date(),
            brokenReason: brokenResult.data.reason,
          },
        });

        // Log activity
        await logCollectionActivity(
          promise.accountCollectionId,
          'PROMISE_BROKEN',
          `Payment promise broken: ${brokenResult.data.reason}`,
          session.user.id
        );

        await db.accountCollection.update({
          where: { id: promise.accountCollectionId },
          data: { lastActionAt: new Date() },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'PaymentPromise',
          entityId: promiseId,
          details: { action: 'broken', reason: brokenResult.data.reason },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({ success: true, data: updated });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Invalid action. Valid actions: fulfill, broken',
            },
          },
          { status: 400 }
        );
    }
  },
  { permissions: ['collections:manage'] }
);
