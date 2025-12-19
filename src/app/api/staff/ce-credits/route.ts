import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createCECreditSchema,
  ceCreditQuerySchema,
} from '@/lib/validations/performance';
import { withSoftDelete } from '@/lib/db/soft-delete';

/**
 * GET /api/staff/ce-credits
 * List CE credits with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const clinicFilter = getClinicFilter(session);

    // Parse query parameters
    const rawParams = {
      staffProfileId: searchParams.get('staffProfileId') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      isVerified: searchParams.get('isVerified') ?? undefined,
      reportingPeriodStart: searchParams.get('reportingPeriodStart') ?? undefined,
      reportingPeriodEnd: searchParams.get('reportingPeriodEnd') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = ceCreditQuerySchema.safeParse(rawParams);

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

    const { staffProfileId, category, isVerified, reportingPeriodStart, reportingPeriodEnd, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...clinicFilter,
    };

    if (staffProfileId) {
      where.staffProfileId = staffProfileId;
    }

    if (category) {
      where.category = category;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified;
    }

    if (reportingPeriodStart) {
      where.completionDate = { gte: reportingPeriodStart };
    }

    if (reportingPeriodEnd) {
      where.completionDate = {
        ...((where.completionDate as Record<string, Date>) || {}),
        lte: reportingPeriodEnd,
      };
    }

    // Get total count
    const total = await db.cECredit.count({ where });

    // Get paginated results
    const items = await db.cECredit.findMany({
      where,
      orderBy: { completionDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        staffProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Get distinct categories for filtering
    const categories = await db.cECredit.findMany({
      where: clinicFilter,
      select: { category: true },
      distinct: ['category'],
    });

    // Get summary statistics
    const totalCredits = await db.cECredit.aggregate({
      where,
      _sum: { credits: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        categories: categories.map((c) => c.category),
        totalCredits: totalCredits._sum.credits ?? 0,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['staff:read', 'staff:write', 'staff:admin'] }
);

/**
 * POST /api/staff/ce-credits
 * Create a new CE credit
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);

    // Validate input
    const result = createCECreditSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid CE credit data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify staff profile exists and belongs to clinic
    const staffProfile = await db.staffProfile.findFirst({
      where: withSoftDelete({
        id: data.staffProfileId,
        ...clinicFilter,
      }),
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Staff profile not found',
          },
        },
        { status: 404 }
      );
    }

    // Create the CE credit
    const ceCredit = await db.cECredit.create({
      data: {
        staffProfileId: data.staffProfileId,
        courseName: data.courseName,
        provider: data.provider,
        category: data.category,
        credits: data.credits,
        creditType: data.creditType,
        completionDate: data.completionDate,
        reportingPeriodStart: data.reportingPeriodStart,
        reportingPeriodEnd: data.reportingPeriodEnd,
        certificateUrl: data.certificateUrl,
        verificationCode: data.verificationCode,
        notes: data.notes,
        isVerified: false,
        clinicId: session.user.clinicId,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'CECredit',
      entityId: ceCredit.id,
      details: {
        staffProfileId: data.staffProfileId,
        courseName: data.courseName,
        credits: data.credits,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: ceCredit }, { status: 201 });
  },
  { permissions: ['staff:write', 'staff:admin'] }
);
