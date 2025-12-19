import { NextResponse } from 'next/server';
import type Stripe from 'stripe';

import { db } from '@/lib/db';
import { constructWebhookEvent } from '@/lib/payments/stripe';
import { updateAccountBalance } from '@/lib/billing/utils';

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 *
 * NOTE: This endpoint does NOT use withAuth because webhooks
 * are authenticated via signature verification.
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = constructWebhookEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      case 'charge.dispute.created':
        await handleDisputeCreated(event.data.object as Stripe.Dispute);
        break;

      case 'charge.dispute.closed':
        await handleDisputeClosed(event.data.object as Stripe.Dispute);
        break;

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // For recurring billing - future implementation
        break;

      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error(`Error handling webhook event ${event.type}:`, err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const payment = await db.payment.findFirst({
    where: {
      gatewayPaymentId: paymentIntent.id,
    },
  });

  if (!payment) {
    console.log(`No payment found for intent ${paymentIntent.id}`);
    return;
  }

  // Update payment status
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'COMPLETED',
    },
  });

  // Update account balance
  await updateAccountBalance(payment.accountId, payment.clinicId, 'system');

  console.log(`Payment ${payment.paymentNumber} marked as completed`);
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  const payment = await db.payment.findFirst({
    where: {
      gatewayPaymentId: paymentIntent.id,
    },
  });

  if (!payment) {
    console.log(`No payment found for intent ${paymentIntent.id}`);
    return;
  }

  // Update payment status
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'FAILED',
    },
  });

  console.log(`Payment ${payment.paymentNumber} marked as failed`);
}

/**
 * Handle canceled payment intent
 */
async function handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const payment = await db.payment.findFirst({
    where: {
      gatewayPaymentId: paymentIntent.id,
    },
  });

  if (!payment) {
    return;
  }

  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: 'CANCELLED',
    },
  });

  console.log(`Payment ${payment.paymentNumber} marked as cancelled`);
}

/**
 * Handle refund event
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  // Find refund by gateway refund ID
  const refundData = charge.refunds?.data?.[0];
  if (!refundData) return;

  const refund = await db.refund.findFirst({
    where: {
      gatewayRefundId: refundData.id,
    },
    include: {
      payment: true,
    },
  });

  if (!refund) {
    // May be a refund created outside our system
    console.log(`No refund record found for ${refundData.id}`);
    return;
  }

  // Update refund status
  await db.refund.update({
    where: { id: refund.id },
    data: {
      status: refundData.status === 'succeeded' ? 'COMPLETED' : 'FAILED',
      processedAt: new Date(),
    },
  });

  // Update payment status if needed
  if (refund.payment) {
    const newStatus =
      refund.amount === refund.payment.amount ? 'REFUNDED' : 'PARTIALLY_REFUNDED';

    await db.payment.update({
      where: { id: refund.payment.id },
      data: { status: newStatus },
    });

    // Update account balance
    await updateAccountBalance(
      refund.payment.accountId,
      refund.payment.clinicId,
      'system'
    );
  }

  console.log(`Refund ${refund.refundNumber} updated from webhook`);
}

/**
 * Handle dispute created
 */
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
  if (!chargeId) return;

  // Log the dispute - full implementation would track disputes in a separate table
  console.log(`Dispute created for charge ${chargeId}: ${dispute.reason}`);

  // Find payment by gateway payment ID (charge ID)
  // Note: Payment model doesn't have gatewayResponse field, so we can't search by charge
  // This would require tracking disputes in a separate model
}

/**
 * Handle dispute closed
 */
async function handleDisputeClosed(dispute: Stripe.Dispute) {
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
  if (!chargeId) return;

  console.log(`Dispute closed for charge ${chargeId}: ${dispute.status}`);

  // Note: Payment model doesn't have gatewayResponse field, so we can't search by charge
  // This would require tracking disputes in a separate model
}

/**
 * Handle checkout session completed (for payment links)
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  // Find payment link by checkout session
  const paymentLinkCode = session.metadata?.paymentLinkCode;

  if (paymentLinkCode) {
    const paymentLink = await db.paymentLink.findFirst({
      where: { linkCode: paymentLinkCode },
    });

    if (paymentLink) {
      await db.paymentLink.update({
        where: { id: paymentLink.id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      console.log(`Payment link ${paymentLinkCode} marked as paid`);
    }
  }
}
