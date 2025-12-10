import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/leads/analytics
 * Get lead analytics and conversion metrics
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Date range (default to last 30 days)
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const baseWhere = withSoftDelete(getClinicFilter(session));

    // Total leads in period
    const totalLeads = await db.lead.count({
      where: {
        ...baseWhere,
        createdAt: { gte: startDate },
      },
    });

    // Leads by source
    const leadsBySource = await db.lead.groupBy({
      by: ['source'],
      where: {
        ...baseWhere,
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Leads by status
    const leadsByStatus = await db.lead.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: true,
    });

    // Conversions in period
    const conversions = await db.lead.count({
      where: {
        ...getClinicFilter(session),
        status: 'CONVERTED',
        convertedAt: { gte: startDate },
      },
    });

    // Lost leads in period
    const lostLeads = await db.lead.count({
      where: {
        ...baseWhere,
        status: 'LOST',
        lostDate: { gte: startDate },
      },
    });

    // Average time to conversion (for converted leads in period)
    const convertedLeads = await db.lead.findMany({
      where: {
        ...getClinicFilter(session),
        status: 'CONVERTED',
        convertedAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        convertedAt: true,
      },
    });

    const avgConversionDays =
      convertedLeads.length > 0
        ? Math.round(
            convertedLeads.reduce((sum, lead) => {
              if (!lead.convertedAt) return sum;
              const days = Math.ceil(
                (lead.convertedAt.getTime() - lead.createdAt.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              return sum + days;
            }, 0) / convertedLeads.length
          )
        : 0;

    // Leads by stage (current snapshot)
    const leadsByStage = await db.lead.groupBy({
      by: ['stage'],
      where: {
        ...baseWhere,
        status: { in: ['NEW', 'IN_PROGRESS'] },
      },
      _count: true,
    });

    // Top referring providers
    const topReferrers = await db.referringProvider.findMany({
      where: {
        ...getClinicFilter(session),
        totalReferrals: { gt: 0 },
      },
      orderBy: { totalReferrals: 'desc' },
      take: 5,
      select: {
        id: true,
        practiceName: true,
        firstName: true,
        lastName: true,
        totalReferrals: true,
        referralsThisYear: true,
      },
    });

    // Recent activity (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentActivity = await db.leadActivity.count({
      where: {
        clinicId: session.user.clinicId,
        createdAt: { gte: weekAgo },
      },
    });

    // Pending tasks
    const pendingTasks = await db.leadTask.count({
      where: {
        clinicId: session.user.clinicId,
        status: 'PENDING',
      },
    });

    // Overdue tasks
    const overdueTasks = await db.leadTask.count({
      where: {
        clinicId: session.user.clinicId,
        status: 'PENDING',
        dueDate: { lt: new Date() },
      },
    });

    // Calculate conversion rate
    const conversionRate =
      totalLeads > 0 ? Math.round((conversions / totalLeads) * 100) : 0;

    // Calculate loss rate
    const lossRate =
      totalLeads > 0 ? Math.round((lostLeads / totalLeads) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        period: {
          days,
          startDate,
          endDate: new Date(),
        },
        summary: {
          totalLeads,
          conversions,
          lostLeads,
          conversionRate,
          lossRate,
          avgConversionDays,
          recentActivity,
          pendingTasks,
          overdueTasks,
        },
        bySource: leadsBySource.map((item) => ({
          source: item.source,
          count: item._count,
        })),
        byStatus: leadsByStatus.map((item) => ({
          status: item.status,
          count: item._count,
        })),
        byStage: leadsByStage.map((item) => ({
          stage: item.stage,
          count: item._count,
        })),
        topReferrers,
      },
    });
  },
  { permissions: ['leads:view', 'leads:edit', 'leads:full'] }
);
