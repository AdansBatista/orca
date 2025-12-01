import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createPerformanceMetricSchema,
  performanceMetricQuerySchema,
} from '@/lib/validations/performance';

/**
 * GET /api/staff/performance-metrics
 * List performance metrics with filtering
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);
    const clinicFilter = getClinicFilter(session);

    // Parse query parameters
    const rawParams = {
      staffProfileId: searchParams.get('staffProfileId') ?? undefined,
      metricType: searchParams.get('metricType') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = performanceMetricQuerySchema.safeParse(rawParams);

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

    const { staffProfileId, metricType, startDate, endDate, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...clinicFilter,
    };

    if (staffProfileId) {
      where.staffProfileId = staffProfileId;
    }

    if (metricType) {
      where.metricType = metricType;
    }

    if (startDate || endDate) {
      where.periodStart = {};
      if (startDate) {
        (where.periodStart as Record<string, Date>).gte = startDate;
      }
      if (endDate) {
        (where.periodStart as Record<string, Date>).lte = endDate;
      }
    }

    // Get total count
    const total = await db.performanceMetric.count({ where });

    // Get paginated results
    const items = await db.performanceMetric.findMany({
      where,
      orderBy: { periodStart: 'desc' },
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

    // Get distinct metric types for filtering
    const metricTypes = await db.performanceMetric.findMany({
      where: clinicFilter,
      select: { metricType: true },
      distinct: ['metricType'],
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        metricTypes: metricTypes.map((m) => m.metricType),
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
 * POST /api/staff/performance-metrics
 * Create a new performance metric
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);

    // Validate input
    const result = createPerformanceMetricSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid metric data',
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

    // Calculate if target was met
    const targetMet = data.targetValue !== null && data.targetValue !== undefined
      ? data.value >= data.targetValue
      : null;

    // Create the metric
    const metric = await db.performanceMetric.create({
      data: {
        ...data,
        targetMet,
        clinicId: session.user.clinicId,
        createdBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'PerformanceMetric',
      entityId: metric.id,
      details: {
        staffProfileId: data.staffProfileId,
        metricType: data.metricType,
        metricName: data.metricName,
        value: data.value,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: metric }, { status: 201 });
  },
  { permissions: ['staff:write', 'staff:admin'] }
);
