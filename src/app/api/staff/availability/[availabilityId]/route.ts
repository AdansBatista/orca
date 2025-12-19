import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateAvailabilitySchema } from '@/lib/validations/scheduling';

/**
 * GET /api/staff/availability/:availabilityId
 * Get a specific availability record
 */
export const GET = withAuth<{ availabilityId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { availabilityId } = await context.params;

    const availability = await db.staffAvailability.findFirst({
      where: {
        id: availabilityId,
        ...getClinicFilter(session),
      },
      include: {
        staffProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!availability) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Availability record not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: availability,
    });
  },
  { permissions: ['schedule:view', 'schedule:edit', 'schedule:full'] }
);

/**
 * PUT /api/staff/availability/:availabilityId
 * Update an availability record
 */
export const PUT = withAuth<{ availabilityId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { availabilityId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateAvailabilitySchema.safeParse({ ...body, id: availabilityId });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid availability data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { id, ...updateData } = result.data;

    // Find existing availability
    const existingAvailability = await db.staffAvailability.findFirst({
      where: {
        id: availabilityId,
        ...getClinicFilter(session),
      },
    });

    if (!existingAvailability) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Availability record not found',
          },
        },
        { status: 404 }
      );
    }

    // Update the availability
    const availability = await db.staffAvailability.update({
      where: { id: availabilityId },
      data: updateData,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'StaffAvailability',
      entityId: availability.id,
      details: {
        changes: Object.keys(updateData),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: availability,
    });
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);

/**
 * DELETE /api/staff/availability/:availabilityId
 * Delete an availability record
 */
export const DELETE = withAuth<{ availabilityId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { availabilityId } = await context.params;

    // Find existing availability
    const existingAvailability = await db.staffAvailability.findFirst({
      where: {
        id: availabilityId,
        ...getClinicFilter(session),
      },
    });

    if (!existingAvailability) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Availability record not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the availability
    await db.staffAvailability.delete({
      where: { id: availabilityId },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'StaffAvailability',
      entityId: availabilityId,
      details: {
        staffProfileId: existingAvailability.staffProfileId,
        availabilityType: existingAvailability.availabilityType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Availability deleted successfully' },
    });
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);
