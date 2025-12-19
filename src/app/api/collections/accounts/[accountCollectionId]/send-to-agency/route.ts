import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { sendToAgencySchema } from '@/lib/validations/collections';
import { logCollectionActivity, checkAgencyEligibility } from '@/lib/billing/collections-utils';

interface RouteParams {
  params: Promise<{ accountCollectionId: string }>;
}

/**
 * POST /api/collections/accounts/:accountCollectionId/send-to-agency
 * Send account to collection agency
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { accountCollectionId } = await params;
    const body = await req.json();

    // Validate input
    const result = sendToAgencySchema.safeParse(body);
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

    const data = result.data;

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

    // Verify agency exists
    const agency = await db.collectionAgency.findFirst({
      where: withSoftDelete({
        id: data.agencyId,
        clinicId: session.user.clinicId,
        isActive: true,
      }),
    });

    if (!agency) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AGENCY_NOT_FOUND',
            message: 'Collection agency not found or inactive',
          },
        },
        { status: 404 }
      );
    }

    // Check eligibility
    const eligibility = await checkAgencyEligibility(
      accountCollection.accountId,
      session.user.clinicId
    );

    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_ELIGIBLE',
            message: eligibility.reason || 'Account not eligible for agency referral',
          },
        },
        { status: 400 }
      );
    }

    // Check minimum balance
    if (eligibility.balance < agency.minBalance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BALANCE_TOO_LOW',
            message: `Balance must be at least $${agency.minBalance} for this agency`,
          },
        },
        { status: 400 }
      );
    }

    // Check minimum days overdue
    if (eligibility.daysOverdue < agency.minDays) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_OVERDUE_ENOUGH',
            message: `Account must be at least ${agency.minDays} days overdue for this agency`,
          },
        },
        { status: 400 }
      );
    }

    // Create agency referral
    const referral = await db.agencyReferral.create({
      data: {
        clinicId: session.user.clinicId,
        agencyId: data.agencyId,
        accountId: accountCollection.accountId,
        referralDate: new Date(),
        referredBalance: accountCollection.currentBalance,
        status: 'ACTIVE',
      },
    });

    // Update account collection status
    await db.accountCollection.update({
      where: { id: accountCollectionId },
      data: {
        status: 'AGENCY',
        sentToAgencyAt: new Date(),
        agencyId: data.agencyId,
        lastActionAt: new Date(),
      },
    });

    // Log activity
    await logCollectionActivity(
      accountCollectionId,
      'SENT_TO_AGENCY',
      `Sent to collection agency: ${agency.name}`,
      session.user.id
    );

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'AgencyReferral',
      entityId: referral.id,
      details: {
        accountCollectionId,
        agencyId: data.agencyId,
        agencyName: agency.name,
        referredBalance: accountCollection.currentBalance,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: referral },
      { status: 201 }
    );
  },
  { permissions: ['collections:send_to_agency'] }
);
