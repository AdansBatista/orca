import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { analyticsQuerySchema } from '@/lib/validations/collections';
import {
  calculateAgingSummary,
  calculateDSO,
  calculateCollectionSummary,
} from '@/lib/billing/collections-utils';

/**
 * GET /api/collections/analytics
 * Get collection analytics summary
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      period: searchParams.get('period') ?? undefined,
      workflowId: searchParams.get('workflowId') ?? undefined,
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

    const { fromDate, toDate } = queryResult.data;

    // Get aging summary
    const agingSummary = await calculateAgingSummary(session.user.clinicId);

    // Get DSO
    const dso = await calculateDSO(session.user.clinicId);

    // Get collection summary
    const collectionSummary = await calculateCollectionSummary(session.user.clinicId);

    // Get workflow effectiveness
    const workflows = await db.collectionWorkflow.findMany({
      where: {
        clinicId: session.user.clinicId,
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const workflowStats = await Promise.all(
      workflows.map(async workflow => {
        const dateFilter: Record<string, unknown> = {};
        if (fromDate) dateFilter.startedAt = { gte: fromDate };
        if (toDate) dateFilter.startedAt = { ...dateFilter.startedAt as object, lte: toDate };

        const accounts = await db.accountCollection.aggregate({
          where: {
            clinicId: session.user.clinicId,
            workflowId: workflow.id,
            ...dateFilter,
          },
          _sum: {
            startingBalance: true,
            paidAmount: true,
          },
          _count: true,
        });

        const completed = await db.accountCollection.count({
          where: {
            clinicId: session.user.clinicId,
            workflowId: workflow.id,
            status: { in: ['COMPLETED', 'SETTLED'] },
            ...dateFilter,
          },
        });

        return {
          workflowId: workflow.id,
          workflowName: workflow.name,
          accountCount: accounts._count,
          completedCount: completed,
          completionRate: accounts._count > 0 ? Math.round((completed / accounts._count) * 100) : 0,
          totalStarting: accounts._sum.startingBalance || 0,
          totalCollected: accounts._sum.paidAmount || 0,
          collectionRate: accounts._sum.startingBalance
            ? Math.round(((accounts._sum.paidAmount || 0) / accounts._sum.startingBalance) * 100)
            : 0,
        };
      })
    );

    // Get write-off stats
    const writeOffStats = await db.writeOff.aggregate({
      where: {
        clinicId: session.user.clinicId,
        status: 'APPROVED',
        ...(fromDate && { approvedAt: { gte: fromDate } }),
        ...(toDate && { approvedAt: { lte: toDate } }),
      },
      _sum: {
        amount: true,
        recoveredAmount: true,
      },
      _count: true,
    });

    // Get agency stats
    const agencyStats = await db.agencyReferral.aggregate({
      where: {
        clinicId: session.user.clinicId,
        ...(fromDate && { referralDate: { gte: fromDate } }),
        ...(toDate && { referralDate: { lte: toDate } }),
      },
      _sum: {
        referredBalance: true,
        collectedAmount: true,
        netRecovered: true,
      },
      _count: true,
    });

    // Get reminder effectiveness
    const reminderStats = await db.paymentReminder.groupBy({
      by: ['reminderType'],
      where: {
        clinicId: session.user.clinicId,
        ...(fromDate && { sentAt: { gte: fromDate } }),
        ...(toDate && { sentAt: { lte: toDate } }),
      },
      _count: true,
      _sum: {
        paymentAmount: true,
      },
    });

    const reminderWithPayment = await db.paymentReminder.count({
      where: {
        clinicId: session.user.clinicId,
        paymentReceived: true,
        ...(fromDate && { sentAt: { gte: fromDate } }),
        ...(toDate && { sentAt: { lte: toDate } }),
      },
    });

    const totalReminders = reminderStats.reduce((sum, r) => sum + r._count, 0);

    return NextResponse.json({
      success: true,
      data: {
        aging: agingSummary,
        dso,
        collections: collectionSummary,
        workflowEffectiveness: workflowStats,
        writeOffs: {
          count: writeOffStats._count,
          totalAmount: writeOffStats._sum.amount || 0,
          recoveredAmount: writeOffStats._sum.recoveredAmount || 0,
        },
        agency: {
          referralCount: agencyStats._count,
          totalReferred: agencyStats._sum.referredBalance || 0,
          totalCollected: agencyStats._sum.collectedAmount || 0,
          netRecovered: agencyStats._sum.netRecovered || 0,
          collectionRate: agencyStats._sum.referredBalance
            ? Math.round(((agencyStats._sum.collectedAmount || 0) / agencyStats._sum.referredBalance) * 100)
            : 0,
        },
        reminders: {
          totalSent: totalReminders,
          withPayment: reminderWithPayment,
          conversionRate: totalReminders > 0 ? Math.round((reminderWithPayment / totalReminders) * 100) : 0,
          byType: reminderStats.reduce((acc, r) => {
            acc[r.reminderType] = {
              count: r._count,
              paymentTotal: r._sum.paymentAmount || 0,
            };
            return acc;
          }, {} as Record<string, { count: number; paymentTotal: number }>),
        },
      },
    });
  },
  { permissions: ['collections:read'] }
);
