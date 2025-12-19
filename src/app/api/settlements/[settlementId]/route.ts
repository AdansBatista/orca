import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

interface RouteParams {
  params: Promise<{ settlementId: string }>;
}

/**
 * GET /api/settlements/[settlementId]
 * Get a specific settlement with related payments
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { settlementId } = await params;

    const settlement = await db.paymentSettlement.findFirst({
      where: {
        id: settlementId,
        ...getClinicFilter(session),
      },
    });

    if (!settlement) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SETTLEMENT_NOT_FOUND',
            message: 'Settlement not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: settlement,
    });
  },
  { permissions: ['payment:reconcile'] }
);

/**
 * POST /api/settlements/[settlementId]
 * Perform actions on a settlement (confirm, reconcile)
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { settlementId } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    const settlement = await db.paymentSettlement.findFirst({
      where: {
        id: settlementId,
        ...getClinicFilter(session),
      },
    });

    if (!settlement) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SETTLEMENT_NOT_FOUND',
            message: 'Settlement not found',
          },
        },
        { status: 404 }
      );
    }

    const { ipAddress, userAgent } = getRequestMeta(req);

    switch (action) {
      case 'confirm': {
        // Mark settlement as confirmed/deposited
        if (settlement.status !== 'PENDING') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Settlement is not pending',
              },
            },
            { status: 400 }
          );
        }

        const body = await req.json().catch(() => ({}));

        const updatedSettlement = await db.paymentSettlement.update({
          where: { id: settlementId },
          data: {
            status: 'DEPOSITED',
            depositDate: new Date(),
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'PaymentSettlement',
          entityId: settlement.id,
          details: { action: 'confirm', settlementId: settlement.settlementId },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: updatedSettlement,
        });
      }

      case 'reconcile': {
        // Mark as reconciled after bank statement matching
        if (settlement.status !== 'DEPOSITED') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Settlement must be deposited before reconciliation',
              },
            },
            { status: 400 }
          );
        }

        const body = await req.json().catch(() => ({}));

        const updatedSettlement = await db.paymentSettlement.update({
          where: { id: settlementId },
          data: {
            status: 'RECONCILED',
            reconciledAt: new Date(),
            reconciledBy: session.user.id,
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'PaymentSettlement',
          entityId: settlement.id,
          details: { action: 'reconcile', settlementId: settlement.settlementId },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: updatedSettlement,
        });
      }

      case 'flag': {
        // Flag a discrepancy
        const body = await req.json();

        const updatedSettlement = await db.paymentSettlement.update({
          where: { id: settlementId },
          data: {
            status: 'DISCREPANCY',
            discrepancy: body.discrepancyAmount,
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'PaymentSettlement',
          entityId: settlement.id,
          details: { action: 'flag_discrepancy', settlementId: settlement.settlementId },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: updatedSettlement,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Invalid action. Supported: confirm, reconcile, flag',
            },
          },
          { status: 400 }
        );
    }
  },
  { permissions: ['payment:reconcile'] }
);
