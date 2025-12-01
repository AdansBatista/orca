import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createPerformanceReviewSchema,
  performanceReviewQuerySchema,
} from '@/lib/validations/performance';

/**
 * GET /api/staff/reviews
 * List performance reviews with filtering
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);
    const clinicFilter = getClinicFilter(session);

    // Parse query parameters
    const rawParams = {
      staffProfileId: searchParams.get('staffProfileId') ?? undefined,
      reviewType: searchParams.get('reviewType') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = performanceReviewQuerySchema.safeParse(rawParams);

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

    const { staffProfileId, reviewType, status, startDate, endDate, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...clinicFilter,
    };

    if (staffProfileId) {
      where.staffProfileId = staffProfileId;
    }

    if (reviewType) {
      where.reviewType = reviewType;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.reviewPeriodStart = {};
      if (startDate) {
        (where.reviewPeriodStart as Record<string, Date>).gte = startDate;
      }
      if (endDate) {
        (where.reviewPeriodStart as Record<string, Date>).lte = endDate;
      }
    }

    // Get total count
    const total = await db.performanceReview.count({ where });

    // Get paginated results
    const items = await db.performanceReview.findMany({
      where,
      orderBy: { reviewPeriodStart: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        staffProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
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
 * POST /api/staff/reviews
 * Create a new performance review
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);

    // Validate input
    const result = createPerformanceReviewSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid review data',
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

    // Create the review
    const review = await db.performanceReview.create({
      data: {
        staffProfileId: data.staffProfileId,
        reviewType: data.reviewType,
        reviewPeriodStart: data.reviewPeriodStart,
        reviewPeriodEnd: data.reviewPeriodEnd,
        reviewDate: data.reviewDate,
        reviewerId: data.reviewerId,
        reviewerName: data.reviewerName,
        status: 'SCHEDULED',
        clinicId: session.user.clinicId,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'PerformanceReview',
      entityId: review.id,
      details: {
        staffProfileId: data.staffProfileId,
        reviewType: data.reviewType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: review }, { status: 201 });
  },
  { permissions: ['staff:write', 'staff:admin'] }
);
