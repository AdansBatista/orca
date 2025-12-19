import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';
import type { ProviderType } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createCoverageRequirementSchema } from '@/lib/validations/scheduling';

// Query schema for coverage requirements
const coverageQuerySchema = z.object({
  locationId: z.string().optional(),
  department: z.string().optional(),
  providerType: z.string().optional(),
  isActive: z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
});

/**
 * GET /api/staff/coverage
 * List coverage requirements
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      locationId: searchParams.get('locationId') ?? undefined,
      department: searchParams.get('department') ?? undefined,
      providerType: searchParams.get('providerType') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      dayOfWeek: searchParams.get('dayOfWeek') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = coverageQuerySchema.safeParse(rawParams);

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

    const { locationId, department, providerType, isActive, dayOfWeek, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (locationId) where.locationId = locationId;
    if (department) where.department = department;
    if (providerType) where.providerType = providerType;
    if (isActive !== undefined) where.isActive = isActive;
    if (dayOfWeek !== undefined) where.dayOfWeek = dayOfWeek;

    // Get total count
    const total = await db.coverageRequirement.count({ where });

    // Get paginated results
    const items = await db.coverageRequirement.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
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
 * POST /api/staff/coverage
 * Create a new coverage requirement
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createCoverageRequirementSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid coverage requirement data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Validate optimal/maximum against minimum
    if (data.optimalStaff !== null && data.optimalStaff !== undefined && data.optimalStaff < data.minimumStaff) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Optimal staff count cannot be less than minimum staff count',
          },
        },
        { status: 400 }
      );
    }

    if (data.maximumStaff !== null && data.maximumStaff !== undefined && data.maximumStaff < data.minimumStaff) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Maximum staff count cannot be less than minimum staff count',
          },
        },
        { status: 400 }
      );
    }

    // Extract and cast providerType properly
    const { providerType, ...restData } = data;

    // Create the coverage requirement
    const coverageRequirement = await db.coverageRequirement.create({
      data: {
        ...restData,
        providerType: providerType as ProviderType | null | undefined,
        clinicId: session.user.clinicId,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'CoverageRequirement',
      entityId: coverageRequirement.id,
      details: {
        name: data.name,
        locationId: data.locationId,
        minimumStaff: data.minimumStaff,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: coverageRequirement },
      { status: 201 }
    );
  },
  { permissions: ['schedule:edit', 'schedule:full'] }
);
