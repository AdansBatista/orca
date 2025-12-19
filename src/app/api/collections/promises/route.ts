import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { paymentPromiseQuerySchema } from '@/lib/validations/collections';

/**
 * GET /api/collections/promises
 * List payment promises
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      accountId: searchParams.get('accountId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      dueToday: searchParams.get('dueToday') ?? undefined,
      overdue: searchParams.get('overdue') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = paymentPromiseQuerySchema.safeParse(rawParams);

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
      accountId,
      status,
      dueToday,
      overdue,
      fromDate,
      toDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause - join through accountCollection to filter by clinic
    const where: Record<string, unknown> = {
      accountCollection: getClinicFilter(session),
    };

    if (accountId) where.accountId = accountId;
    if (status) where.status = status;

    // Date filters
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dueToday) {
      where.status = 'PENDING';
      where.promisedDate = {
        gte: today,
        lt: tomorrow,
      };
    }

    if (overdue) {
      where.status = 'PENDING';
      where.promisedDate = { lt: today };
    }

    if (fromDate || toDate) {
      where.promisedDate = {};
      if (fromDate) (where.promisedDate as Record<string, unknown>).gte = fromDate;
      if (toDate) (where.promisedDate as Record<string, unknown>).lte = toDate;
    }

    // Get total count
    const total = await db.paymentPromise.count({ where });

    // Get paginated results
    const promises = await db.paymentPromise.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        accountCollection: {
          select: {
            id: true,
            currentBalance: true,
            account: {
              select: {
                id: true,
                accountNumber: true,
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
        },
      },
    });

    // Get summary statistics
    const [pendingCount, overdueCount, fulfilledCount] = await Promise.all([
      db.paymentPromise.count({
        where: { accountCollection: getClinicFilter(session), status: 'PENDING' },
      }),
      db.paymentPromise.count({
        where: {
          accountCollection: getClinicFilter(session),
          status: 'PENDING',
          promisedDate: { lt: today },
        },
      }),
      db.paymentPromise.count({
        where: { accountCollection: getClinicFilter(session), status: 'FULFILLED' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: promises,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        summary: {
          pending: pendingCount,
          overdue: overdueCount,
          fulfilled: fulfilledCount,
        },
      },
    });
  },
  { permissions: ['collections:read'] }
);
