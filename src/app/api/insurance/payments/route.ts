import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { insurancePaymentQuerySchema } from '@/lib/validations/insurance';

/**
 * GET /api/insurance/payments
 * List insurance payments with pagination and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      eobId: searchParams.get('eobId') ?? undefined,
      claimId: searchParams.get('claimId') ?? undefined,
      accountId: searchParams.get('accountId') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      posted: searchParams.get('posted') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = insurancePaymentQuerySchema.safeParse(rawParams);

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
      eobId,
      claimId,
      accountId,
      fromDate,
      toDate,
      posted,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = getClinicFilter(session);

    if (eobId) where.eobId = eobId;
    if (claimId) where.claimId = claimId;
    if (accountId) where.accountId = accountId;

    // Date range filter
    if (fromDate || toDate) {
      where.paymentDate = {};
      if (fromDate) (where.paymentDate as Record<string, unknown>).gte = fromDate;
      if (toDate) (where.paymentDate as Record<string, unknown>).lte = toDate;
    }

    // Posted filter
    if (posted === true) {
      where.postedAt = { not: null };
    } else if (posted === false) {
      where.postedAt = null;
    }

    // Get total count
    const total = await db.insurancePayment.count({ where });

    // Get paginated results
    const payments = await db.insurancePayment.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        eob: {
          select: {
            id: true,
            eobNumber: true,
            checkNumber: true,
            receivedDate: true,
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
                insuranceCompany: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get summary statistics
    const stats = await db.insurancePayment.aggregate({
      where: getClinicFilter(session),
      _sum: {
        amount: true,
        adjustmentAmount: true,
      },
      _count: true,
    });

    // Get monthly totals for the current year
    const currentYear = new Date().getFullYear();
    const monthlyPayments = await db.insurancePayment.groupBy({
      by: ['paymentDate'],
      where: {
        ...getClinicFilter(session),
        paymentDate: {
          gte: new Date(`${currentYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`),
        },
      },
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: payments,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          totalPayments: stats._count,
          totalAmount: stats._sum.amount || 0,
          totalAdjustments: stats._sum.adjustmentAmount || 0,
        },
      },
    });
  },
  { permissions: ['insurance:read'] }
);
