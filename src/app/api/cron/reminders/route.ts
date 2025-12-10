import { NextRequest, NextResponse } from 'next/server';

import { getReminderService } from '@/lib/services/reminders';

/**
 * POST /api/cron/reminders
 *
 * Cron endpoint for processing appointment reminders.
 * This should be called every 5-15 minutes by a scheduler.
 *
 * Processes:
 * 1. Due reminders that need to be sent
 * 2. Failed reminders that can be retried
 *
 * Security: Requires CRON_SECRET header to prevent unauthorized access.
 */
export async function POST(req: NextRequest) {
  // Verify cron secret
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.warn('[ReminderCron] CRON_SECRET not configured');
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { success: false, error: 'Cron not configured' },
        { status: 500 }
      );
    }
  } else if (cronSecret !== expectedSecret) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const startTime = Date.now();
  console.log('[ReminderCron] Starting reminder processing...');

  try {
    const service = getReminderService();

    // Process due reminders and retry failed ones
    const [processResult, retryResult] = await Promise.all([
      service.processDueReminders(),
      service.retryFailedReminders(),
    ]);

    const duration = Date.now() - startTime;

    const summary = {
      dueReminders: {
        processed: processResult.processed,
        sent: processResult.sent,
        failed: processResult.failed,
        skipped: processResult.skipped,
      },
      retries: {
        retried: retryResult.retried,
        succeeded: retryResult.succeeded,
      },
      durationMs: duration,
    };

    console.log('[ReminderCron] Processing complete:', summary);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('[ReminderCron] Error:', error);
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
 * GET /api/cron/reminders
 *
 * Health check endpoint for cron monitoring.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'reminder-processor',
      timestamp: new Date().toISOString(),
    },
  });
}
