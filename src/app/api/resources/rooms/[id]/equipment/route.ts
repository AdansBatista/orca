import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { assignEquipmentToRoomSchema } from '@/lib/validations/room';

/**
 * GET /api/resources/rooms/:id/equipment
 * List all equipment assigned to a room
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: roomId } = await context.params;

    // Verify room exists and belongs to clinic
    const room = await db.room.findFirst({
      where: withSoftDelete({
        id: roomId,
        ...getClinicFilter(session),
      }),
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

    // Get current (active) equipment assignments
    const assignments = await db.roomEquipment.findMany({
      where: {
        roomId,
        ...getClinicFilter(session),
        unassignedDate: null, // Only current assignments
      },
      orderBy: { assignedDate: 'desc' },
    });

    // Get equipment details for each assignment
    const equipmentIds = assignments.map((a) => a.equipmentId);
    const equipmentList = await db.equipment.findMany({
      where: withSoftDelete({
        id: { in: equipmentIds },
        ...getClinicFilter(session),
      }),
      include: {
        type: {
          select: { id: true, name: true, code: true, category: true },
        },
      },
    });

    // Combine assignment with equipment details
    const result = assignments.map((assignment) => ({
      ...assignment,
      equipment: equipmentList.find((e) => e.id === assignment.equipmentId) || null,
    }));

    return NextResponse.json({
      success: true,
      data: result,
    });
  },
  { permissions: ['equipment:read'] }
);

/**
 * POST /api/resources/rooms/:id/equipment
 * Assign equipment to a room
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: roomId } = await context.params;
    const body = await req.json();

    // Verify room exists and belongs to clinic
    const room = await db.room.findFirst({
      where: withSoftDelete({
        id: roomId,
        ...getClinicFilter(session),
      }),
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

    // Validate input
    const result = assignEquipmentToRoomSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid assignment data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify equipment exists and belongs to clinic
    const equipment = await db.equipment.findFirst({
      where: withSoftDelete({
        id: data.equipmentId,
        ...getClinicFilter(session),
      }),
    });

    if (!equipment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EQUIPMENT_NOT_FOUND',
            message: 'Equipment not found',
          },
        },
        { status: 400 }
      );
    }

    // Check if equipment is already assigned to this room
    const existingAssignment = await db.roomEquipment.findFirst({
      where: {
        roomId,
        equipmentId: data.equipmentId,
        unassignedDate: null,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_ASSIGNED',
            message: 'Equipment is already assigned to this room',
          },
        },
        { status: 409 }
      );
    }

    // If equipment is assigned elsewhere, unassign it first (for permanent assignments)
    if (data.isPermanent) {
      await db.roomEquipment.updateMany({
        where: {
          equipmentId: data.equipmentId,
          unassignedDate: null,
        },
        data: {
          unassignedDate: new Date(),
        },
      });
    }

    // Create the assignment
    const assignment = await db.roomEquipment.create({
      data: {
        clinicId: session.user.clinicId,
        roomId,
        equipmentId: data.equipmentId,
        isPermanent: data.isPermanent,
        position: data.position,
        notes: data.notes,
        createdBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'RoomEquipment',
      entityId: assignment.id,
      details: {
        roomId: room.id,
        roomNumber: room.roomNumber,
        equipmentId: equipment.id,
        equipmentName: equipment.name,
        isPermanent: data.isPermanent,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  },
  { permissions: ['equipment:update'] }
);
