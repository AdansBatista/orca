/**
 * SendGrid Webhook Handler
 *
 * POST /api/webhooks/sendgrid
 *
 * Receives delivery status events from SendGrid for email messages.
 * Validates the request signature and updates message delivery status.
 *
 * @see https://docs.sendgrid.com/for-developers/tracking-events/event
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSendGridProvider } from '@/lib/services/messaging/providers/sendgrid';
import { getMessagingService } from '@/lib/services/messaging';

/**
 * Handle SendGrid webhook
 *
 * SendGrid sends events as JSON array in POST requests.
 * Multiple events can be batched in a single request.
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature validation
    const rawBody = await req.text();

    // Get signature header
    const signature = req.headers.get('x-twilio-email-event-webhook-signature') || '';

    // Get provider
    const provider = getSendGridProvider();

    // Validate signature in production
    if (process.env.NODE_ENV === 'production' && signature) {
      const isValid = provider.validateWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('[SendGrid Webhook] Invalid signature');
        return new NextResponse('Invalid signature', { status: 401 });
      }
    }

    // Parse all events from the webhook
    const events = provider.parseWebhookEvents(rawBody);

    if (events.length === 0) {
      console.warn('[SendGrid Webhook] No valid events in payload');
      return new NextResponse('No events', { status: 400 });
    }

    // Process each event
    const messagingService = getMessagingService();
    let processed = 0;
    let notFound = 0;

    for (const event of events) {
      const success = await messagingService.processWebhook(event);
      if (success) {
        processed++;
      } else {
        notFound++;
      }
    }

    console.log('[SendGrid Webhook] Processed:', {
      total: events.length,
      processed,
      notFound,
    });

    // SendGrid expects 200 response
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[SendGrid Webhook] Error:', error);
    // Return 200 to prevent SendGrid retries for processing errors
    return new NextResponse('Error processed', { status: 200 });
  }
}

/**
 * Handle GET for webhook verification (optional)
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    provider: 'sendgrid',
    message: 'SendGrid webhook endpoint active',
  });
}
