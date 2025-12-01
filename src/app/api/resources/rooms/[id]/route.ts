import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateRoomSchema } from '@/lib/validations/room';

/**
 * GET /api/resources/rooms/:id
 * Get a single room with details
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const room = await db.room.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      include: {
        chairs: {
          where: { deletedAt: null },
          orderBy: { chairNumber: 'asc' },
        },
        roomEquipment: {
          where: { unassignedDate: null },
          orderBy: { assignedDate: 'desc' },
        },
        _count: {
          select: {
            chairs: { where: { deletedAt: null } },
            roomEquipment: { where: { unassignedDate: null } },
          },
        },
      },
    });

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Room not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: room });
  },
  { permissions: ['equipment:read'] }
);

/**
 * PUT /api/resources/rooms/:id
 * Update a room
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateRoomSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid room data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if room exists
    const existingRoom = await db.room.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existingRoom) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Room not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Check for duplicate room number if changing it
    if (data.roomNumber && data.roomNumber !== existingRoom.roomNumber) {
      const duplicateRoom = await db.room.findFirst({
        where: {
          clinicId: session.user.clinicId,
          roomNumber: data.roomNumber,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (duplicateRoom) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_ROOM_NUMBER',
              message: 'A room with this room number already exists',
            },
          },
          { status: 409 }
        );
      }
    }

    // Update the room
    const room = await db.room.update({
      where: { id },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
      include: {
        _count: {
          select: {
            chairs: { where: { deletedAt: null } },
            roomEquipment: { where: { unassignedDate: null } },
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Room',
      entityId: room.id,
      details: {
        roomNumber: room.roomNumber,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: room });
  },
  { permissions: ['equipment:update'] }
);

/**
 * DELETE /api/resources/rooms/:id
 * Soft delete a room
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Check if room exists
    const existingRoom = await db.room.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            chairs: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!existingRoom) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Room not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if room has active chairs
    if (existingRoom._count.chairs > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_CHAIRS',
            message: 'Cannot delete room with active treatment chairs. Please remove or reassign chairs first.',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete the room
    await db.room.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    });

    // Unassign all equipment from this room
    await db.roomEquipment.updateMany({
      where: {
        roomId: id,
        unassignedDate: null,
      },
      data: {
        unassignedDate: new Date(),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'Room',
      entityId: id,
      details: {
        roomNumber: existingRoom.roomNumber,
        name: existingRoom.name,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['equipment:delete'] }
);
