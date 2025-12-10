/**
 * Scheduled Message Processor
 *
 * POST /api/cron/process-scheduled-messages
 *
 * Processes messages that are scheduled for delivery.
 * Should be called by a cron job (e.g., every minute).
 *
 * Security: Requires a CRON_SECRET header to prevent unauthorized access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMessagingService } from '@/lib/services/messaging';

/**
 * Verify the cron request is authorized
 */
function verifyCronRequest(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow without secret
  if (process.env.NODE_ENV !== 'production' && !cronSecret) {
    return true;
  }

  if (!cronSecret) {
    console.warn('[Cron] CRON_SECRET not configured');
    return false;
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.slice(7);
  return token === cronSecret;
}

/**
 * POST /api/cron/process-scheduled-messages
 * Process scheduled messages that are due
 */
export async function POST(req: NextRequest) {
  // Verify authorization
  if (!verifyCronRequest(req)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const startTime = Date.now();

  try {
    const messagingService = getMessagingService();
    const result = await messagingService.processScheduledMessages();

    const duration = Date.now() - startTime;

    console.log('[Cron] Processed scheduled messages:', {
      processed: result.processed,
      failed: result.failed,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      data: {
        processed: result.processed,
        failed: result.failed,
        duration,
      },
    });
  } catch (error) {
    console.error('[Cron] Error processing scheduled messages:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET for health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'process-scheduled-messages',
    message: 'Use POST to process scheduled messages',
  });
}
