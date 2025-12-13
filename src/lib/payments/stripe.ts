import Stripe from 'stripe';

// =============================================================================
// STRIPE PAYMENT GATEWAY INTEGRATION
// =============================================================================

/**
 * Stripe client instance
 * Uses the secret key from environment variables
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
});

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export interface CreatePaymentIntentParams {
  amount: number; // In cents
  currency?: string;
  customerId?: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, string>;
  captureMethod?: 'automatic' | 'manual';
  setupFutureUsage?: 'on_session' | 'off_session';
  receiptEmail?: string;
}

export interface CreateCustomerParams {
  email: string;
  name: string;
  phone?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentMethodParams {
  customerId: string;
  paymentMethodId: string; // From Stripe.js
  setAsDefault?: boolean;
}

export interface RefundParams {
  paymentIntentId: string;
  amount?: number; // In cents, if partial refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}

export interface PaymentLinkParams {
  amount: number; // In cents
  currency?: string;
  description?: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
  expiresAt?: Date;
}

// -----------------------------------------------------------------------------
// Customer Management
// -----------------------------------------------------------------------------

/**
 * Create a Stripe customer
 */
export async function createStripeCustomer(
  params: CreateCustomerParams
): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email: params.email,
    name: params.name,
    phone: params.phone,
    metadata: params.metadata,
  });
}

/**
 * Get a Stripe customer by ID
 */
export async function getStripeCustomer(
  customerId: string
): Promise<Stripe.Customer | Stripe.DeletedCustomer> {
  return stripe.customers.retrieve(customerId);
}

/**
 * Update a Stripe customer
 */
export async function updateStripeCustomer(
  customerId: string,
  params: Partial<CreateCustomerParams>
): Promise<Stripe.Customer> {
  return stripe.customers.update(customerId, {
    email: params.email,
    name: params.name,
    phone: params.phone,
    metadata: params.metadata,
  });
}

// -----------------------------------------------------------------------------
// Payment Intent Management
// -----------------------------------------------------------------------------

/**
 * Create a payment intent
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> {
  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: params.amount,
    currency: params.currency || 'cad',
    capture_method: params.captureMethod || 'automatic',
    description: params.description,
    metadata: params.metadata,
    receipt_email: params.receiptEmail,
  };

  if (params.customerId) {
    paymentIntentParams.customer = params.customerId;
  }

  if (params.paymentMethodId) {
    paymentIntentParams.payment_method = params.paymentMethodId;
    paymentIntentParams.confirm = true;
  }

  if (params.setupFutureUsage) {
    paymentIntentParams.setup_future_usage = params.setupFutureUsage;
  }

  return stripe.paymentIntents.create(paymentIntentParams);
}

/**
 * Retrieve a payment intent
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}

/**
 * Confirm a payment intent (for manual confirmation flow)
 */
export async function confirmPaymentIntent(
  paymentIntentId: string,
  paymentMethodId?: string
): Promise<Stripe.PaymentIntent> {
  const params: Stripe.PaymentIntentConfirmParams = {};
  if (paymentMethodId) {
    params.payment_method = paymentMethodId;
  }
  return stripe.paymentIntents.confirm(paymentIntentId, params);
}

/**
 * Capture a payment intent (for manual capture flow)
 */
export async function capturePaymentIntent(
  paymentIntentId: string,
  amountToCapture?: number
): Promise<Stripe.PaymentIntent> {
  const params: Stripe.PaymentIntentCaptureParams = {};
  if (amountToCapture) {
    params.amount_to_capture = amountToCapture;
  }
  return stripe.paymentIntents.capture(paymentIntentId, params);
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string,
  reason?: Stripe.PaymentIntentCancelParams.CancellationReason
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.cancel(paymentIntentId, {
    cancellation_reason: reason,
  });
}

// -----------------------------------------------------------------------------
// Payment Method Management
// -----------------------------------------------------------------------------

/**
 * Attach a payment method to a customer
 */
export async function attachPaymentMethod(
  params: CreatePaymentMethodParams
): Promise<Stripe.PaymentMethod> {
  const paymentMethod = await stripe.paymentMethods.attach(params.paymentMethodId, {
    customer: params.customerId,
  });

  if (params.setAsDefault) {
    await stripe.customers.update(params.customerId, {
      invoice_settings: {
        default_payment_method: params.paymentMethodId,
      },
    });
  }

  return paymentMethod;
}

/**
 * Get a payment method
 */
export async function getPaymentMethod(
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  return stripe.paymentMethods.retrieve(paymentMethodId);
}

/**
 * List payment methods for a customer
 */
export async function listPaymentMethods(
  customerId: string,
  type: Stripe.PaymentMethodListParams.Type = 'card'
): Promise<Stripe.ApiList<Stripe.PaymentMethod>> {
  return stripe.paymentMethods.list({
    customer: customerId,
    type,
  });
}

/**
 * Detach a payment method from a customer
 */
export async function detachPaymentMethod(
  paymentMethodId: string
): Promise<Stripe.PaymentMethod> {
  return stripe.paymentMethods.detach(paymentMethodId);
}

