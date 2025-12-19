import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateTreatmentChairSchema } from '@/lib/validations/room';

/**
 * GET /api/resources/rooms/:id/chairs/:chairId
 * Get a single chair
 */
export const GET = withAuth<{ id: string; chairId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: roomId, chairId } = await context.params;

    const chair = await db.treatmentChair.findFirst({
      where: withSoftDelete({
        id: chairId,
        roomId,
        ...getClinicFilter(session),
      }),
      include: {
        room: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
            roomType: true,
          },
        },
      },
    });

    if (!chair) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Chair not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: chair });
  },
  { permissions: ['equipment:read'] }
);

/**
 * PUT /api/resources/rooms/:id/chairs/:chairId
 * Update a chair
 */
export const PUT = withAuth<{ id: string; chairId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: roomId, chairId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateTreatmentChairSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid chair data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if chair exists
    const existingChair = await db.treatmentChair.findFirst({
      where: withSoftDelete({
        id: chairId,
        roomId,
        ...getClinicFilter(session),
      }),
    });

    if (!existingChair) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Chair not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Check for duplicate chair number if changing it
    if (data.chairNumber && data.chairNumber !== existingChair.chairNumber) {
      const duplicateChair = await db.treatmentChair.findFirst({
        where: withSoftDelete({
          clinicId: session.user.clinicId,
          chairNumber: data.chairNumber,
          id: { not: chairId },
        }),
      });

      if (duplicateChair) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_CHAIR_NUMBER',
              message: 'A chair with this chair number already exists',
            },
          },
          { status: 409 }
        );
      }
    }

    // If changing room, verify new room exists
    if (data.roomId && data.roomId !== roomId) {
      const newRoom = await db.room.findFirst({
        where: withSoftDelete({
          id: data.roomId,
          ...getClinicFilter(session),
        }),
      });

      if (!newRoom) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_ROOM',
              message: 'Target room not found',
            },
          },
          { status: 400 }
        );
      }
    }

    // Update the chair
    const chair = await db.treatmentChair.update({
      where: { id: chairId },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
      include: {
        room: {
          select: {
            id: true,
            name: true,
            roomNumber: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'TreatmentChair',
      entityId: chair.id,
      details: {
        chairNumber: chair.chairNumber,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: chair });
  },
  { permissions: ['equipment:update'] }
);

/**
 * DELETE /api/resources/rooms/:id/chairs/:chairId
 * Soft delete a chair
 */
export const DELETE = withAuth<{ id: string; chairId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: roomId, chairId } = await context.params;

    // Check if chair exists
    const existingChair = await db.treatmentChair.findFirst({
      where: withSoftDelete({
        id: chairId,
        roomId,
        ...getClinicFilter(session),
      }),
    });

    if (!existingChair) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Chair not found',
          },
        },
        { status: 404 }
      );
    }

    // Soft delete the chair
    await db.treatmentChair.update({
      where: { id: chairId },
      data: {
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'TreatmentChair',
      entityId: chairId,
      details: {
        chairNumber: existingChair.chairNumber,
        name: existingChair.name,
        roomId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id: chairId } });
  },
  { permissions: ['equipment:delete'] }
);
