import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { createLeadActivitySchema } from '@/lib/validations/leads';

/**
 * GET /api/leads/[id]/activities
 * Get activities for a lead
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    // Verify lead exists and belongs to clinic
    const lead = await db.lead.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      select: { id: true },
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Lead not found',
          },
        },
        { status: 404 }
      );
    }

    const total = await db.leadActivity.count({
      where: { leadId: id },
    });

    const activities = await db.leadActivity.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        performedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: activities,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['leads:view', 'leads:edit', 'leads:full'] }
);

/**
 * POST /api/leads/[id]/activities
 * Log a new activity for a lead
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createLeadActivitySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid activity data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify lead exists and belongs to clinic
    const lead = await db.lead.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      select: { id: true },
    });

    if (!lead) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Lead not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Create the activity
    const activity = await db.leadActivity.create({
      data: {
        clinicId: session.user.clinicId,
        leadId: id,
        type: data.type,
        title: data.title,
        description: data.description,
        metadata: data.metadata as Prisma.InputJsonValue,
        performedById: session.user.id,
      },
      include: {
        performedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Update lead's updatedAt
    await db.lead.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, data: activity }, { status: 201 });
  },
  { permissions: ['leads:edit', 'leads:full'] }
);
