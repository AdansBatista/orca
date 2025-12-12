import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createLabProductSchema,
  labProductQuerySchema,
} from '@/lib/validations/lab';

/**
 * GET /api/lab/products
 * List lab products with filtering and pagination
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      vendorId: searchParams.get('vendorId') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = labProductQuerySchema.safeParse(rawParams);

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
      vendorId,
      category,
      isActive,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with soft delete
    const where: Record<string, unknown> = withSoftDelete({
      ...getClinicFilter(session),
    });

    if (vendorId) where.vendorId = vendorId;
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await db.labProduct.count({ where });

    const items = await db.labProduct.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        feeSchedules: {
          where: { isActive: true },
          orderBy: { effectiveDate: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            orderItems: true,
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
  { permissions: ['lab:track'] }
);

/**
 * POST /api/lab/products
 * Create a new lab product
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createLabProductSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid product data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify vendor if provided
    if (data.vendorId) {
      const vendor = await db.labVendor.findFirst({
        where: withSoftDelete({
          id: data.vendorId,
          ...getClinicFilter(session),
        }),
      });

      if (!vendor) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VENDOR_NOT_FOUND',
              message: 'Lab vendor not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Create the product
    const product = await db.labProduct.create({
      data: {
        clinicId: session.user.clinicId,
        vendorId: data.vendorId,
        name: data.name,
        description: data.description,
        sku: data.sku,
        category: data.category,
        prescriptionSchema: data.prescriptionSchema,
        standardTurnaround: data.standardTurnaround,
        rushTurnaround: data.rushTurnaround,
        isActive: data.isActive,
      },
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'LabProduct',
      entityId: product.id,
      details: {
        name: product.name,
        category: product.category,
        vendorId: product.vendorId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  },
  { permissions: ['lab:manage_vendors'] }
);
