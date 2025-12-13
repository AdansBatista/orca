import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
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
  async (req, session, { params }: RouteParams) => {
    const { linkId } = await params;

    const paymentLink = await db.paymentLink.findFirst({
      where: withSoftDelete({
        id: linkId,
        ...getClinicFilter(session),
      }),
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
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            subtotal: true,
            balance: true,
            status: true,
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
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
  async (req, session, { params }: RouteParams) => {
    const { linkId } = await params;
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    const paymentLink = await db.paymentLink.findFirst({
      where: withSoftDelete({
        id: linkId,
        ...getClinicFilter(session),
      }),
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
        if (paymentLink.status !== 'PENDING') {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Payment link has already been sent or completed',
              },
            },
            { status: 400 }
          );
        }

        const body = await req.json().catch(() => ({}));
        const method = body.method || 'EMAIL'; // EMAIL or SMS

        // TODO: Integrate with messaging service to actually send
        // For now, we'll just update the status

        const updatedLink = await db.paymentLink.update({
          where: { id: linkId },
          data: {
            status: 'SENT',
            sentAt: new Date(),
            sentVia: method,
            updatedBy: session.user.id,
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
        if (!['SENT', 'PENDING'].includes(paymentLink.status)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Cannot resend completed or cancelled links',
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
            status: 'SENT',
            sentAt: new Date(),
            sentVia: method,
            expiresAt: newExpiresAt,
            updatedBy: session.user.id,
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
        if (['COMPLETED', 'CANCELLED'].includes(paymentLink.status)) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'INVALID_STATUS',
                message: 'Cannot cancel completed or already cancelled links',
              },
            },
            { status: 400 }
          );
        }

        const updatedLink = await db.paymentLink.update({
          where: { id: linkId },
          data: {
            status: 'CANCELLED',
            updatedBy: session.user.id,
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
  async (req, session, { params }: RouteParams) => {
    const { linkId } = await params;

    const paymentLink = await db.paymentLink.findFirst({
      where: withSoftDelete({
        id: linkId,
        ...getClinicFilter(session),
      }),
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

    // Cannot delete completed links
    if (paymentLink.status === 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CANNOT_DELETE_COMPLETED',
            message: 'Cannot delete completed payment links',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete
    await db.paymentLink.update({
      where: { id: linkId },
      data: {
        status: 'CANCELLED',
        deletedAt: new Date(),
        deletedBy: session.user.id,
        updatedBy: session.user.id,
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
