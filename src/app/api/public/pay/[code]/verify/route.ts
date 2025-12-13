import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { getCheckoutSession, fromCents } from '@/lib/payments/stripe';
import { generatePaymentNumber, updateAccountBalance } from '@/lib/billing/utils';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * POST /api/public/pay/[code]/verify
 * Verify a checkout session and complete the payment (public - no auth required)
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { code } = await params;
  const body = await req.json();
  const { sessionId } = body;

  if (!sessionId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISSING_SESSION',
          message: 'Session ID is required',
        },
      },
      { status: 400 }
    );
  }

  // Find the payment link
  const paymentLink = await db.paymentLink.findFirst({
    where: {
      linkCode: code,
      deletedAt: null,
    },
    include: {
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      account: true,
    },
  });

  if (!paymentLink) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LINK_NOT_FOUND',
          message: 'Payment link not found',
        },
      },
      { status: 404 }
    );
  }

  // Already completed?
  if (paymentLink.status === 'COMPLETED') {
    return NextResponse.json({
      success: true,
      data: {
        paymentId: paymentLink.paymentId,
        amount: paymentLink.amount,
        alreadyProcessed: true,
      },
    });
  }

  try {
    // Retrieve the checkout session from Stripe
    const session = await getCheckoutSession(sessionId);

    // Verify the payment
    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_NOT_COMPLETE',
            message: 'Payment has not been completed',
          },
        },
        { status: 400 }
      );
    }

    // Verify the metadata matches
    if (session.metadata?.paymentLinkId !== paymentLink.id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SESSION_MISMATCH',
            message: 'Payment session does not match this link',
          },
        },
        { status: 400 }
      );
    }

    // Calculate amount
    const amountPaid = fromCents(session.amount_total || 0);

    // Create payment record in database
    const paymentNumber = await generatePaymentNumber(paymentLink.clinicId);

    const payment = await db.payment.create({
      data: {
        clinicId: paymentLink.clinicId,
        patientId: paymentLink.patientId,
        accountId: paymentLink.accountId,
        paymentNumber,
        amount: amountPaid,
        paymentDate: new Date(),
        paymentType: 'CARD',
        paymentMethod: 'ONLINE',
        status: 'COMPLETED',
        stripePaymentIntentId: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
        stripeSessionId: sessionId,
        notes: `Online payment via payment link ${paymentLink.linkCode}`,
        metadata: {
          paymentLinkCode: paymentLink.linkCode,
          checkoutSessionId: sessionId,
        },
      },
    });

    // Create payment allocation if there are invoices
    if (paymentLink.invoiceIds && paymentLink.invoiceIds.length > 0) {
      let remainingAmount = amountPaid;

      for (const invoiceId of paymentLink.invoiceIds) {
        if (remainingAmount <= 0) break;

        const invoice = await db.invoice.findUnique({
          where: { id: invoiceId },
          select: { id: true, balance: true },
        });

        if (invoice && invoice.balance > 0) {
          const allocationAmount = Math.min(remainingAmount, invoice.balance);

          await db.paymentAllocation.create({
            data: {
              clinicId: paymentLink.clinicId,
              paymentId: payment.id,
              invoiceId: invoice.id,
              amount: allocationAmount,
            },
          });

          // Update invoice balance
          const newBalance = invoice.balance - allocationAmount;
          await db.invoice.update({
            where: { id: invoice.id },
            data: {
              balance: newBalance,
              status: newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID',
            },
          });

          remainingAmount -= allocationAmount;
        }
      }
    }

    // Update account balance
    await updateAccountBalance(paymentLink.accountId);

    // Update payment link status
    await db.paymentLink.update({
      where: { id: paymentLink.id },
      data: {
        status: 'COMPLETED',
        paidAt: new Date(),
        paymentId: payment.id,
      },
    });

    // Get receipt URL if available
    let receiptUrl: string | undefined;
    if (session.payment_intent && typeof session.payment_intent !== 'string') {
      const latestCharge = session.payment_intent.latest_charge;
      if (latestCharge && typeof latestCharge !== 'string') {
        receiptUrl = latestCharge.receipt_url || undefined;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.paymentNumber,
        amount: amountPaid,
        receiptUrl,
      },
    });
  } catch (error) {
    console.error('Failed to verify payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VERIFICATION_FAILED',
          message: 'Failed to verify payment',
        },
      },
      { status: 500 }
    );
  }
}
