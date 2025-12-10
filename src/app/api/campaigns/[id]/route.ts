import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateCampaignSchema, addStepSchema } from '@/lib/validations/campaigns';

/**
 * GET /api/campaigns/[id]
 * Get a single campaign with all details
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: {
            template: {
              select: { id: true, name: true, category: true },
            },
          },
        },
        _count: {
          select: { sends: true },
        },
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

    // Get send statistics
    const sendStats = await db.campaignSend.groupBy({
      by: ['status'],
      where: { campaignId: id },
      _count: true,
    });

    const stats = {
      total: campaign._count.sends,
      byStatus: Object.fromEntries(sendStats.map((s) => [s.status, s._count])),
    };

    return NextResponse.json({
      success: true,
      data: {
        ...campaign,
        sendStats: stats,
        _count: undefined,
      },
    });
  },
  { permissions: ['campaigns:view'] }
);

/**
 * PUT /api/campaigns/[id]
 * Update a campaign (only if in DRAFT or PAUSED status)
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = updateCampaignSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid campaign data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Find the campaign
    const existing = await db.campaign.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existing) {
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

    // Only allow updates if in DRAFT or PAUSED status
    if (!['DRAFT', 'PAUSED'].includes(existing.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Cannot update an active or completed campaign',
          },
        },
        { status: 400 }
      );
    }

    // Update the campaign
    const campaign = await db.campaign.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        type: data.type,
        triggerType: data.triggerType,
        triggerEvent: data.triggerEvent,
        triggerSchedule: data.triggerSchedule ? new Date(data.triggerSchedule) : undefined,
        triggerRecurrence: data.triggerRecurrence as Prisma.InputJsonValue,
        audience: data.audience as Prisma.InputJsonValue,
        excludeCriteria: data.excludeCriteria as Prisma.InputJsonValue,
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
      entityId: campaign.id,
      details: {
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: campaign,
    });
  },
  { permissions: ['campaigns:update'] }
);

/**
 * DELETE /api/campaigns/[id]
 * Soft delete a campaign
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    // Find the campaign
    const existing = await db.campaign.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existing) {
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

    // Cannot delete active campaigns
    if (existing.status === 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Cannot delete an active campaign. Pause it first.',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete
    await db.campaign.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'Campaign',
      entityId: id,
      details: {
        name: existing.name,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  },
  { permissions: ['campaigns:delete'] }
);

/**
 * POST /api/campaigns/[id] (with action in body)
 * Add a step to the campaign
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate step input
    const result = addStepSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid step data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Find the campaign
    const campaign = await db.campaign.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'desc' },
          take: 1,
        },
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

    // Only allow step changes in DRAFT status
    if (campaign.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Cannot add steps to a non-draft campaign',
          },
        },
        { status: 400 }
      );
    }

    // Get next step order
    const nextOrder = campaign.steps.length > 0 ? campaign.steps[0].stepOrder + 1 : 1;

    // Create the step
    const step = await db.campaignStep.create({
      data: {
        campaignId: id,
        stepOrder: nextOrder,
        name: data.name,
        type: data.type,
        channel: data.channel,
        templateId: data.templateId,
        waitDuration: data.waitDuration,
        waitUntil: data.waitUntil,
        condition: data.condition as Prisma.InputJsonValue,
        branches: data.branches as Prisma.InputJsonValue,
      },
      include: {
        template: {
          select: { id: true, name: true },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'CampaignStep',
      entityId: step.id,
      details: {
        campaignId: id,
        stepType: step.type,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: step,
      },
      { status: 201 }
    );
  },
  { permissions: ['campaigns:update'] }
);
