import { NextResponse } from 'next/server';

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

const updateStepSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['SEND', 'WAIT', 'CONDITION', 'BRANCH']).optional(),
  channel: z.enum(['SMS', 'EMAIL', 'PUSH', 'IN_APP']).optional().nullable(),
  templateId: z.string().optional().nullable(),
  waitDuration: z.number().int().positive().optional().nullable(),
  waitUntil: z.string().optional().nullable(),
  condition: stepConditionSchema.optional().nullable(),
  branches: z.array(branchSchema).optional().nullable(),
  nextStepId: z.string().optional().nullable(),
});

/**
 * GET /api/campaigns/[id]/steps/[stepId]
 *
 * Get a single step.
 */
export const GET = withAuth<{ id: string; stepId: string }>(
  async (req, session, { params }) => {
    const { id, stepId } = await params;

    // Verify campaign exists
    const campaign = await db.campaign.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      select: { id: true },
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

    const step = await db.campaignStep.findFirst({
      where: {
        id: stepId,
        campaignId: id,
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            category: true,
            smsBody: true,
            emailSubject: true,
            emailBody: true,
          },
        },
      },
    });

    if (!step) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STEP_NOT_FOUND',
            message: 'Step not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: step,
    });
  },
  { permissions: ['comms:view_inbox'] }
);

/**
 * PUT /api/campaigns/[id]/steps/[stepId]
 *
 * Update a step.
 * Only works for campaigns in DRAFT status.
 */
export const PUT = withAuth<{ id: string; stepId: string }>(
  async (req, session, { params }) => {
    const { id, stepId } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = updateStepSchema.safeParse(body);
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
            message: 'Can only update steps in draft campaigns',
          },
        },
        { status: 400 }
      );
    }

    // Verify step exists
    const existingStep = await db.campaignStep.findFirst({
      where: {
        id: stepId,
        campaignId: id,
      },
    });

    if (!existingStep) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STEP_NOT_FOUND',
            message: 'Step not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate template if changing to SEND type or updating template
    const newType = data.type || existingStep.type;
    const newTemplateId = data.templateId !== undefined ? data.templateId : existingStep.templateId;

    if (newType === 'SEND' && newTemplateId) {
      const template = await db.messageTemplate.findFirst({
        where: {
          id: newTemplateId,
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

    // Build update data
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.channel !== undefined) updateData.channel = data.channel;
    if (data.templateId !== undefined) updateData.templateId = data.templateId;
    if (data.waitDuration !== undefined) updateData.waitDuration = data.waitDuration;
    if (data.waitUntil !== undefined) updateData.waitUntil = data.waitUntil;
    if (data.condition !== undefined) {
      updateData.condition = data.condition ? JSON.parse(JSON.stringify(data.condition)) : null;
    }
    if (data.branches !== undefined) {
      updateData.branches = data.branches ? JSON.parse(JSON.stringify(data.branches)) : null;
    }
    if (data.nextStepId !== undefined) updateData.nextStepId = data.nextStepId;

    // Update the step
    const step = await db.campaignStep.update({
      where: { id: stepId },
      data: updateData,
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
      action: 'UPDATE',
      entity: 'CampaignStep',
      entityId: stepId,
      details: {
        campaignId: id,
        changes: Object.keys(data),
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
 * DELETE /api/campaigns/[id]/steps/[stepId]
 *
 * Delete a step.
 * Only works for campaigns in DRAFT status.
 */
export const DELETE = withAuth<{ id: string; stepId: string }>(
  async (req, session, { params }) => {
    const { id, stepId } = await params;

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
            message: 'Can only delete steps in draft campaigns',
          },
        },
        { status: 400 }
      );
    }

    // Verify step exists
    const step = await db.campaignStep.findFirst({
      where: {
        id: stepId,
        campaignId: id,
      },
    });

    if (!step) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STEP_NOT_FOUND',
            message: 'Step not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the step
    await db.campaignStep.delete({
      where: { id: stepId },
    });

    // Reorder remaining steps
    const remainingSteps = await db.campaignStep.findMany({
      where: { campaignId: id },
      orderBy: { stepOrder: 'asc' },
    });

    if (remainingSteps.length > 0) {
      await db.$transaction(
        remainingSteps.map((s, index) =>
          db.campaignStep.update({
            where: { id: s.id },
            data: { stepOrder: index + 1 },
          })
        )
      );
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'CampaignStep',
      entityId: stepId,
      details: {
        campaignId: id,
        stepName: step.name,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  },
  { permissions: ['comms:manage_campaigns'] }
);
