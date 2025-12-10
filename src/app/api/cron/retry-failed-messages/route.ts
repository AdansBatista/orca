/**
 * Failed Message Retry Processor
 *
 * POST /api/cron/retry-failed-messages
 *
 * Retries messages that failed delivery with exponential backoff.
 * Should be called by a cron job (e.g., every 5 minutes).
 *
 * Retry schedule:
 * - 1st retry: 1 minute after failure
 * - 2nd retry: 4 minutes after 1st retry
 * - 3rd retry: 16 minutes after 2nd retry
 * - After 3 retries: Message is permanently failed
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
 * POST /api/cron/retry-failed-messages
 * Retry failed messages with exponential backoff
 */
export async function POST(req: NextRequest) {
  // Verify authorization
  if (!verifyCronRequest(req)) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const startTime = Date.now();

  try {
    const messagingService = getMessagingService();
    const result = await messagingService.retryFailedMessages();

    const duration = Date.now() - startTime;

    console.log('[Cron] Retried failed messages:', {
      retried: result.retried,
      succeeded: result.succeeded,
      failed: result.failed,
      skipped: result.skipped,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        duration,
      },
    });
  } catch (error) {
    console.error('[Cron] Error retrying failed messages:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RETRY_ERROR',
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
    endpoint: 'retry-failed-messages',
    message: 'Use POST to retry failed messages',
    retrySchedule: {
      maxRetries: 3,
      delays: ['1 minute', '4 minutes', '16 minutes'],
    },
  });
}
