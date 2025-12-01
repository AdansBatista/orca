import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateBlackoutDateSchema } from '@/lib/validations/scheduling';

/**
 * GET /api/staff/blackout-dates/:id
 * Get a specific blackout date
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const blackoutDate = await db.blackoutDate.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!blackoutDate) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Blackout date not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: blackoutDate,
    });
  },
  { permissions: ['schedule:view', 'schedule:edit', 'schedule:full'] }
);

/**
 * PUT /api/staff/blackout-dates/:id
 * Update a blackout date
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateBlackoutDateSchema.safeParse({ ...body, id });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid blackout date data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { id: _, ...updateData } = result.data;

    // Find existing blackout date
    const existingBlackout = await db.blackoutDate.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingBlackout) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Blackout date not found',
          },
        },
        { status: 404 }
      );
    }

    // Check for overlapping blackout dates if dates are being changed
    if (updateData.startDate || updateData.endDate) {
      const startDate = updateData.startDate || existingBlackout.startDate;
      const endDate = updateData.endDate || existingBlackout.endDate;

      const overlapping = await db.blackoutDate.findFirst({
        where: {
          id: { not: id },
          clinicId: session.user.clinicId,
          isActive: true,
          OR: [
            {
              AND: [
                { startDate: { lte: startDate } },
                { endDate: { gte: startDate } },
              ],
            },
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: endDate } },
              ],
            },
            {
              AND: [
                { startDate: { gte: startDate } },
                { endDate: { lte: endDate } },
              ],
            },
          ],
        },
      });

      if (overlapping) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'BLACKOUT_OVERLAP',
              message: 'This update would overlap with an existing blackout period',
              details: {
                existingId: overlapping.id,
                existingName: overlapping.name,
              },
            },
          },
          { status: 409 }
        );
      }
    }

    // Update the blackout date
    const blackoutDate = await db.blackoutDate.update({
      where: { id },
      data: {
        ...updateData,
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'BlackoutDate',
      entityId: blackoutDate.id,
      details: {
        changes: Object.keys(updateData),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: blackoutDate,
    });
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);

/**
 * DELETE /api/staff/blackout-dates/:id
 * Delete (deactivate) a blackout date
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Find existing blackout date
    const existingBlackout = await db.blackoutDate.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingBlackout) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Blackout date not found',
          },
        },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    const blackoutDate = await db.blackoutDate.update({
      where: { id },
      data: {
        isActive: false,
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'BlackoutDate',
      entityId: blackoutDate.id,
      details: {
        name: blackoutDate.name,
        softDelete: true,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { message: 'Blackout date deactivated successfully' },
    });
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);
