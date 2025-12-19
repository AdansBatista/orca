import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { createLeadTaskSchema } from '@/lib/validations/leads';

/**
 * GET /api/leads/[id]/tasks
 * Get tasks for a lead
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status') || undefined;

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

    const where: Record<string, unknown> = { leadId: id };
    if (status) where.status = status;

    const tasks = await db.leadTask.findMany({
      where,
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { dueDate: 'asc' }],
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
        completedBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: tasks });
  },
  { permissions: ['leads:view', 'leads:edit', 'leads:full'] }
);

/**
 * POST /api/leads/[id]/tasks
 * Create a new task for a lead
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createLeadTaskSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid task data',
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

    // Create the task
    const task = await db.leadTask.create({
      data: {
        clinicId: session.user.clinicId,
        leadId: id,
        ...data,
      },
      include: {
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Log activity
    await db.leadActivity.create({
      data: {
        clinicId: session.user.clinicId,
        leadId: id,
        type: 'SYSTEM',
        title: `Task created: ${task.title}`,
        metadata: { taskId: task.id },
        performedById: session.user.id,
      },
    });

    return NextResponse.json({ success: true, data: task }, { status: 201 });
  },
  { permissions: ['leads:edit', 'leads:full'] }
);
