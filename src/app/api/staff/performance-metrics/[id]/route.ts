import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updatePerformanceMetricSchema } from '@/lib/validations/performance';

/**
 * GET /api/staff/performance-metrics/[id]
 * Get a single performance metric
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    const metric = await db.performanceMetric.findFirst({
      where: {
        id,
        ...clinicFilter,
      },
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

    if (!metric) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Performance metric not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: metric });
  },
  { permissions: ['staff:read', 'staff:write', 'staff:admin'] }
);

/**
 * PUT /api/staff/performance-metrics/[id]
 * Update a performance metric
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);

    // Validate input
    const result = updatePerformanceMetricSchema.safeParse(body);
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

    // Check if metric exists
    const existing = await db.performanceMetric.findFirst({
      where: {
        id,
        ...clinicFilter,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Performance metric not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Calculate targetMet if value or targetValue changed
    let targetMet = existing.targetMet;
    const newValue = data.value ?? existing.value;
    const newTarget = data.targetValue !== undefined ? data.targetValue : existing.targetValue;

    if (newTarget !== null && newTarget !== undefined) {
      targetMet = newValue >= newTarget;
    }

    // Update the metric
    const metric = await db.performanceMetric.update({
      where: { id },
      data: {
        ...data,
        targetMet,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PerformanceMetric',
      entityId: metric.id,
      details: {
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: metric });
  },
  { permissions: ['staff:write', 'staff:admin'] }
);

/**
 * DELETE /api/staff/performance-metrics/[id]
 * Delete a performance metric
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    // Check if metric exists
    const existing = await db.performanceMetric.findFirst({
      where: {
        id,
        ...clinicFilter,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Performance metric not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the metric
    await db.performanceMetric.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'PerformanceMetric',
      entityId: id,
      details: {
        staffProfileId: existing.staffProfileId,
        metricType: existing.metricType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['staff:admin'] }
);
