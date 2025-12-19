import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { recallFromAgencySchema } from '@/lib/validations/collections';
import { logCollectionActivity } from '@/lib/billing/collections-utils';

interface RouteParams {
  params: Promise<{ accountCollectionId: string }>;
}

/**
 * POST /api/collections/accounts/:accountCollectionId/recall
 * Recall account from collection agency
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { accountCollectionId } = await params;
    const body = await req.json();

    // Validate input
    const result = recallFromAgencySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify account collection exists and is with agency
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

    if (accountCollection.status !== 'AGENCY') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_WITH_AGENCY',
            message: 'Account is not currently with a collection agency',
          },
        },
        { status: 400 }
      );
    }

    // Find active referral
    const referral = await db.agencyReferral.findFirst({
      where: {
        accountId: accountCollection.accountId,
        clinicId: session.user.clinicId,
        status: 'ACTIVE',
      },
    });

    // Get agency name separately
    const agency = referral ? await db.collectionAgency.findUnique({
      where: { id: referral.agencyId },
      select: { name: true },
    }) : null;

    if (!referral) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REFERRAL_NOT_FOUND',
            message: 'Active agency referral not found',
          },
        },
        { status: 404 }
      );
    }

    // Update referral status
    await db.agencyReferral.update({
      where: { id: referral.id },
      data: {
        status: 'RECALLED',
        recalledAt: new Date(),
        recallReason: result.data.reason,
      },
    });

    // Update account collection status
    const updated = await db.accountCollection.update({
      where: { id: accountCollectionId },
      data: {
        status: 'ACTIVE',
        sentToAgencyAt: null,
        agencyId: null,
        agencyAccountNumber: null,
        lastActionAt: new Date(),
      },
    });

    // Log activity
    await logCollectionActivity(
      accountCollectionId,
      'RECALLED_FROM_AGENCY',
      `Recalled from ${agency?.name || 'agency'}: ${result.data.reason}`,
      session.user.id
    );

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'AgencyReferral',
      entityId: referral.id,
      details: {
        action: 'recall',
        reason: result.data.reason,
        agencyName: agency?.name || 'unknown',
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  },
  { permissions: ['collections:send_to_agency'] }
);
