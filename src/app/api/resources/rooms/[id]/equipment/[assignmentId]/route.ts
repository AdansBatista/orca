import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateRoomEquipmentSchema } from '@/lib/validations/room';

/**
 * PUT /api/resources/rooms/:id/equipment/:assignmentId
 * Update an equipment assignment
 */
export const PUT = withAuth<{ id: string; assignmentId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: roomId, assignmentId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateRoomEquipmentSchema.safeParse(body);
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

    // Check if assignment exists
    const existingAssignment = await db.roomEquipment.findFirst({
      where: {
        id: assignmentId,
        roomId,
        ...getClinicFilter(session),
        unassignedDate: null,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Equipment assignment not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Update the assignment
    const assignment = await db.roomEquipment.update({
      where: { id: assignmentId },
      data: {
        ...data,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'RoomEquipment',
      entityId: assignment.id,
      details: {
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: assignment });
  },
  { permissions: ['equipment:update'] }
);

/**
 * DELETE /api/resources/rooms/:id/equipment/:assignmentId
 * Unassign equipment from a room
 */
export const DELETE = withAuth<{ id: string; assignmentId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: roomId, assignmentId } = await context.params;

    // Check if assignment exists
    const existingAssignment = await db.roomEquipment.findFirst({
      where: {
        id: assignmentId,
        roomId,
        ...getClinicFilter(session),
        unassignedDate: null,
      },
    });

    if (!existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Equipment assignment not found',
          },
        },
        { status: 404 }
      );
    }

    // Unassign (soft delete by setting unassignedDate)
    await db.roomEquipment.update({
      where: { id: assignmentId },
      data: {
        unassignedDate: new Date(),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'RoomEquipment',
      entityId: assignmentId,
      details: {
        roomId,
        equipmentId: existingAssignment.equipmentId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id: assignmentId } });
  },
  { permissions: ['equipment:update'] }
);
