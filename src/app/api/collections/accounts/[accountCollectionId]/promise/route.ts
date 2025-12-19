import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createPaymentPromiseSchema } from '@/lib/validations/collections';
import { logCollectionActivity } from '@/lib/billing/collections-utils';

interface RouteParams {
  params: Promise<{ accountCollectionId: string }>;
}

/**
 * POST /api/collections/accounts/:accountCollectionId/promise
 * Record a payment promise
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { accountCollectionId } = await params;
    const body = await req.json();

    // Verify account collection exists
    const accountCollection = await db.accountCollection.findFirst({
      where: {
        id: accountCollectionId,
        clinicId: session.user.clinicId,
      },
    });

    if (!accountCollection) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Account collection not found',
          },
        },
        { status: 404 }
      );
    }

    const result = createPaymentPromiseSchema.safeParse(body);
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

    const data = result.data;

    // Create the promise
    const promise = await db.paymentPromise.create({
      data: {
        accountCollectionId,
        accountId: accountCollection.accountId,
        promisedAmount: data.promisedAmount,
        promisedDate: data.promisedDate,
        notes: data.notes,
        status: 'PENDING',
        recordedBy: session.user.id,
      },
    });

    // Log activity
    await logCollectionActivity(
      accountCollectionId,
      'PROMISE_MADE',
      `Payment promise recorded: $${data.promisedAmount} by ${data.promisedDate.toLocaleDateString()}`,
      session.user.id
    );

    // Update last action timestamp
    await db.accountCollection.update({
      where: { id: accountCollectionId },
      data: { lastActionAt: new Date() },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'PaymentPromise',
      entityId: promise.id,
      details: {
        accountCollectionId,
        promisedAmount: data.promisedAmount,
        promisedDate: data.promisedDate,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: promise },
      { status: 201 }
    );
  },
  { permissions: ['collections:manage'] }
);
