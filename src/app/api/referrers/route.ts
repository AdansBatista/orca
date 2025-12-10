import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createReferringProviderSchema,
  referringProviderQuerySchema,
} from '@/lib/validations/referrers';

/**
 * GET /api/referrers
 * List referring providers with pagination and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = referringProviderQuerySchema.safeParse(rawParams);

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

    const { search, status, type, page, pageSize, sortBy, sortOrder } = queryResult.data;

    // Build where clause with soft delete filter
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (status) where.status = status;
    if (type) where.type = type;

    // Search across practice name, provider name
    if (search) {
      where.OR = [
        { practiceName: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.referringProvider.count({ where });

    // Get paginated results
    const items = await db.referringProvider.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: { leads: true, referralLetters: true },
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
  { permissions: ['leads:view', 'leads:edit', 'leads:full'] }
);

/**
 * POST /api/referrers
 * Create a new referring provider
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createReferringProviderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid provider data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate by practice name + provider name in this clinic
    const existing = await db.referringProvider.findFirst({
      where: withSoftDelete({
        clinicId: session.user.clinicId,
        practiceName: data.practiceName,
        firstName: data.firstName,
        lastName: data.lastName,
      }),
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_PROVIDER',
            message: 'A provider with this name at this practice already exists',
            existingId: existing.id,
          },
        },
        { status: 409 }
      );
    }

    // Create the provider
    const provider = await db.referringProvider.create({
      data: {
        ...data,
        clinicId: session.user.clinicId,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ReferringProvider',
      entityId: provider.id,
      details: {
        practiceName: provider.practiceName,
        name: `${provider.firstName} ${provider.lastName}`,
        type: provider.type,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: provider }, { status: 201 });
  },
  { permissions: ['leads:edit', 'leads:full'] }
);
