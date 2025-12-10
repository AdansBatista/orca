import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

/**
 * POST /api/campaigns/[id]/activate
 * Activate a campaign (start sending)
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
      include: {
        steps: true,
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

    // Validate can activate
    if (!['DRAFT', 'PAUSED', 'SCHEDULED'].includes(campaign.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Cannot activate a campaign with status: ${campaign.status}`,
          },
        },
        { status: 400 }
      );
    }

    // Must have at least one step
    if (campaign.steps.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_STEPS',
            message: 'Campaign must have at least one step to activate',
          },
        },
        { status: 400 }
      );
    }

    // Must have at least one SEND step
    const hasSendStep = campaign.steps.some((step) => step.type === 'SEND');
    if (!hasSendStep) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SEND_STEP',
            message: 'Campaign must have at least one SEND step',
          },
        },
        { status: 400 }
      );
    }

    // For scheduled campaigns, check trigger schedule
    if (campaign.triggerType === 'SCHEDULED' && !campaign.triggerSchedule) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SCHEDULE',
            message: 'Scheduled campaigns must have a trigger schedule',
          },
        },
        { status: 400 }
      );
    }

    // For event campaigns, check trigger event
    if (campaign.triggerType === 'EVENT' && !campaign.triggerEvent) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_TRIGGER_EVENT',
            message: 'Event-triggered campaigns must have a trigger event',
          },
        },
        { status: 400 }
      );
    }

    // Activate the campaign
    const updated = await db.campaign.update({
      where: { id },
      data: {
        status: 'ACTIVE',
        activatedAt: new Date(),
        pausedAt: null,
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Campaign',
      entityId: id,
      details: {
        action: 'activated',
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
