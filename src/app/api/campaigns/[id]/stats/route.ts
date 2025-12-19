import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/campaigns/[id]/stats
 *
 * Get detailed statistics for a campaign.
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    // Get campaign
    const campaign = await db.campaign.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        status: true,
        totalRecipients: true,
        totalSent: true,
        totalDelivered: true,
        totalOpened: true,
        totalClicked: true,
        totalFailed: true,
        activatedAt: true,
        completedAt: true,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CAMPAIGN_NOT_FOUND',
            message: 'Campaign not found',
          },
        },
        { status: 404 }
      );
    }

    // Get detailed send statistics
    const sendStats = await db.campaignSend.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: { id: true },
    });

    const sendsByStatus = sendStats.reduce(
      (acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      },
      {} as Record<string, number>
    );

    // Get sends by step
    const stepStats = await db.campaignSend.groupBy({
      by: ['stepId', 'status'],
      where: { campaignId: id },
      _count: { id: true },
    });

    // Get step names
    const steps = await db.campaignStep.findMany({
      where: { campaignId: id },
      select: { id: true, name: true, stepOrder: true, type: true },
      orderBy: { stepOrder: 'asc' },
    });

    const stepStatsMap = steps.map((step) => {
      const stats = stepStats.filter((s) => s.stepId === step.id);
      return {
        stepId: step.id,
        name: step.name,
        order: step.stepOrder,
        type: step.type,
        stats: stats.reduce(
          (acc, stat) => {
            acc[stat.status] = stat._count.id;
            return acc;
          },
          {} as Record<string, number>
        ),
      };
    });

    // Get recent activity (last 10 sends)
    const recentActivity = await db.campaignSend.findMany({
      where: { campaignId: id },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        scheduledAt: true,
        sentAt: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        step: {
          select: {
            name: true,
          },
        },
      },
    });

    // Calculate rates
    const deliveryRate =
      campaign.totalSent > 0
        ? Math.round((campaign.totalDelivered / campaign.totalSent) * 100)
        : 0;
    const openRate =
      campaign.totalDelivered > 0
        ? Math.round((campaign.totalOpened / campaign.totalDelivered) * 100)
        : 0;
    const clickRate =
      campaign.totalOpened > 0
        ? Math.round((campaign.totalClicked / campaign.totalOpened) * 100)
        : 0;
    const failureRate =
      campaign.totalSent > 0
        ? Math.round((campaign.totalFailed / campaign.totalSent) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        campaign: {
          id: campaign.id,
          name: campaign.name,
          status: campaign.status,
        },
        totals: {
          recipients: campaign.totalRecipients,
          sent: campaign.totalSent,
          delivered: campaign.totalDelivered,
          opened: campaign.totalOpened,
          clicked: campaign.totalClicked,
          failed: campaign.totalFailed,
        },
        rates: {
          delivery: deliveryRate,
          open: openRate,
          click: clickRate,
          failure: failureRate,
        },
        sendsByStatus,
        stepStats: stepStatsMap,
        recentActivity,
        timeline: {
          activatedAt: campaign.activatedAt,
          completedAt: campaign.completedAt,
        },
      },
    });
  },
  { permissions: ['comms:view_inbox'] }
);
