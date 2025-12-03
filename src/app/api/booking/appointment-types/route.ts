import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createAppointmentTypeSchema,
  appointmentTypeQuerySchema,
} from '@/lib/validations/booking';

/**
 * GET /api/booking/appointment-types
 * List appointment types for the clinic
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      allowOnline: searchParams.get('allowOnline') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = appointmentTypeQuerySchema.safeParse(rawParams);

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

    const { search, isActive, allowOnline, page, pageSize, sortBy, sortOrder } = queryResult.data;

    // Build where clause
    // Note: MongoDB requires OR with isSet:false for null checks
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    // Build AND conditions for filtering
    const andConditions: Record<string, unknown>[] = [
      // Soft delete check (MongoDB-compatible)
      { OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }] },
    ];

    if (isActive !== undefined) where.isActive = isActive;
    if (allowOnline !== undefined) where.allowOnline = allowOnline;

    // Search by name, code, or description
    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    // Get total count
    const total = await db.appointmentType.count({ where });

    // Get paginated results
    const items = await db.appointmentType.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: { appointments: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * POST /api/booking/appointment-types
 * Create a new appointment type
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createAppointmentTypeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid appointment type data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate code in this clinic
    // Note: MongoDB requires OR with isSet:false for null checks
    const existingByCode = await db.appointmentType.findFirst({
      where: {
        clinicId: session.user.clinicId,
        code: data.code,
        OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }],
      },
    });

    if (existingByCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CODE',
            message: 'An appointment type with this code already exists',
          },
        },
        { status: 409 }
      );
    }

    // Create the appointment type
    const appointmentType = await db.appointmentType.create({
      data: {
        clinicId: session.user.clinicId,
        code: data.code,
        name: data.name,
        description: data.description,
        defaultDuration: data.defaultDuration,
        minDuration: data.minDuration,
        maxDuration: data.maxDuration,
        color: data.color,
        icon: data.icon,
        requiresChair: data.requiresChair,
        requiresRoom: data.requiresRoom,
        prepTime: data.prepTime,
        cleanupTime: data.cleanupTime,
        isActive: data.isActive,
        allowOnline: data.allowOnline,
        sortOrder: data.sortOrder,
        createdBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'AppointmentType',
      entityId: appointmentType.id,
      details: {
        code: appointmentType.code,
        name: appointmentType.name,
        duration: appointmentType.defaultDuration,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: appointmentType },
      { status: 201 }
    );
  },
  { permissions: ['booking:create'] }
);
