import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createLabVendorSchema,
  labVendorQuerySchema,
} from '@/lib/validations/lab';

/**
 * GET /api/lab/vendors
 * List lab vendors with filtering and pagination
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      hasCapability: searchParams.get('hasCapability') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = labVendorQuerySchema.safeParse(rawParams);

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
      status,
      hasCapability,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with soft delete
    const where: Record<string, unknown> = withSoftDelete({
      ...getClinicFilter(session),
    });

    if (status) where.status = status;
    if (hasCapability) {
      where.capabilities = { has: hasCapability };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { primaryEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await db.labVendor.count({ where });

    const items = await db.labVendor.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        contacts: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: {
            orders: true,
            products: true,
            contracts: true,
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
 * POST /api/lab/vendors
 * Create a new lab vendor
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createLabVendorSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid vendor data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate code
    const existingVendor = await db.labVendor.findFirst({
      where: withSoftDelete({
        ...getClinicFilter(session),
        code: data.code,
      }),
    });

    if (existingVendor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CODE',
            message: `A vendor with code "${data.code}" already exists`,
          },
        },
        { status: 409 }
      );
    }

    // Create the vendor
    const vendor = await db.labVendor.create({
      data: {
        clinicId: session.user.clinicId,
        name: data.name,
        code: data.code,
        legalName: data.legalName,
        taxId: data.taxId,
        website: data.website,
        accountNumber: data.accountNumber,
        status: data.status,
        address: data.address,
        primaryPhone: data.primaryPhone,
        primaryEmail: data.primaryEmail,
        portalUrl: data.portalUrl,
        apiEndpoint: data.apiEndpoint,
        capabilities: data.capabilities,
        specialties: data.specialties,
        defaultCarrier: data.defaultCarrier,
        shippingAccountNumber: data.shippingAccountNumber,
        paymentTerms: data.paymentTerms,
        billingEmail: data.billingEmail,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        _count: {
          select: {
            orders: true,
            products: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'LabVendor',
      entityId: vendor.id,
      details: {
        name: vendor.name,
        code: vendor.code,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: vendor }, { status: 201 });
  },
  { permissions: ['lab:manage_vendors'] }
);
