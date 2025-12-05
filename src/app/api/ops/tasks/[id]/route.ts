import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateTaskSchema } from '@/lib/validations/ops';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ops/tasks/[id]
 * Get a specific task
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { id } = await params;

    const task = await db.operationsTask.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Task not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: task,
    });
  },
  { permissions: ['ops:read'] }
);

/**
 * PATCH /api/ops/tasks/[id]
 * Update a task
 */
export const PATCH = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = updateTaskSchema.safeParse(body);
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

    // Find the task
    const existingTask = await db.operationsTask.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Task not found',
          },
        },
        { status: 404 }
      );
    }

    const updateData = result.data;
    const now = new Date();

    // If status is being changed to COMPLETED, set completedAt
    if (updateData.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      (updateData as Record<string, unknown>).completedAt = now;
    }
    // If status is being changed from COMPLETED, clear completedAt
    if (updateData.status && updateData.status !== 'COMPLETED' && existingTask.status === 'COMPLETED') {
      (updateData as Record<string, unknown>).completedAt = null;
    }

    // Update the task
    const updatedTask = await db.operationsTask.update({
      where: { id },
      data: updateData,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'OperationsTask',
      entityId: id,
      details: {
        changes: updateData,
        previousStatus: existingTask.status,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedTask,
    });
  },
  { permissions: ['ops:update'] }
);

/**
 * DELETE /api/ops/tasks/[id]
 * Delete a task (hard delete since no deletedAt field)
 */
export const DELETE = withAuth(
  async (req: NextRequest, session: Session, { params }: RouteParams) => {
    const { id } = await params;

    const existingTask = await db.operationsTask.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Task not found',
          },
        },
        { status: 404 }
      );
    }

    // Hard delete (no soft delete fields on this model)
    await db.operationsTask.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'OperationsTask',
      entityId: id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['ops:delete'] }
);
