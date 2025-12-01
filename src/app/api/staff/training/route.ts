import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createTrainingRecordSchema,
  trainingRecordQuerySchema,
} from '@/lib/validations/performance';

/**
 * GET /api/staff/training
 * List training records with filtering
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);
    const clinicFilter = getClinicFilter(session);

    // Parse query parameters
    const rawParams = {
      staffProfileId: searchParams.get('staffProfileId') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      overdue: searchParams.get('overdue') ?? undefined,
      expiringSoon: searchParams.get('expiringSoon') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = trainingRecordQuerySchema.safeParse(rawParams);

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

    const { staffProfileId, category, status, overdue, expiringSoon, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...clinicFilter,
    };

    if (staffProfileId) {
      where.staffProfileId = staffProfileId;
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    const now = new Date();
    if (overdue) {
      where.dueDate = { lt: now };
      where.status = { notIn: ['COMPLETED', 'WAIVED'] };
    }

    if (expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.expirationDate = {
        gte: now,
        lte: thirtyDaysFromNow,
      };
    }

    // Get total count
    const total = await db.trainingRecord.count({ where });

    // Get paginated results
    const items = await db.trainingRecord.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
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
    const categories = await db.trainingRecord.findMany({
      where: clinicFilter,
      select: { category: true },
      distinct: ['category'],
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        categories: categories.map((c) => c.category),
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
 * POST /api/staff/training
 * Create a new training record
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);

    // Validate input
    const result = createTrainingRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid training data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify staff profile exists and belongs to clinic
    const staffProfile = await db.staffProfile.findFirst({
      where: {
        id: data.staffProfileId,
        ...clinicFilter,
        deletedAt: null,
      },
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

    // Create the training record
    const training = await db.trainingRecord.create({
      data: {
        staffProfileId: data.staffProfileId,
        name: data.name,
        description: data.description,
        category: data.category,
        provider: data.provider,
        durationHours: data.durationHours,
        credits: data.credits,
        assignedDate: data.assignedDate ?? new Date(),
        dueDate: data.dueDate,
        expirationDate: data.expirationDate,
        notes: data.notes,
        status: 'ASSIGNED',
        clinicId: session.user.clinicId,
        createdBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'TrainingRecord',
      entityId: training.id,
      details: {
        staffProfileId: data.staffProfileId,
        name: data.name,
        category: data.category,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: training }, { status: 201 });
  },
  { permissions: ['staff:write', 'staff:admin'] }
);
