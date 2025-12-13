import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { processDuePayments, getPaymentsNeedingAttention } from '@/lib/billing/recurring-billing';

/**
 * POST /api/cron/process-scheduled-payments
 * Process all due scheduled payments across all clinics
 *
 * This endpoint should be called by a cron job (e.g., daily at 6 AM)
 * It requires a secret key for authentication
 */
export async function POST(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing cron secret',
        },
      },
      { status: 401 }
    );
  }

  try {
    // Get all active clinics
    const clinics = await db.clinic.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const results: Array<{
      clinicId: string;
      clinicName: string;
      processed: number;
      successful: number;
      failed: number;
      retried: number;
    }> = [];

    // Process payments for each clinic
    for (const clinic of clinics) {
      const clinicResults = await processDuePayments(clinic.id);

      const successful = clinicResults.filter((r) => r.success).length;
      const failed = clinicResults.filter((r) => !r.success && !r.retryScheduled).length;
      const retried = clinicResults.filter((r) => r.retryScheduled).length;

      results.push({
        clinicId: clinic.id,
        clinicName: clinic.name,
        processed: clinicResults.length,
        successful,
        failed,
        retried,
      });
    }

    // Calculate totals
    const totals = results.reduce(
      (acc, r) => ({
        processed: acc.processed + r.processed,
        successful: acc.successful + r.successful,
        failed: acc.failed + r.failed,
        retried: acc.retried + r.retried,
      }),
      { processed: 0, successful: 0, failed: 0, retried: 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        totals,
        byClinic: results,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to process scheduled payments:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: 'Failed to process scheduled payments',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/process-scheduled-payments
 * Get summary of payments needing attention across all clinics
 */
export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or missing cron secret',
        },
      },
      { status: 401 }
    );
  }

  try {
    // Get all active clinics
    const clinics = await db.clinic.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const results: Array<{
      clinicId: string;
      clinicName: string;
      failed: number;
      overdue: number;
      dueToday: number;
      upcomingWeek: number;
    }> = [];

    for (const clinic of clinics) {
      const attention = await getPaymentsNeedingAttention(clinic.id);
      results.push({
        clinicId: clinic.id,
        clinicName: clinic.name,
        ...attention,
      });
    }

    // Calculate totals
    const totals = results.reduce(
      (acc, r) => ({
        failed: acc.failed + r.failed,
        overdue: acc.overdue + r.overdue,
        dueToday: acc.dueToday + r.dueToday,
        upcomingWeek: acc.upcomingWeek + r.upcomingWeek,
      }),
      { failed: 0, overdue: 0, dueToday: 0, upcomingWeek: 0 }
    );

    return NextResponse.json({
      success: true,
      data: {
        totals,
        byClinic: results,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to get payment summary:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SUMMARY_ERROR',
          message: 'Failed to get payment summary',
        },
      },
      { status: 500 }
    );
  }
}
