import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { z } from 'zod';

const stepConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'contains', 'exists']),
  value: z.unknown(),
});

const branchSchema = z.object({
  condition: stepConditionSchema,
  nextStepId: z.string(),
});

const createStepSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['SEND', 'WAIT', 'CONDITION', 'BRANCH']),
  // For SEND steps
  channel: z.enum(['SMS', 'EMAIL', 'PUSH', 'IN_APP']).optional(),
  templateId: z.string().optional(),
  // For WAIT steps
  waitDuration: z.number().int().positive().optional(), // Minutes
  waitUntil: z.string().optional(), // Dynamic expression
  // For CONDITION/BRANCH steps
  condition: stepConditionSchema.optional(),
  branches: z.array(branchSchema).optional(),
  // Navigation
  nextStepId: z.string().optional(),
});

const updateStepSchema = createStepSchema.partial();

const reorderStepsSchema = z.object({
  stepIds: z.array(z.string()),
});

/**
 * GET /api/campaigns/[id]/steps
 *
 * Get all steps for a campaign.
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    // Verify campaign exists and belongs to clinic
    const campaign = await db.campaign.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      select: { id: true, status: true },
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

    const steps = await db.campaignStep.findMany({
      where: { campaignId: id },
      orderBy: { stepOrder: 'asc' },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        campaignId: id,
        status: campaign.status,
        steps,
      },
    });
  },
  { permissions: ['comms:view_inbox'] }
);

/**
 * POST /api/campaigns/[id]/steps
 *
 * Add a new step to a campaign.
 * Only works for campaigns in DRAFT status.
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = createStepSchema.safeParse(body);
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

    // Verify campaign exists and is in DRAFT status
    const campaign = await db.campaign.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      select: { id: true, status: true },
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

    if (campaign.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CAMPAIGN_NOT_DRAFT',
            message: 'Can only add steps to draft campaigns',
          },
        },
        { status: 400 }
      );
    }

    // Validate SEND step requirements
    if (data.type === 'SEND') {
      if (!data.channel) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_CHANNEL',
              message: 'SEND steps require a channel',
            },
          },
          { status: 400 }
        );
      }
      if (!data.templateId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_TEMPLATE',
              message: 'SEND steps require a template',
            },
          },
          { status: 400 }
        );
      }

      // Verify template exists
      const template = await db.messageTemplate.findFirst({
        where: {
          id: data.templateId,
          ...getClinicFilter(session),
        },
      });

      if (!template) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TEMPLATE_NOT_FOUND',
              message: 'Template not found',
            },
          },
          { status: 400 }
        );
      }
    }

    // Validate WAIT step requirements
    if (data.type === 'WAIT') {
      if (!data.waitDuration && !data.waitUntil) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_WAIT_CONFIG',
              message: 'WAIT steps require either waitDuration or waitUntil',
            },
          },
          { status: 400 }
        );
      }
    }

    // Get current max step order
    const maxStep = await db.campaignStep.findFirst({
      where: { campaignId: id },
      orderBy: { stepOrder: 'desc' },
      select: { stepOrder: true },
    });

    const stepOrder = (maxStep?.stepOrder ?? 0) + 1;

    // Create the step
    const step = await db.campaignStep.create({
      data: {
        campaignId: id,
        stepOrder,
        name: data.name,
        type: data.type,
        channel: data.channel,
        templateId: data.templateId,
        waitDuration: data.waitDuration,
        waitUntil: data.waitUntil,
        condition: data.condition ? JSON.parse(JSON.stringify(data.condition)) : undefined,
        branches: data.branches ? JSON.parse(JSON.stringify(data.branches)) : undefined,
        nextStepId: data.nextStepId,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
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
        stepType: data.type,
        stepOrder,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: step,
    });
  },
  { permissions: ['comms:manage_campaigns'] }
);

/**
 * PUT /api/campaigns/[id]/steps
 *
 * Reorder steps in a campaign.
 * Only works for campaigns in DRAFT status.
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = reorderStepsSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid reorder data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { stepIds } = result.data;

    // Verify campaign exists and is in DRAFT status
    const campaign = await db.campaign.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      select: { id: true, status: true },
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

    if (campaign.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CAMPAIGN_NOT_DRAFT',
            message: 'Can only reorder steps in draft campaigns',
          },
        },
        { status: 400 }
      );
    }

    // Update step orders
    await db.$transaction(
      stepIds.map((stepId, index) =>
        db.campaignStep.update({
          where: { id: stepId },
          data: { stepOrder: index + 1 },
        })
      )
    );

    // Get updated steps
    const steps = await db.campaignStep.findMany({
      where: { campaignId: id },
      orderBy: { stepOrder: 'asc' },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'CampaignStep',
      entityId: id,
      details: {
        action: 'reorder',
        newOrder: stepIds,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: steps,
    });
  },
  { permissions: ['comms:manage_campaigns'] }
);
