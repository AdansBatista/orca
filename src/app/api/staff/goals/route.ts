import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete } from '@/lib/db/soft-delete';
import {
  createStaffGoalSchema,
  staffGoalQuerySchema,
} from '@/lib/validations/performance';

/**
 * GET /api/staff/goals
 * List staff goals with filtering
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);
    const clinicFilter = getClinicFilter(session);

    // Parse query parameters
    const rawParams = {
      staffProfileId: searchParams.get('staffProfileId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = staffGoalQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { staffProfileId, status, category, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...clinicFilter,
    };

    if (staffProfileId) {
      where.staffProfileId = staffProfileId;
    }

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    // Get total count
    const total = await db.staffGoal.count({ where });

    // Get paginated results
    const items = await db.staffGoal.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { targetDate: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        staffProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get distinct categories for filtering
    const categories = await db.staffGoal.findMany({
      where: { ...clinicFilter, category: { not: null } },
      select: { category: true },
      distinct: ['category'],
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        categories: categories.map((c) => c.category).filter(Boolean),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['staff:read', 'staff:write', 'staff:admin'] }
);

/**
 * POST /api/staff/goals
 * Create a new staff goal
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);

    // Validate input
    const result = createStaffGoalSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid goal data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify staff profile exists and belongs to clinic
    const staffProfile = await db.staffProfile.findFirst({
      where: withSoftDelete({
        id: data.staffProfileId,
        ...clinicFilter,
      }),
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Staff profile not found',
          },
        },
        { status: 404 }
      );
    }

    // Create the goal
    const goal = await db.staffGoal.create({
      data: {
        staffProfileId: data.staffProfileId,
        title: data.title,
        description: data.description,
        category: data.category,
        startDate: data.startDate,
        targetDate: data.targetDate,
        priority: data.priority,
        milestones: data.milestones ?? [],
        notes: data.notes,
        status: 'NOT_STARTED',
        progress: 0,
        clinicId: session.user.clinicId,
        createdBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'StaffGoal',
      entityId: goal.id,
      details: {
        staffProfileId: data.staffProfileId,
        title: data.title,
        category: data.category,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: goal }, { status: 201 });
  },
  { permissions: ['staff:write', 'staff:admin'] }
);
