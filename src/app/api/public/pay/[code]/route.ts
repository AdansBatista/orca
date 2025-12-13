import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import {
  createCheckoutSession,
  createPaymentIntent,
  toCents,
} from '@/lib/payments/stripe';

interface RouteParams {
  params: Promise<{ code: string }>;
}

/**
 * GET /api/public/pay/[code]
 * Get payment link details by code (public - no auth required)
 */
export async function GET(req: Request, { params }: RouteParams) {
  const { code } = await params;

  const paymentLink = await db.paymentLink.findFirst({
    where: {
      linkCode: code,
      deletedAt: null,
    },
    include: {
      clinic: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          logo: true,
          settings: true,
        },
      },
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      account: {
        select: {
          id: true,
          accountNumber: true,
        },
      },
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

  // Check if link is expired
  if (paymentLink.expiresAt && new Date(paymentLink.expiresAt) < new Date()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LINK_EXPIRED',
          message: 'This payment link has expired',
        },
      },
      { status: 410 }
    );
  }

  // Check if link is completed
  if (paymentLink.status === 'COMPLETED') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LINK_COMPLETED',
          message: 'This payment has already been completed',
        },
      },
      { status: 410 }
    );
  }

  // Check if link is cancelled
  if (paymentLink.status === 'CANCELLED') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LINK_CANCELLED',
          message: 'This payment link has been cancelled',
        },
      },
      { status: 410 }
    );
  }

  // Mark link as viewed if first view
  if (!paymentLink.viewedAt) {
    await db.paymentLink.update({
      where: { id: paymentLink.id },
      data: {
        viewedAt: new Date(),
        status: 'VIEWED',
      },
    });
  }

  // Return only necessary public info (no sensitive data)
  return NextResponse.json({
    success: true,
    data: {
      code: paymentLink.linkCode,
      amount: paymentLink.amount,
      description: paymentLink.description,
      allowPartial: paymentLink.allowPartial,
      minimumAmount: paymentLink.minimumAmount,
      expiresAt: paymentLink.expiresAt,
      clinic: {
        name: paymentLink.clinic.name,
        logo: paymentLink.clinic.logo,
      },
      patient: {
        firstName: paymentLink.patient.firstName,
        lastName: paymentLink.patient.lastName,
        email: paymentLink.patient.email,
      },
      accountNumber: paymentLink.account.accountNumber,
    },
  });
}

/**
 * POST /api/public/pay/[code]
 * Process payment for a payment link (public - no auth required)
 */
export async function POST(req: Request, { params }: RouteParams) {
  const { code } = await params;

  const paymentLink = await db.paymentLink.findFirst({
    where: {
      linkCode: code,
      deletedAt: null,
    },
    include: {
      clinic: true,
      patient: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          stripeCustomerId: true,
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

  // Validate link status
  if (paymentLink.expiresAt && new Date(paymentLink.expiresAt) < new Date()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LINK_EXPIRED',
          message: 'This payment link has expired',
        },
      },
      { status: 410 }
    );
  }

  if (paymentLink.status === 'COMPLETED') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LINK_COMPLETED',
          message: 'This payment has already been completed',
        },
      },
      { status: 410 }
    );
  }

  if (paymentLink.status === 'CANCELLED') {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'LINK_CANCELLED',
          message: 'This payment link has been cancelled',
        },
      },
      { status: 410 }
    );
  }

  const body = await req.json();
  const { paymentMethod, amount: customAmount } = body;

  // Determine payment amount
  let paymentAmount = paymentLink.amount;
  if (paymentLink.allowPartial && customAmount) {
    if (paymentLink.minimumAmount && customAmount < paymentLink.minimumAmount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AMOUNT_TOO_LOW',
            message: `Minimum payment amount is $${paymentLink.minimumAmount}`,
          },
        },
        { status: 400 }
      );
    }
    if (customAmount > paymentLink.amount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AMOUNT_TOO_HIGH',
            message: `Payment amount cannot exceed $${paymentLink.amount}`,
          },
        },
        { status: 400 }
      );
    }
    paymentAmount = customAmount;
  }

  // Create base URL for redirects
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // If using Stripe Checkout (no payment method provided)
  if (paymentMethod === 'checkout') {
    try {
      const session = await createCheckoutSession({
        amount: toCents(paymentAmount),
        description: paymentLink.description || `Payment for ${paymentLink.clinic.name}`,
        customerEmail: paymentLink.patient.email || undefined,
        successUrl: `${baseUrl}/pay/${code}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/pay/${code}`,
        metadata: {
          paymentLinkId: paymentLink.id,
          clinicId: paymentLink.clinicId,
          patientId: paymentLink.patientId,
          accountId: paymentLink.accountId,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          type: 'checkout',
          sessionId: session.id,
          url: session.url,
        },
      });
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CHECKOUT_FAILED',
            message: 'Failed to create checkout session',
          },
        },
        { status: 500 }
      );
    }
  }

  // If using Payment Intent (for custom card form)
  if (paymentMethod === 'card') {
    try {
      const paymentIntent = await createPaymentIntent({
        amount: toCents(paymentAmount),
        description: paymentLink.description || `Payment for ${paymentLink.clinic.name}`,
        customerId: paymentLink.patient.stripeCustomerId || undefined,
        receiptEmail: paymentLink.patient.email || undefined,
        metadata: {
          paymentLinkId: paymentLink.id,
          clinicId: paymentLink.clinicId,
          patientId: paymentLink.patientId,
          accountId: paymentLink.accountId,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          type: 'payment_intent',
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id,
        },
      });
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PAYMENT_FAILED',
            message: 'Failed to create payment',
          },
        },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: 'INVALID_PAYMENT_METHOD',
        message: 'Invalid payment method. Use "checkout" or "card"',
      },
    },
    { status: 400 }
  );
}
