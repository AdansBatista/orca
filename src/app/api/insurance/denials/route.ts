import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { denialQuerySchema } from '@/lib/validations/insurance';

/**
 * GET /api/insurance/denials
 * List denied claims with filters for denial management workqueue
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      insuranceCompanyId: searchParams.get('insuranceCompanyId') ?? undefined,
      denialCode: searchParams.get('denialCode') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      appealDeadlineApproaching: searchParams.get('appealDeadlineApproaching') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = denialQuerySchema.safeParse(rawParams);

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
      patientId,
      insuranceCompanyId,
      denialCode,
      fromDate,
      toDate,
      appealDeadlineApproaching,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause - only denied claims
    const where: Record<string, unknown> = withSoftDelete({
      ...getClinicFilter(session),
      status: 'DENIED',
    });

    if (patientId) where.patientId = patientId;
    if (insuranceCompanyId) where.insuranceCompanyId = insuranceCompanyId;
    if (denialCode) where.denialCode = denialCode;

    // Date range filter for denial date
    if (fromDate || toDate) {
      where.deniedAt = {};
      if (fromDate) (where.deniedAt as Record<string, unknown>).gte = fromDate;
      if (toDate) (where.deniedAt as Record<string, unknown>).lte = toDate;
    }

    // Appeal deadline approaching (within 14 days)
    if (appealDeadlineApproaching) {
      const fourteenDaysFromNow = new Date();
      fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

      where.appealDeadline = {
        gte: new Date(),
        lte: fourteenDaysFromNow,
      };
    }

    // Search by claim number or patient name
    if (search) {
      where.OR = [
        { claimNumber: { contains: search, mode: 'insensitive' } },
        { denialCode: { contains: search, mode: 'insensitive' } },
        { denialReason: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await db.insuranceClaim.count({ where });

    // Get paginated results
    const denials = await db.insuranceClaim.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        insuranceCompany: {
          select: {
            id: true,
            name: true,
            payerId: true,
          },
        },
        _count: {
          select: {
            items: true,
          },
        },
      },
    });

    // Get denial code distribution
    const denialCodeCounts = await db.insuranceClaim.groupBy({
      by: ['denialCode'],
      where: withSoftDelete({
        ...getClinicFilter(session),
        status: 'DENIED' as const,
        denialCode: { not: null },
      }),
      _count: true,
      _sum: {
        billedAmount: true,
      },
    });

    // Get count of claims with approaching deadlines
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

    const urgentCount = await db.insuranceClaim.count({
      where: withSoftDelete({
        ...getClinicFilter(session),
        status: 'DENIED' as const,
        appealDeadline: {
          gte: new Date(),
          lte: fourteenDaysFromNow,
        },
      }),
    });

    return NextResponse.json({
      success: true,
      data: {
        items: denials,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          urgentCount,
          denialCodeCounts: denialCodeCounts
            .filter(d => d.denialCode)
            .map(d => ({
              code: d.denialCode,
              count: d._count,
              totalAmount: d._sum.billedAmount || 0,
            })),
        },
      },
    });
  },
  { permissions: ['insurance:read'] }
);
