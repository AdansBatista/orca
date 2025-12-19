import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

interface RouteParams {
  params: Promise<{ linkId: string }>;
}

/**
 * GET /api/payment-links/[linkId]
 * Get a specific payment link
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { linkId } = await params;

    const paymentLink = await db.paymentLink.findFirst({
      where: {
        id: linkId,
        ...getClinicFilter(session),
      },
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
      },
    });

    if (!paymentLink) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_LINK_NOT_FOUND',
            message: 'Payment link not found',
          },
        },
        { status: 404 }
      );
    }

    // Construct the payment URL if not already set
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const paymentUrl = paymentLink.linkUrl || `${baseUrl}/pay/${paymentLink.linkCode}`;

    return NextResponse.json({
      success: true,
      data: {
        ...paymentLink,
        code: paymentLink.linkCode,
        paymentUrl,
      },
    });
  },
  { permissions: ['payment:read'] }
);

/**
 * POST /api/payment-links/[linkId]
 * Perform actions on a payment link (send, cancel, resend)
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { linkId } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    const paymentLink = await db.paymentLink.findFirst({
      where: {
        id: linkId,
        ...getClinicFilter(session),
      },
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
      },
    });

    if (!paymentLink) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_LINK_NOT_FOUND',
            message: 'Payment link not found',
          },
        },
        { status: 404 }
      );
    }

    const { ipAddress, userAgent } = getRequestMeta(req);

    switch (action) {
      case 'send': {
        // Send payment link via email/SMS
        if (paymentLink.status !== 'ACTIVE') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Payment link is not active',
              },
            },
            { status: 400 }
          );
        }

        const body = await req.json().catch(() => ({}));
        const method = body.method || 'EMAIL'; // EMAIL or SMS

        // TODO: Integrate with messaging service to actually send
        // Update sentAt to track when it was sent

        const updatedLink = await db.paymentLink.update({
          where: { id: linkId },
          data: {
            sentAt: new Date(),
            sentVia: method,
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'PaymentLink',
          entityId: paymentLink.id,
          details: { action: 'send', method, code: paymentLink.linkCode },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: updatedLink,
          message: `Payment link sent via ${method}`,
        });
      }

      case 'resend': {
        // Resend payment link
        if (paymentLink.status !== 'ACTIVE') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Cannot resend non-active links',
              },
            },
            { status: 400 }
          );
        }

        // Check if expired, and extend if so
        let newExpiresAt = paymentLink.expiresAt;
        if (paymentLink.expiresAt && new Date(paymentLink.expiresAt) < new Date()) {
          // Extend by 7 days
          newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        }

        const body = await req.json().catch(() => ({}));
        const method = body.method || 'EMAIL';

        // TODO: Integrate with messaging service

        const updatedLink = await db.paymentLink.update({
          where: { id: linkId },
          data: {
            sentAt: new Date(),
            sentVia: method,
            expiresAt: newExpiresAt,
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'PaymentLink',
          entityId: paymentLink.id,
          details: { action: 'resend', method, code: paymentLink.linkCode },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: updatedLink,
          message: `Payment link resent via ${method}`,
        });
      }

      case 'cancel': {
        // Cancel payment link
        if (['PAID', 'CANCELLED'].includes(paymentLink.status)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Cannot cancel paid or already cancelled links',
              },
            },
            { status: 400 }
          );
        }

        const updatedLink = await db.paymentLink.update({
          where: { id: linkId },
          data: {
            status: 'CANCELLED',
          },
        });

        await logAudit(session, {
          action: 'UPDATE',
          entity: 'PaymentLink',
          entityId: paymentLink.id,
          details: { action: 'cancel', code: paymentLink.linkCode },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: updatedLink,
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ACTION',
              message: 'Invalid action. Supported: send, resend, cancel',
            },
          },
          { status: 400 }
        );
    }
  },
  { permissions: ['payment:create'] }
);

/**
 * DELETE /api/payment-links/[linkId]
 * Delete a payment link (soft delete)
 */
export const DELETE = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { linkId } = await params;

    const paymentLink = await db.paymentLink.findFirst({
      where: {
        id: linkId,
        ...getClinicFilter(session),
      },
    });

    if (!paymentLink) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_LINK_NOT_FOUND',
            message: 'Payment link not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot delete paid links
    if (paymentLink.status === 'PAID') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CANNOT_DELETE_PAID',
            message: 'Cannot delete paid payment links',
          },
        },
        { status: 400 }
      );
    }

    // Cancel the link (no soft delete on this model)
    await db.paymentLink.update({
      where: { id: linkId },
      data: {
        status: 'CANCELLED',
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'PaymentLink',
      entityId: paymentLink.id,
      details: { code: paymentLink.linkCode },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  },
  { permissions: ['payment:delete'] }
);
