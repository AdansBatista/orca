/**
 * Twilio Webhook Handler
 *
 * POST /api/webhooks/twilio
 *
 * Handles two types of Twilio webhooks:
 * 1. Delivery status updates - Updates message delivery status
 * 2. Inbound SMS messages - Creates new message records from patient replies
 *
 * @see https://www.twilio.com/docs/sms/tutorials/how-to-confirm-delivery
 * @see https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTwilioProvider } from '@/lib/services/messaging/providers/twilio';
import { getMessagingService } from '@/lib/services/messaging';

/**
 * Handle Twilio webhook
 *
 * Twilio sends both status callbacks and inbound messages as form-urlencoded POST requests.
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature validation
    const rawBody = await req.text();

    // Get signature header
    const signature = req.headers.get('x-twilio-signature') || '';

    // Get provider and validate signature
    const provider = getTwilioProvider();

    // Validate signature in production
    if (process.env.NODE_ENV === 'production') {
      const isValid = provider.validateWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.warn('[Twilio Webhook] Invalid signature');
        return new NextResponse('Invalid signature', { status: 401 });
      }
    }

    const messagingService = getMessagingService();

    // Check if this is an inbound message or a status callback
    if (provider.isInboundMessage(rawBody)) {
      // Process inbound SMS from patient
      const inboundMessage = provider.parseInboundMessage(rawBody);

      if (!inboundMessage) {
        console.warn('[Twilio Webhook] Failed to parse inbound message');
        return new NextResponse('Invalid inbound payload', { status: 400 });
      }

      const result = await messagingService.processInboundMessage({
        channel: 'SMS',
        fromAddress: inboundMessage.From,
        toAddress: inboundMessage.To,
        body: inboundMessage.Body,
        providerMessageId: inboundMessage.MessageSid,
        mediaUrls: inboundMessage.MediaUrl0 ? [inboundMessage.MediaUrl0] : undefined,
        metadata: {
          fromCity: inboundMessage.FromCity,
          fromState: inboundMessage.FromState,
          fromCountry: inboundMessage.FromCountry,
          numMedia: inboundMessage.NumMedia,
        },
      });

      console.log('[Twilio Webhook] Inbound message processed:', {
        from: inboundMessage.From,
        messageId: result.messageId,
        success: result.success,
      });

      // Return TwiML response (empty response = no auto-reply)
      // You could add <Message>Thanks for your reply!</Message> here for auto-responses
      return new NextResponse(
        '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/xml' },
        }
      );
    }

    // Process delivery status callback
    const webhookPayload = provider.parseWebhook(rawBody, {
      'x-twilio-signature': signature,
    });

    if (!webhookPayload) {
      console.warn('[Twilio Webhook] Invalid payload');
      return new NextResponse('Invalid payload', { status: 400 });
    }

    // Process the webhook
    const processed = await messagingService.processWebhook(webhookPayload);

    if (processed) {
      console.log('[Twilio Webhook] Status update processed:', {
        messageId: webhookPayload.providerMessageId,
        status: webhookPayload.status,
      });
    } else {
      console.warn('[Twilio Webhook] Message not found:', webhookPayload.providerMessageId);
    }

    // Twilio expects 200 response
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('[Twilio Webhook] Error:', error);
    // Return 200 to prevent Twilio retries for processing errors
    return new NextResponse('Error processed', { status: 200 });
  }
}

/**
 * Handle GET for webhook verification (optional)
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    provider: 'twilio',
    message: 'Twilio webhook endpoint active',
  });
}
