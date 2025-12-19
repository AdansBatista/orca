import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { analyticsQuerySchema } from '@/lib/validations/collections';

/**
 * GET /api/collections/analytics/trends
 * Get AR trend analysis over time
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      period: searchParams.get('period') ?? undefined,
    };

    const queryResult = analyticsQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { period } = queryResult.data;

    // Calculate date range based on period
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get payments over time
    const payments = await db.payment.findMany({
      where: {
        clinicId: session.user.clinicId,
        status: 'COMPLETED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get new charges over time
    const invoices = await db.invoice.findMany({
      where: {
        clinicId: session.user.clinicId,
        deletedAt: null,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        balance: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate by period
    const aggregateByPeriod = (
      items: { amount?: number; balance?: number; createdAt: Date }[],
      valueKey: 'amount' | 'balance'
    ) => {
      const result: Record<string, number> = {};

      for (const item of items) {
        const date = new Date(item.createdAt);
        let key: string;

        switch (period) {
          case 'day':
            key = date.toISOString().split('T')[0];
            break;
          case 'week':
            // Get week start (Sunday)
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
            break;
          case 'quarter':
            const quarter = Math.floor(date.getMonth() / 3) + 1;
            key = `${date.getFullYear()}-Q${quarter}`;
            break;
          case 'year':
            key = date.getFullYear().toString();
            break;
          case 'month':
          default:
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        const value = item[valueKey] || 0;
        result[key] = (result[key] || 0) + value;
      }

      return result;
    };

    const paymentsByPeriod = aggregateByPeriod(payments, 'amount');
    const chargesByPeriod = aggregateByPeriod(invoices, 'balance');

    // Combine periods and calculate net change
    const allPeriods = new Set([
      ...Object.keys(paymentsByPeriod),
      ...Object.keys(chargesByPeriod),
    ]);

    const trends = Array.from(allPeriods)
      .sort()
      .map(period => ({
        period,
        payments: Math.round((paymentsByPeriod[period] || 0) * 100) / 100,
        charges: Math.round((chargesByPeriod[period] || 0) * 100) / 100,
        netChange: Math.round(
          ((paymentsByPeriod[period] || 0) - (chargesByPeriod[period] || 0)) * 100
        ) / 100,
      }));

    // Get collection workflow completion trend
    const completions = await db.accountCollection.findMany({
      where: {
        clinicId: session.user.clinicId,
        status: { in: ['COMPLETED', 'SETTLED'] },
        completedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        completedAt: true,
        paidAmount: true,
      },
    });

    const completionsByPeriod = aggregateByPeriod(
      completions.map(c => ({ amount: c.paidAmount, createdAt: c.completedAt! })),
      'amount'
    );

    return NextResponse.json({
      success: true,
      data: {
        period,
        startDate,
        endDate,
        trends,
        completions: Object.entries(completionsByPeriod).map(([period, amount]) => ({
          period,
          amount: Math.round(amount * 100) / 100,
        })).sort((a, b) => a.period.localeCompare(b.period)),
      },
    });
  },
  { permissions: ['collections:read'] }
);
