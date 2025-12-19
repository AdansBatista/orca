import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createTaskSchema, taskQuerySchema } from '@/lib/validations/ops';

/**
 * GET /api/ops/tasks
 * List operations tasks with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query params
    const result = taskQuerySchema.safeParse({
      status: searchParams.get('status') || undefined,
      assigneeId: searchParams.get('assigneeId') || undefined,
      priority: searchParams.get('priority') || undefined,
      dueFrom: searchParams.get('dueFrom') || undefined,
      dueTo: searchParams.get('dueTo') || undefined,
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

    const { status, assigneeId, priority, dueFrom, dueTo, page, pageSize } = result.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    // Handle comma-separated status values
    if (status) {
      const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { in: statuses };
      }
    }

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (priority) {
      where.priority = priority;
    }

    if (dueFrom || dueTo) {
      where.dueAt = {};
      if (dueFrom) {
        (where.dueAt as Record<string, Date>).gte = new Date(dueFrom);
      }
      if (dueTo) {
        (where.dueAt as Record<string, Date>).lte = new Date(dueTo);
      }
    }

    // Count total
    const total = await db.operationsTask.count({ where });

    // Fetch tasks - don't include owner relation to avoid orphan reference errors
    // Owner data was incorrectly stored as User ID instead of StaffProfile ID in some records
    const tasks = await db.operationsTask.findMany({
      where,
      include: {
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first, then IN_PROGRESS, etc.
        { priority: 'desc' }, // URGENT first
        { dueAt: 'asc' }, // Soonest due first
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: tasks,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['ops:read'] }
);

/**
 * POST /api/ops/tasks
 * Create a new operations task
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = createTaskSchema.safeParse(body);
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

    const data = result.data;
    const clinicId = session.user.clinicId;

    // Find the StaffProfile for the current user
    const staffProfile = await db.staffProfile.findFirst({
      where: {
        userId: session.user.id,
        clinicId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_STAFF_PROFILE',
            message: 'No staff profile found for current user. Please contact an administrator.',
          },
        },
        { status: 400 }
      );
    }

    // Create task
    const task = await db.operationsTask.create({
      data: {
        clinicId,
        title: data.title,
        description: data.description,
        type: data.type,
        assigneeId: data.assigneeId,
        ownerId: staffProfile.id,
        dueAt: data.dueAt ? new Date(data.dueAt) : undefined,
        priority: data.priority,
        relatedType: data.relatedType,
        relatedId: data.relatedId,
        createdBy: session.user.id,
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

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'OperationsTask',
      entityId: task.id,
      details: {
        title: task.title,
        type: task.type,
        priority: task.priority,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: task,
    });
  },
  { permissions: ['ops:create'] }
);
