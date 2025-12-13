import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createInsuranceCompanySchema,
  insuranceCompanyQuerySchema,
} from '@/lib/validations/insurance';

/**
 * GET /api/insurance/companies
 * List insurance companies with pagination, search, and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      supportsEligibility: searchParams.get('supportsEligibility') ?? undefined,
      requiresPreauth: searchParams.get('requiresPreauth') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = insuranceCompanyQuerySchema.safeParse(rawParams);

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
      type,
      supportsEligibility,
      requiresPreauth,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with standardized soft delete filter
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (type) where.type = type;
    if (supportsEligibility !== undefined) where.supportsEligibility = supportsEligibility;
    if (requiresPreauth !== undefined) where.requiresPreauth = requiresPreauth;

    // Search across name and payer ID
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { payerId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.insuranceCompany.count({ where });

    // Get paginated results
    const companies = await db.insuranceCompany.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            patientInsurances: true,
            claims: true,
          },
        },
      },
    });

    // Get type distribution
    const typeCounts = await db.insuranceCompany.groupBy({
      by: ['type'],
      where: withSoftDelete(getClinicFilter(session)),
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: companies,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          typeCounts: typeCounts.reduce((acc, item) => {
            acc[item.type] = item._count;
            return acc;
          }, {} as Record<string, number>),
        },
      },
    });
  },
  { permissions: ['insurance:read'] }
);

/**
 * POST /api/insurance/companies
 * Create a new insurance company
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createInsuranceCompanySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid insurance company data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate payer ID
    const existingCompany = await db.insuranceCompany.findFirst({
      where: withSoftDelete({
        clinicId: session.user.clinicId,
        payerId: data.payerId,
      }),
    });

    if (existingCompany) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_PAYER_ID',
            message: 'An insurance company with this payer ID already exists',
          },
        },
        { status: 409 }
      );
    }

    // Create the insurance company
    const company = await db.insuranceCompany.create({
      data: {
        clinicId: session.user.clinicId,
        name: data.name,
        payerId: data.payerId,
        type: data.type,
        phone: data.phone,
        fax: data.fax,
        email: data.email,
        website: data.website,
        claimsStreet: data.claimsStreet,
        claimsCity: data.claimsCity,
        claimsState: data.claimsState,
        claimsZip: data.claimsZip,
        clearinghouseId: data.clearinghouseId,
        supportsEligibility: data.supportsEligibility,
        supportsEdi837: data.supportsEdi837,
        supportsEdi835: data.supportsEdi835,
        orthoPaymentType: data.orthoPaymentType,
        requiresPreauth: data.requiresPreauth,
        notes: data.notes,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'InsuranceCompany',
      entityId: company.id,
      details: {
        name: company.name,
        payerId: company.payerId,
        type: company.type,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: company },
      { status: 201 }
    );
  },
  { permissions: ['insurance:create'] }
);
