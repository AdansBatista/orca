import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createRoomSchema, roomQuerySchema } from '@/lib/validations/room';

/**
 * GET /api/resources/rooms
 * List rooms with pagination, search, and filters
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      roomType: searchParams.get('roomType') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      isAvailable: searchParams.get('isAvailable') ?? undefined,
      hasChairs: searchParams.get('hasChairs') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = roomQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      search,
      roomType,
      status,
      isAvailable,
      hasChairs,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with standardized soft delete filter
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (roomType) where.roomType = roomType;
    if (status) where.status = status;
    if (typeof isAvailable === 'boolean') where.isAvailable = isAvailable;

    // Search across name and room number
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { roomNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.room.count({ where });

    // Get paginated results
    const items = await db.room.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            chairs: true,
            roomEquipment: { where: { unassignedDate: null } },
          },
        },
      },
    });

    // Filter by hasChairs if specified (post-query filter)
    let filteredItems = items;
    if (typeof hasChairs === 'boolean') {
      filteredItems = items.filter((room) =>
        hasChairs ? room._count.chairs > 0 : room._count.chairs === 0
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        items: filteredItems,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['equipment:read'] } // Reuse equipment permissions for now
);

/**
 * POST /api/resources/rooms
 * Create a new room
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createRoomSchema.safeParse(body);
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

    const data = result.data;

    // Check for duplicate room number in this clinic
    const existingRoom = await db.room.findFirst({
      where: withSoftDelete({
        clinicId: session.user.clinicId,
        roomNumber: data.roomNumber,
      }),
    });

    if (existingRoom) {
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

    // Create the room
    const room = await db.room.create({
      data: {
        clinicId: session.user.clinicId,
        name: data.name,
        roomNumber: data.roomNumber,
        roomType: data.roomType,
        floor: data.floor,
        wing: data.wing,
        squareFeet: data.squareFeet,
        capacity: data.capacity,
        status: data.status,
        isAvailable: data.isAvailable,
        capabilities: data.capabilities,
        setupNotes: data.setupNotes,
        notes: data.notes,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        deletedAt: null,
      },
      include: {
        _count: {
          select: {
            chairs: true,
            roomEquipment: { where: { unassignedDate: null } },
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Room',
      entityId: room.id,
      details: {
        roomNumber: room.roomNumber,
        name: room.name,
        roomType: room.roomType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: room }, { status: 201 });
  },
  { permissions: ['equipment:create'] } // Reuse equipment permissions for now
);
