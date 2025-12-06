import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createTreatmentChairSchema } from '@/lib/validations/room';

/**
 * GET /api/resources/rooms/:id/chairs
 * List all chairs in a room
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
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

    const chairs = await db.treatmentChair.findMany({
      where: withSoftDelete({
        roomId,
        ...getClinicFilter(session),
      }),
      orderBy: { chairNumber: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: chairs,
    });
  },
  { permissions: ['equipment:read'] }
);

/**
 * POST /api/resources/rooms/:id/chairs
 * Add a new chair to a room
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
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
    const result = createTreatmentChairSchema.safeParse({ ...body, roomId });
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

    const data = result.data;

    // Check for duplicate chair number in this clinic
    const existingChair = await db.treatmentChair.findFirst({
      where: withSoftDelete({
        clinicId: session.user.clinicId,
        chairNumber: data.chairNumber,
      }),
    });

    if (existingChair) {
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

    // Create the chair
    const chair = await db.treatmentChair.create({
      data: {
        clinicId: session.user.clinicId,
        roomId,
        name: data.name,
        chairNumber: data.chairNumber,
        manufacturer: data.manufacturer,
        modelNumber: data.modelNumber,
        serialNumber: data.serialNumber,
        status: data.status,
        condition: data.condition,
        features: data.features,
        hasDeliveryUnit: data.hasDeliveryUnit,
        hasSuction: data.hasSuction,
        hasLight: data.hasLight,
        purchaseDate: data.purchaseDate,
        warrantyExpiry: data.warrantyExpiry,
        nextMaintenanceDate: data.nextMaintenanceDate,
        notes: data.notes,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        deletedAt: null,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'TreatmentChair',
      entityId: chair.id,
      details: {
        chairNumber: chair.chairNumber,
        name: chair.name,
        roomId: room.id,
        roomNumber: room.roomNumber,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: chair }, { status: 201 });
  },
  { permissions: ['equipment:create'] }
);
