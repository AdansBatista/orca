import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

/**
 * POST /api/campaigns/[id]/pause
 * Pause an active campaign
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    // Find the campaign
    const campaign = await db.campaign.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Campaign not found',
          },
        },
        { status: 404 }
      );
    }

    // Can only pause active or scheduled campaigns
    if (!['ACTIVE', 'SCHEDULED'].includes(campaign.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot pause a campaign with status: ${campaign.status}`,
          },
        },
        { status: 400 }
      );
    }

    // Pause the campaign
    const updated = await db.campaign.update({
      where: { id },
      data: {
        status: 'PAUSED',
        pausedAt: new Date(),
      },
    });

    // Cancel any pending sends
    await db.campaignSend.updateMany({
      where: {
        campaignId: id,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Campaign',
      entityId: id,
      details: {
        action: 'paused',
        previousStatus: campaign.status,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  },
  { permissions: ['campaigns:activate'] }
);
