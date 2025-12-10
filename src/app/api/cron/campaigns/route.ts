import { NextRequest, NextResponse } from 'next/server';

import { getCampaignExecutionService } from '@/lib/services/campaigns';

/**
 * POST /api/cron/campaigns
 *
 * Cron endpoint for processing campaigns.
 * This should be called by a scheduler (e.g., Vercel Cron, external cron service).
 *
 * Processes:
 * 1. Scheduled campaigns that are due
 * 2. Recurring campaigns based on their schedule
 * 3. Pending campaign sends (WAIT steps that have completed)
 *
 * Security: Requires CRON_SECRET header to prevent unauthorized access.
 */
export async function POST(req: NextRequest) {
  // Verify cron secret
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.warn('[CampaignCron] CRON_SECRET not configured');
    // In development, allow without secret
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
  console.log('[CampaignCron] Starting campaign processing...');

  try {
    const service = getCampaignExecutionService();

    // Process all campaign types in parallel
    const [scheduledResults, recurringResults, pendingResults] = await Promise.all([
      service.processScheduledCampaigns(),
      service.processRecurringCampaigns(),
      service.processPendingSends(),
    ]);

    const duration = Date.now() - startTime;

    const summary = {
      scheduled: {
        campaigns: scheduledResults.length,
        totalProcessed: scheduledResults.reduce((sum, r) => sum + r.processed, 0),
        totalSent: scheduledResults.reduce((sum, r) => sum + r.sent, 0),
        totalFailed: scheduledResults.reduce((sum, r) => sum + r.failed, 0),
      },
      recurring: {
        campaigns: recurringResults.length,
        totalProcessed: recurringResults.reduce((sum, r) => sum + r.processed, 0),
        totalSent: recurringResults.reduce((sum, r) => sum + r.sent, 0),
        totalFailed: recurringResults.reduce((sum, r) => sum + r.failed, 0),
      },
      pending: pendingResults,
      durationMs: duration,
    };

    console.log('[CampaignCron] Processing complete:', summary);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('[CampaignCron] Error:', error);
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
 * GET /api/cron/campaigns
 *
 * Health check endpoint for cron monitoring.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'campaign-processor',
      timestamp: new Date().toISOString(),
    },
  });
}
