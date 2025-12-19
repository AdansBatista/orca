/**
 * Communications Status API
 *
 * GET /api/communications/status
 *
 * Returns the status of all messaging providers and delivery statistics.
 */

import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { getMessagingService } from '@/lib/services/messaging';

/**
 * GET /api/communications/status
 * Get messaging provider status and statistics
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const messagingService = getMessagingService();

    // Get provider status
    const providerStatus = await messagingService.getProviderStatus();

    // Get delivery statistics for the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const clinicFilter = getClinicFilter(session);

    // Get message counts by status
    const [
      totalMessages,
      sentMessages,
      deliveredMessages,
      failedMessages,
      scheduledMessages,
    ] = await Promise.all([
      db.message.count({
        where: {
          ...clinicFilter,
          createdAt: { gte: oneDayAgo },
        },
      }),
      db.message.count({
        where: {
          ...clinicFilter,
          status: 'SENT',
          createdAt: { gte: oneDayAgo },
        },
      }),
      db.message.count({
        where: {
          ...clinicFilter,
          status: 'DELIVERED',
          createdAt: { gte: oneDayAgo },
        },
      }),
      db.message.count({
        where: {
          ...clinicFilter,
          status: 'FAILED',
          createdAt: { gte: oneDayAgo },
        },
      }),
      db.message.count({
        where: {
          ...clinicFilter,
          status: 'SCHEDULED',
        },
      }),
    ]);

    // Get delivery stats by channel
    const channelStats = await db.message.groupBy({
      by: ['channel'],
      where: {
        ...clinicFilter,
        createdAt: { gte: oneDayAgo },
      },
      _count: {
        id: true,
      },
    });

    // Get delivery status breakdown
    const deliveryStats = await db.messageDelivery.groupBy({
      by: ['status'],
      where: {
        message: clinicFilter,
        createdAt: { gte: oneDayAgo },
      },
      _count: {
        id: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        providers: providerStatus,
        statistics: {
          period: '24h',
          messages: {
            total: totalMessages,
            sent: sentMessages,
            delivered: deliveredMessages,
            failed: failedMessages,
            scheduled: scheduledMessages,
          },
          byChannel: channelStats.reduce(
            (acc, stat) => {
              acc[stat.channel] = stat._count.id;
              return acc;
            },
            {} as Record<string, number>
          ),
          deliveryStatus: deliveryStats.reduce(
            (acc, stat) => {
              acc[stat.status] = stat._count.id;
              return acc;
            },
            {} as Record<string, number>
          ),
        },
      },
    });
  },
  { permissions: ['comms:view_inbox'] }
);
