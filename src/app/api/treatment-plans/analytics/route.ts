import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { z } from 'zod';

const analyticsQuerySchema = z.object({
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  providerId: z.string().optional(),
});

/**
 * GET /api/treatment-plans/analytics
 * Get treatment analytics and statistics for the clinic
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      providerId: searchParams.get('providerId') ?? undefined,
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

    const { fromDate, toDate, providerId } = queryResult.data;
    const clinicFilter = getClinicFilter(session);

    // Base date filter
    const dateFilter: Record<string, unknown> = {};
    if (fromDate) dateFilter.gte = fromDate;
    if (toDate) dateFilter.lte = toDate;

    // Build treatment plan filter
    const planFilter: Record<string, unknown> = withSoftDelete({
      ...clinicFilter,
    });
    if (providerId) planFilter.primaryProviderId = providerId;
    if (fromDate || toDate) planFilter.createdAt = dateFilter;

    // Get all treatment plans for analysis
    const treatmentPlans = await db.treatmentPlan.findMany({
      where: planFilter,
      select: {
        id: true,
        status: true,
        estimatedDuration: true,
        startDate: true,
        estimatedEndDate: true,
        actualEndDate: true,
        totalFee: true,
        createdAt: true,
        primaryProviderId: true,
      },
    });

    // Calculate duration analytics
    const completedPlans = treatmentPlans.filter((p) => p.status === 'COMPLETED' && p.actualEndDate && p.startDate);
    const durations = completedPlans.map((p) => {
      const start = new Date(p.startDate!);
      const end = new Date(p.actualEndDate!);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)); // months
    });

    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : null;
    const minDuration = durations.length > 0 ? Math.min(...durations) : null;
    const maxDuration = durations.length > 0 ? Math.max(...durations) : null;

    // Calculate accuracy (actual vs estimated)
    const accuracyData = completedPlans
      .filter((p) => p.estimatedDuration && p.startDate && p.actualEndDate)
      .map((p) => {
        const actualMonths = Math.ceil(
          (new Date(p.actualEndDate!).getTime() - new Date(p.startDate!).getTime()) /
            (1000 * 60 * 60 * 24 * 30)
        );
        const variance = actualMonths - (p.estimatedDuration || 0);
        return {
          estimated: p.estimatedDuration || 0,
          actual: actualMonths,
          variance,
          accuracyPercent: p.estimatedDuration ? Math.round((1 - Math.abs(variance) / p.estimatedDuration) * 100) : 0,
        };
      });

    const avgAccuracy =
      accuracyData.length > 0 ? Math.round(accuracyData.reduce((a, b) => a + b.accuracyPercent, 0) / accuracyData.length) : null;

    // Status distribution
    const statusCounts = treatmentPlans.reduce(
      (acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    // Revenue analytics
    const totalRevenue = treatmentPlans.reduce((sum, p) => sum + Number(p.totalFee || 0), 0);
    const completedRevenue = completedPlans.reduce((sum, p) => sum + Number(p.totalFee || 0), 0);
    const avgFee = treatmentPlans.length > 0 ? Math.round(totalRevenue / treatmentPlans.length) : 0;

    // Progress distribution for active plans (based on timeline progress)
    const activePlans = treatmentPlans.filter((p) => p.status === 'ACTIVE');
    const getTimelineProgress = (plan: typeof activePlans[0]) => {
      if (!plan.startDate || !plan.estimatedEndDate) return 0;
      const start = new Date(plan.startDate).getTime();
      const end = new Date(plan.estimatedEndDate).getTime();
      const now = Date.now();
      const total = end - start;
      const elapsed = now - start;
      return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    };
    const progressBuckets = {
      '0-25': activePlans.filter((p) => getTimelineProgress(p) <= 25).length,
      '26-50': activePlans.filter((p) => getTimelineProgress(p) > 25 && getTimelineProgress(p) <= 50).length,
      '51-75': activePlans.filter((p) => getTimelineProgress(p) > 50 && getTimelineProgress(p) <= 75).length,
      '76-100': activePlans.filter((p) => getTimelineProgress(p) > 75).length,
    };

    // Overdue plans
    const today = new Date();
    const overduePlans = activePlans.filter(
      (p) => p.estimatedEndDate && new Date(p.estimatedEndDate) < today
    );

    // Monthly trends (last 12 months)
    const monthlyTrends = getMonthlyTrends(treatmentPlans);

    // Provider performance (if no specific provider filter)
    let providerStats: Record<string, unknown>[] = [];
    if (!providerId) {
      const providerGroups = treatmentPlans.reduce(
        (acc, p) => {
          if (p.primaryProviderId) {
            if (!acc[p.primaryProviderId]) {
              acc[p.primaryProviderId] = { total: 0, completed: 0, revenue: 0 };
            }
            acc[p.primaryProviderId].total++;
            if (p.status === 'COMPLETED') acc[p.primaryProviderId].completed++;
            acc[p.primaryProviderId].revenue += Number(p.totalFee || 0);
          }
          return acc;
        },
        {} as Record<string, { total: number; completed: number; revenue: number }>
      );

      // Fetch provider names
      const providerIds = Object.keys(providerGroups);
      if (providerIds.length > 0) {
        const providers = await db.staffProfile.findMany({
          where: withSoftDelete({
            id: { in: providerIds },
          }),
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        });

        providerStats = providers.map((provider) => ({
          providerId: provider.id,
          providerName: `${provider.firstName} ${provider.lastName}`,
          totalPlans: providerGroups[provider.id]?.total || 0,
          completedPlans: providerGroups[provider.id]?.completed || 0,
          completionRate:
            providerGroups[provider.id]?.total > 0
              ? Math.round((providerGroups[provider.id].completed / providerGroups[provider.id].total) * 100)
              : 0,
          totalRevenue: providerGroups[provider.id]?.revenue || 0,
        }));
      }
    }

    const analytics = {
      summary: {
        totalPlans: treatmentPlans.length,
        activePlans: activePlans.length,
        completedPlans: completedPlans.length,
        overduePlans: overduePlans.length,
        completionRate:
          treatmentPlans.length > 0
            ? Math.round((completedPlans.length / treatmentPlans.length) * 100)
            : 0,
      },
      duration: {
        averageMonths: avgDuration ? Math.round(avgDuration * 10) / 10 : null,
        minMonths: minDuration,
        maxMonths: maxDuration,
        estimationAccuracy: avgAccuracy,
      },
      distribution: {
        byStatus: statusCounts,
        byProgress: progressBuckets,
      },
      revenue: {
        total: totalRevenue,
        fromCompleted: completedRevenue,
        averagePerPlan: avgFee,
      },
      trends: monthlyTrends,
      providerPerformance: providerStats,
    };

    return NextResponse.json({ success: true, data: analytics });
  },
  { permissions: ['treatment:read'] }
);

/**
 * Calculate monthly trends for the last 12 months
 */
function getMonthlyTrends(
  plans: {
    createdAt: Date;
    status: string;
    actualEndDate: Date | null;
  }[]
): { month: string; started: number; completed: number }[] {
  const months: { month: string; started: number; completed: number }[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
    const monthLabel = monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const started = plans.filter((p) => {
      const created = new Date(p.createdAt);
      return created >= monthStart && created <= monthEnd;
    }).length;

    const completed = plans.filter((p) => {
      if (!p.actualEndDate || p.status !== 'COMPLETED') return false;
      const ended = new Date(p.actualEndDate);
      return ended >= monthStart && ended <= monthEnd;
    }).length;

    months.push({ month: monthLabel, started, completed });
  }

  return months;
}
