import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updatePerformanceReviewSchema } from '@/lib/validations/performance';

/**
 * GET /api/staff/reviews/[id]
 * Get a single performance review
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    const review = await db.performanceReview.findFirst({
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
            department: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Performance review not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: review });
  },
  { permissions: ['staff:read', 'staff:write', 'staff:admin'] }
);

/**
 * PUT /api/staff/reviews/[id]
 * Update a performance review
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);

    // Validate input
    const result = updatePerformanceReviewSchema.safeParse(body);
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

    // Check if review exists
    const existing = await db.performanceReview.findFirst({
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
            message: 'Performance review not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Set completedAt if status is changed to COMPLETED
    const updateData: Record<string, unknown> = { ...data };
    if (data.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    }

    // Update the review
    const review = await db.performanceReview.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PerformanceReview',
      entityId: review.id,
      details: {
        changes: Object.keys(data),
        statusChanged: data.status && data.status !== existing.status,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: review });
  },
  { permissions: ['staff:write', 'staff:admin'] }
);

/**
 * DELETE /api/staff/reviews/[id]
 * Delete a performance review
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    // Check if review exists
    const existing = await db.performanceReview.findFirst({
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
            message: 'Performance review not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot delete completed reviews
    if (existing.status === 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot delete completed reviews',
          },
        },
        { status: 403 }
      );
    }

    // Delete the review
    await db.performanceReview.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'PerformanceReview',
      entityId: id,
      details: {
        staffProfileId: existing.staffProfileId,
        reviewType: existing.reviewType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['staff:admin'] }
);
