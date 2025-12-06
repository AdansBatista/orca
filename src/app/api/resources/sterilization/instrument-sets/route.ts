import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete } from '@/lib/db/soft-delete';
import {
  createInstrumentSetSchema,
  instrumentSetQuerySchema,
} from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/instrument-sets
 * List instrument sets with pagination, search, and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = instrumentSetQuerySchema.safeParse(rawParams);

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
      category,
      status,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete({
      ...getClinicFilter(session),
    });

    if (category) where.category = category;
    if (status) where.status = status;

    // Search across name, set number, and barcode
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { setNumber: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.instrumentSet.count({ where });

    // Get paginated results
    const items = await db.instrumentSet.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
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
  { permissions: ['sterilization:read'] }
);

/**
 * POST /api/resources/sterilization/instrument-sets
 * Create a new instrument set
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createInstrumentSetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid instrument set data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate set number in this clinic
    const existingSet = await db.instrumentSet.findFirst({
      where: withSoftDelete({
        clinicId: session.user.clinicId,
        setNumber: data.setNumber,
      }),
    });

    if (existingSet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_SET_NUMBER',
            message: 'An instrument set with this set number already exists',
          },
        },
        { status: 409 }
      );
    }

    // Create the instrument set
    const instrumentSet = await db.instrumentSet.create({
      data: {
        clinicId: session.user.clinicId,
        name: data.name,
        setNumber: data.setNumber,
        barcode: data.barcode,
        description: data.description,
        instrumentCount: data.instrumentCount,
        category: data.category,
        status: data.status,
        currentLocation: data.currentLocation,
        assemblyDate: data.assemblyDate,
        expirationDays: data.expirationDays,
        maxUses: data.maxUses,
        notes: data.notes,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'InstrumentSet',
      entityId: instrumentSet.id,
      details: {
        setNumber: instrumentSet.setNumber,
        name: instrumentSet.name,
        category: instrumentSet.category,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: instrumentSet }, { status: 201 });
  },
  { permissions: ['sterilization:create'] }
);
