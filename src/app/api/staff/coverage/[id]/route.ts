import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { ProviderType } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateCoverageRequirementSchema } from '@/lib/validations/scheduling';

/**
 * GET /api/staff/coverage/[id]
 * Get a single coverage requirement
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const coverageRequirement = await db.coverageRequirement.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!coverageRequirement) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Coverage requirement not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: coverageRequirement });
  },
  { permissions: ['schedule:view', 'schedule:edit', 'schedule:full'] }
);

/**
 * PATCH /api/staff/coverage/[id]
 * Update a coverage requirement
 */
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateCoverageRequirementSchema.safeParse({ ...body, id });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid coverage requirement data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if exists
    const existing = await db.coverageRequirement.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Coverage requirement not found',
          },
        },
        { status: 404 }
      );
    }

    const { id: _id, providerType, ...restData } = result.data;

    // Prepare update data with properly typed providerType
    const updateData = {
      ...restData,
      ...(providerType !== undefined && { providerType: providerType as ProviderType | null }),
    };

    // Validate staff count relationships
    const minimumStaff = updateData.minimumStaff ?? existing.minimumStaff;
    const optimalStaff = updateData.optimalStaff !== undefined ? updateData.optimalStaff : existing.optimalStaff;
    const maximumStaff = updateData.maximumStaff !== undefined ? updateData.maximumStaff : existing.maximumStaff;

    if (optimalStaff !== null && optimalStaff < minimumStaff) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Optimal staff count cannot be less than minimum staff count',
          },
        },
        { status: 400 }
      );
    }

    if (maximumStaff !== null && maximumStaff < minimumStaff) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Maximum staff count cannot be less than minimum staff count',
          },
        },
        { status: 400 }
      );
    }

    // Update the coverage requirement
    const updated = await db.coverageRequirement.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'CoverageRequirement',
      entityId: id,
      details: {
        fields: Object.keys(updateData),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: updated });
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);

/**
 * DELETE /api/staff/coverage/[id]
 * Delete a coverage requirement
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Check if exists
    const existing = await db.coverageRequirement.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Coverage requirement not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the coverage requirement
    await db.coverageRequirement.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'CoverageRequirement',
      entityId: id,
      details: {
        name: existing.name,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['schedule:full'] }
);
