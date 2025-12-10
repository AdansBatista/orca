import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createCampaignSchema, campaignQuerySchema } from '@/lib/validations/campaigns';

/**
 * GET /api/campaigns
 * List all campaigns with filtering and pagination
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query params
    const result = campaignQuerySchema.safeParse({
      type: searchParams.get('type') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      pageSize: searchParams.get('pageSize') || 20,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { type, status, search, page, pageSize } = result.data;
    const skip = (page - 1) * pageSize;

    // Build where clause
    const where: Prisma.CampaignWhereInput = {
      ...getClinicFilter(session),
      deletedAt: null,
    };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch campaigns with step count
    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        include: {
          _count: {
            select: { steps: true, sends: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      db.campaign.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: campaigns.map((campaign) => ({
          ...campaign,
          stepCount: campaign._count.steps,
          sendCount: campaign._count.sends,
          _count: undefined,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['campaigns:view'] }
);

/**
 * POST /api/campaigns
 * Create a new campaign
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = createCampaignSchema.safeParse(body);
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
    const clinicId = session.user.clinicId;

    // Create campaign with steps in a transaction
    const campaign = await db.$transaction(async (tx) => {
      // Create the campaign
      const newCampaign = await tx.campaign.create({
        data: {
          clinicId,
          name: data.name,
          description: data.description,
          type: data.type,
          triggerType: data.triggerType,
          triggerEvent: data.triggerEvent,
          triggerSchedule: data.triggerSchedule ? new Date(data.triggerSchedule) : null,
          triggerRecurrence: data.triggerRecurrence as Prisma.InputJsonValue,
          audience: data.audience as Prisma.InputJsonValue,
          excludeCriteria: data.excludeCriteria as Prisma.InputJsonValue,
          status: 'DRAFT',
          createdBy: session.user.id,
        },
      });

      // Create steps if provided
      if (data.steps && data.steps.length > 0) {
        await tx.campaignStep.createMany({
          data: data.steps.map((step, index) => ({
            campaignId: newCampaign.id,
            stepOrder: index + 1,
            name: step.name,
            type: step.type,
            channel: step.channel,
            templateId: step.templateId,
            waitDuration: step.waitDuration,
            waitUntil: step.waitUntil,
            condition: step.condition as Prisma.InputJsonValue,
            branches: step.branches as Prisma.InputJsonValue,
          })),
        });
      }

      return newCampaign;
    });

    // Fetch the complete campaign with steps
    const fullCampaign = await db.campaign.findUnique({
      where: { id: campaign.id },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
          include: {
            template: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Campaign',
      entityId: campaign.id,
      details: {
        name: campaign.name,
        type: campaign.type,
        triggerType: campaign.triggerType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: fullCampaign,
      },
      { status: 201 }
    );
  },
  { permissions: ['campaigns:create'] }
);