/**
 * Set a default payment method for a customer
 */
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> {
  return stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

// -----------------------------------------------------------------------------
// Refunds
// -----------------------------------------------------------------------------

/**
 * Create a refund
 */
export async function createRefund(params: RefundParams): Promise<Stripe.Refund> {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: params.paymentIntentId,
    reason: params.reason,
    metadata: params.metadata,
  };

  if (params.amount) {
    refundParams.amount = params.amount;
  }

  return stripe.refunds.create(refundParams);
}

/**
 * Get a refund
 */
export async function getRefund(refundId: string): Promise<Stripe.Refund> {
  return stripe.refunds.retrieve(refundId);
}

/**
 * List refunds for a payment intent
 */
export async function listRefunds(
  paymentIntentId: string
): Promise<Stripe.ApiList<Stripe.Refund>> {
  return stripe.refunds.list({
    payment_intent: paymentIntentId,
  });
}

// -----------------------------------------------------------------------------
// Checkout Sessions (for Payment Links)
// -----------------------------------------------------------------------------

/**
 * Create a checkout session for a payment link
 */
export async function createCheckoutSession(
  params: PaymentLinkParams & { successUrl: string; cancelUrl: string }
): Promise<Stripe.Checkout.Session> {
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'payment',
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    line_items: [
      {
        price_data: {
          currency: params.currency || 'cad',
          product_data: {
            name: params.description || 'Payment',
          },
          unit_amount: params.amount,
        },
        quantity: 1,
      },
    ],
    metadata: params.metadata,
  };

  if (params.customerEmail) {
    sessionParams.customer_email = params.customerEmail;
  }

  if (params.expiresAt) {
    sessionParams.expires_at = Math.floor(params.expiresAt.getTime() / 1000);
  }

  return stripe.checkout.sessions.create(sessionParams);
}

/**
 * Get a checkout session
 */
export async function getCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['payment_intent', 'customer'],
  });
}

// -----------------------------------------------------------------------------
// Setup Intent (for saving cards without payment)
// -----------------------------------------------------------------------------

/**
 * Create a setup intent for saving a payment method
 */
export async function createSetupIntent(
  customerId: string,
  metadata?: Record<string, string>
): Promise<Stripe.SetupIntent> {
  return stripe.setupIntents.create({
    customer: customerId,
    metadata,
  });
}

/**
 * Get a setup intent
 */
export async function getSetupIntent(setupIntentId: string): Promise<Stripe.SetupIntent> {
  return stripe.setupIntents.retrieve(setupIntentId);
}

// -----------------------------------------------------------------------------
// Webhook Helpers
// -----------------------------------------------------------------------------

/**
 * Construct event from webhook payload
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}

// -----------------------------------------------------------------------------
// Terminal (Card-Present) - Placeholder for future implementation
// -----------------------------------------------------------------------------

/**
 * List terminal readers (placeholder)
 */
export async function listTerminalReaders(
  locationId?: string
): Promise<Stripe.ApiList<Stripe.Terminal.Reader>> {
  const params: Stripe.Terminal.ReaderListParams = {};
  if (locationId) {
    params.location = locationId;
  }
  return stripe.terminal.readers.list(params);
}

/**
 * Create a terminal connection token
 */
export async function createConnectionToken(
  locationId?: string
): Promise<Stripe.Terminal.ConnectionToken> {
  const params: Stripe.Terminal.ConnectionTokenCreateParams = {};
  if (locationId) {
    params.location = locationId;
  }
  return stripe.terminal.connectionTokens.create(params);
}

// -----------------------------------------------------------------------------
// Utility Functions
// -----------------------------------------------------------------------------

/**
 * Convert amount to cents
 */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * Convert cents to dollars
 */
export function fromCents(cents: number): number {
  return cents / 100;
}

/**
 * Format card brand for display
 */
export function formatCardBrand(brand: string): string {
  const brands: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'American Express',
    discover: 'Discover',
    diners: 'Diners Club',
    jcb: 'JCB',
    unionpay: 'UnionPay',
    unknown: 'Card',
  };
  return brands[brand.toLowerCase()] || brand;
}

/**
 * Check if a payment intent is successful
 */
export function isPaymentSuccessful(paymentIntent: Stripe.PaymentIntent): boolean {
  return paymentIntent.status === 'succeeded';
}

/**
 * Check if a payment intent requires action
 */
export function requiresAction(paymentIntent: Stripe.PaymentIntent): boolean {
  return paymentIntent.status === 'requires_action';
}

/**
 * Extract card details from a payment method
 */
export function extractCardDetails(paymentMethod: Stripe.PaymentMethod): {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
} | null {
  if (paymentMethod.type !== 'card' || !paymentMethod.card) {
    return null;
  }

  return {
    brand: paymentMethod.card.brand,
    last4: paymentMethod.card.last4,
    expMonth: paymentMethod.card.exp_month,
    expYear: paymentMethod.card.exp_year,
  };
}
