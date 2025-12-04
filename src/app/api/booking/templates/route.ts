import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import {
  bookingTemplateQuerySchema,
  createBookingTemplateSchema,
} from '@/lib/validations/advanced-scheduling';

/**
 * GET /api/booking/templates
 * List booking templates with filtering and pagination
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      templateType: searchParams.get('templateType') ?? undefined,
      providerId: searchParams.get('providerId') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = bookingTemplateQuerySchema.safeParse(rawParams);

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
      templateType,
      providerId,
      isActive,
      page,
      pageSize,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Template type filter
    if (templateType) {
      where.templateType = templateType;
    }

    // Provider filter (null = clinic-wide templates)
    if (providerId) {
      where.providerId = providerId;
    }

    // Active filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    // Count total
    const total = await db.bookingTemplate.count({ where });

    // Fetch templates
    const templates = await db.bookingTemplate.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: [
        { isDefault: 'desc' },
        { name: 'asc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: templates,
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
 * POST /api/booking/templates
 * Create a booking template
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();
    const validationResult = createBookingTemplateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid template data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // If provider-specific, verify provider exists
    if (data.providerId) {
      const provider = await db.staffProfile.findFirst({
        where: {
          id: data.providerId,
          ...getClinicFilter(session),
          isProvider: true,
        },
      });

      if (!provider) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PROVIDER_NOT_FOUND',
              message: 'Provider not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // If setting as default, unset other defaults of same type
    if (data.isDefault) {
      await db.bookingTemplate.updateMany({
        where: {
          ...getClinicFilter(session),
          templateType: data.templateType,
          providerId: data.providerId ?? null,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Prepare slots data - support both new blocks and legacy slots format
    // Prisma expects a valid JSON value or undefined (not null)
    const slotsData = data.blocks && data.blocks.length > 0
      ? data.blocks
      : data.slots && data.slots.length > 0
        ? data.slots
        : [];

    // Create template
    const template = await db.bookingTemplate.create({
      data: {
        clinicId: session.user.clinicId,
        name: data.name,
        description: data.description,
        templateType: data.templateType,
        isActive: data.isActive,
        isDefault: data.isDefault,
        providerId: data.providerId,
        slots: slotsData,
        color: data.color,
        createdBy: session.user.id,
      },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: template,
      },
      { status: 201 }
    );
  },
  { permissions: ['booking:write'] }
);
