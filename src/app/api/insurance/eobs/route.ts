import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createEOBSchema,
  eobQuerySchema,
} from '@/lib/validations/insurance';

/**
 * GET /api/insurance/eobs
 * List EOBs with pagination and filters
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      claimId: searchParams.get('claimId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      receiptMethod: searchParams.get('receiptMethod') ?? undefined,
      needsReview: searchParams.get('needsReview') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = eobQuerySchema.safeParse(rawParams);

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
      claimId,
      status,
      receiptMethod,
      needsReview,
      fromDate,
      toDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = getClinicFilter(session);

    if (claimId) where.claimId = claimId;
    if (status) where.status = status;
    if (receiptMethod) where.receiptMethod = receiptMethod;
    if (needsReview !== undefined) where.needsReview = needsReview;

    // Date range filter
    if (fromDate || toDate) {
      where.receivedDate = {};
      if (fromDate) (where.receivedDate as Record<string, unknown>).gte = fromDate;
      if (toDate) (where.receivedDate as Record<string, unknown>).lte = toDate;
    }

    // Get total count
    const total = await db.eOB.count({ where });

    // Get paginated results
    const eobs = await db.eOB.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        claim: {
          select: {
            id: true,
            claimNumber: true,
            billedAmount: true,
            status: true,
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
              },
            },
          },
        },
        _count: {
          select: {
            payments: true,
          },
        },
      },
    });

    // Get status counts
    const statusCounts = await db.eOB.groupBy({
      by: ['status'],
      where: getClinicFilter(session),
      _count: true,
      _sum: {
        totalPaid: true,
      },
    });

    // Get count needing review
    const needsReviewCount = await db.eOB.count({
      where: {
        ...getClinicFilter(session),
        needsReview: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: eobs,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          needsReviewCount,
          statusCounts: statusCounts.reduce((acc, item) => {
            acc[item.status] = {
              count: item._count,
              totalPaid: item._sum.totalPaid || 0,
            };
            return acc;
          }, {} as Record<string, { count: number; totalPaid: number }>),
        },
      },
    });
  },
  { permissions: ['insurance:read'] }
);

/**
 * POST /api/insurance/eobs
 * Create a new EOB record (manual entry)
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createEOBSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid EOB data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify claim exists if provided
    if (data.claimId) {
      const claim = await db.insuranceClaim.findFirst({
        where: {
          id: data.claimId,
          clinicId: session.user.clinicId,
        },
      });

      if (!claim) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CLAIM_NOT_FOUND',
              message: 'Claim not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Create the EOB
    const eob = await db.eOB.create({
      data: {
        clinicId: session.user.clinicId,
        claimId: data.claimId,
        eobNumber: data.eobNumber,
        checkNumber: data.checkNumber,
        eftNumber: data.eftNumber,
        receivedDate: data.receivedDate,
        receiptMethod: data.receiptMethod,
        documentUrl: data.documentUrl,
        rawData: data.rawData as never,
        totalPaid: data.totalPaid,
        totalAdjusted: data.totalAdjusted,
        patientResponsibility: data.patientResponsibility,
        status: 'PENDING',
      },
      include: {
        claim: {
          select: {
            id: true,
            claimNumber: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'EOB',
      entityId: eob.id,
      details: {
        claimId: data.claimId,
        receiptMethod: data.receiptMethod,
        totalPaid: data.totalPaid,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: eob },
      { status: 201 }
    );
  },
  { permissions: ['insurance:create'] }
);
