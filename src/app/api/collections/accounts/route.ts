import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { accountCollectionQuerySchema } from '@/lib/validations/collections';

/**
 * GET /api/collections/accounts
 * List accounts in collection workflow
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      workflowId: searchParams.get('workflowId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      minBalance: searchParams.get('minBalance') ?? undefined,
      maxBalance: searchParams.get('maxBalance') ?? undefined,
      currentStage: searchParams.get('currentStage') ?? undefined,
      hasPromise: searchParams.get('hasPromise') ?? undefined,
      atAgency: searchParams.get('atAgency') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = accountCollectionQuerySchema.safeParse(rawParams);

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
      workflowId,
      status,
      minBalance,
      maxBalance,
      currentStage,
      hasPromise,
      atAgency,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = getClinicFilter(session);

    if (workflowId) where.workflowId = workflowId;
    if (status) where.status = status;
    if (currentStage) where.currentStage = currentStage;

    if (atAgency) {
      where.status = 'AGENCY';
    }

    if (minBalance !== undefined || maxBalance !== undefined) {
      where.currentBalance = {};
      if (minBalance !== undefined) (where.currentBalance as Record<string, unknown>).gte = minBalance;
      if (maxBalance !== undefined) (where.currentBalance as Record<string, unknown>).lte = maxBalance;
    }

    if (hasPromise) {
      where.promises = {
        some: { status: 'PENDING' },
      };
    }

    // Search by account number or patient name
    if (search) {
      where.account = {
        OR: [
          { accountNumber: { contains: search, mode: 'insensitive' } },
          { patient: { firstName: { contains: search, mode: 'insensitive' } } },
          { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        ],
      };
    }

    // Get total count
    const total = await db.accountCollection.count({ where });

    // Get paginated results
    const accounts = await db.accountCollection.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        account: {
          select: {
            id: true,
            accountNumber: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        workflow: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            activities: true,
            promises: true,
          },
        },
      },
    });

    // Get status counts for summary
    const statusCounts = await db.accountCollection.groupBy({
      by: ['status'],
      where: getClinicFilter(session),
      _count: true,
      _sum: {
        currentBalance: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: accounts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        summary: {
          statusCounts: statusCounts.reduce((acc, item) => {
            acc[item.status] = {
              count: item._count,
              balance: item._sum.currentBalance || 0,
            };
            return acc;
          }, {} as Record<string, { count: number; balance: number }>),
        },
      },
    });
  },
  { permissions: ['collections:read'] }
);
