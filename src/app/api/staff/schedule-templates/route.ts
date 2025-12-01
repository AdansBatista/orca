import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createScheduleTemplateSchema, templateQuerySchema } from '@/lib/validations/scheduling';

/**
 * GET /api/staff/schedule-templates
 * List schedule templates
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      templateType: searchParams.get('templateType') ?? undefined,
      employmentType: searchParams.get('employmentType') ?? undefined,
      locationId: searchParams.get('locationId') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = templateQuerySchema.safeParse(rawParams);

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

    const { templateType, employmentType, locationId, isActive, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (templateType) where.templateType = templateType;
    if (employmentType) where.employmentType = employmentType;
    if (locationId) where.locationId = locationId;
    if (isActive !== undefined) where.isActive = isActive;

    // Get total count
    const total = await db.scheduleTemplate.count({ where });

    // Get paginated results
    const items = await db.scheduleTemplate.findMany({
      where,
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
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['schedule:view', 'schedule:edit', 'schedule:full'] }
);

/**
 * POST /api/staff/schedule-templates
 * Create a new schedule template
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createScheduleTemplateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid template data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // If setting as default, unset any existing defaults of same type
    if (data.isDefault) {
      await db.scheduleTemplate.updateMany({
        where: {
          ...getClinicFilter(session),
          templateType: data.templateType,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }

    // Create the template
    const template = await db.scheduleTemplate.create({
      data: {
        ...data,
        clinicId: session.user.clinicId,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ScheduleTemplate',
      entityId: template.id,
      details: {
        name: data.name,
        templateType: data.templateType,
        shiftCount: data.shifts.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: template },
      { status: 201 }
    );
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);
