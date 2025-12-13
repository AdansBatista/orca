import { NextResponse } from 'next/server';

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
  async (req, session, { params }: RouteParams) => {
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

    // Get related payments if there are payment IDs
    let payments: unknown[] = [];
    if (settlement.paymentIds && settlement.paymentIds.length > 0) {
      payments = await db.payment.findMany({
        where: {
          id: { in: settlement.paymentIds },
          ...getClinicFilter(session),
        },
        select: {
          id: true,
          paymentNumber: true,
          amount: true,
          paymentDate: true,
          paymentType: true,
          status: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...settlement,
        payments,
      },
    });
  },
  { permissions: ['payment:reconcile'] }
);

/**
 * POST /api/settlements/[settlementId]
 * Perform actions on a settlement (confirm, reconcile)
 */
export const POST = withAuth(
  async (req, session, { params }: RouteParams) => {
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
            depositedAt: new Date(),
            depositReference: body.depositReference,
            updatedBy: session.user.id,
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'PaymentSettlement',
          entityId: settlement.id,
          details: { action: 'confirm', settlementNumber: settlement.settlementNumber },
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
            notes: body.notes || settlement.notes,
            updatedBy: session.user.id,
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'PaymentSettlement',
          entityId: settlement.id,
          details: { action: 'reconcile', settlementNumber: settlement.settlementNumber },
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
            notes: body.notes,
            updatedBy: session.user.id,
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'PaymentSettlement',
          entityId: settlement.id,
          details: { action: 'flag_discrepancy', settlementNumber: settlement.settlementNumber },
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
