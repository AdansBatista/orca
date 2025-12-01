import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createSupplierSchema,
  supplierQuerySchema,
} from '@/lib/validations/equipment';

/**
 * GET /api/resources/suppliers
 * List suppliers with pagination and search
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      isPreferred: searchParams.get('isPreferred') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = supplierQuerySchema.safeParse(rawParams);

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

    const { search, status, isPreferred, page, pageSize, sortBy, sortOrder } =
      queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
      deletedAt: null,
    };

    if (status) where.status = status;
    if (isPreferred !== undefined) where.isPreferred = isPreferred;

    // Search by name, code, or contact name
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.supplier.count({ where });

    // Get paginated results
    const items = await db.supplier.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            equipment: true,
            maintenanceRecords: true,
            repairRecords: true,
          },
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
  { permissions: ['equipment:read'] }
);

/**
 * POST /api/resources/suppliers
 * Create a new supplier
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createSupplierSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid supplier data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate code in this clinic
    const existingByCode = await db.supplier.findFirst({
      where: {
        clinicId: session.user.clinicId,
        code: data.code,
        deletedAt: null,
      },
    });

    if (existingByCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CODE',
            message: 'A supplier with this code already exists',
          },
        },
        { status: 409 }
      );
    }

    // Create the supplier
    const supplier = await db.supplier.create({
      data: {
        clinicId: session.user.clinicId,
        ...data,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Supplier',
      entityId: supplier.id,
      details: {
        code: supplier.code,
        name: supplier.name,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: supplier },
      { status: 201 }
    );
  },
  { permissions: ['equipment:create'] }
);
