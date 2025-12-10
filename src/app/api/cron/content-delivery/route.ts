/**
 * Content Delivery Automation Cron API
 *
 * POST /api/cron/content-delivery - Process scheduled content deliveries
 *
 * Cron endpoint for automated content delivery processing.
 * This should be called daily (or as needed) by a scheduler.
 *
 * Processes:
 * 1. New treatment starts - sends onboarding content
 * 2. Upcoming appointments - sends preparation content
 *
 * Security: Requires CRON_SECRET header to prevent unauthorized access.
 */

import { NextRequest, NextResponse } from 'next/server';

import { getContentDeliveryService } from '@/lib/services/content-delivery';

/**
 * POST /api/cron/content-delivery
 *
 * Process scheduled content deliveries across all clinics.
 */
export async function POST(req: NextRequest) {
  // Verify cron secret
  const cronSecret = req.headers.get('x-cron-secret');
  const expectedSecret = process.env.CRON_SECRET;

  if (!expectedSecret) {
    console.warn('[ContentDeliveryCron] CRON_SECRET not configured');
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
  console.log('[ContentDeliveryCron] Starting content delivery processing...');

  try {
    const service = getContentDeliveryService();
    const result = await service.processScheduledDeliveries();

    const duration = Date.now() - startTime;

    const summary = {
      processed: result.processed,
      sent: result.sent,
      failed: result.failed,
      errorCount: result.errors.length,
      durationMs: duration,
    };

    console.log('[ContentDeliveryCron] Processing complete:', summary);

    // Return errors in development only
    const response = {
      success: true,
      data: {
        ...summary,
        ...(process.env.NODE_ENV !== 'production' && result.errors.length > 0
          ? { errors: result.errors }
          : {}),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[ContentDeliveryCron] Error:', error);
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
 * GET /api/cron/content-delivery
 *
 * Health check endpoint for cron monitoring.
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'healthy',
      service: 'content-delivery-processor',
      timestamp: new Date().toISOString(),
    },
  });
}
