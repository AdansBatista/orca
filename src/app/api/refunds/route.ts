import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { refundQuerySchema } from '@/lib/validations/billing';

/**
 * GET /api/refunds
 * List refunds with pagination and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      paymentId: searchParams.get('paymentId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      refundType: searchParams.get('refundType') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = refundQuerySchema.safeParse(rawParams);

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
      paymentId,
      status,
      refundType,
      dateFrom,
      dateTo,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (paymentId) where.paymentId = paymentId;
    if (status) where.status = status;
    if (refundType) where.refundType = refundType;

    // Date range filters
    if (dateFrom || dateTo) {
      where.requestedAt = {};
      if (dateFrom) (where.requestedAt as Record<string, unknown>).gte = dateFrom;
      if (dateTo) (where.requestedAt as Record<string, unknown>).lte = dateTo;
    }

    // Search
    if (search) {
      where.OR = [
        { refundNumber: { contains: search, mode: 'insensitive' } },
        { payment: { paymentNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await db.refund.count({ where });

    // Get paginated results
    const refunds = await db.refund.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        payment: {
          select: {
            id: true,
            paymentNumber: true,
            amount: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        requestedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        approvedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        processedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Calculate stats
    const pendingCount = await db.refund.count({
      where: {
        ...withSoftDelete(getClinicFilter(session)),
        status: 'PENDING',
      },
    });

    const todayRefunds = await db.refund.aggregate({
      where: {
        ...withSoftDelete(getClinicFilter(session)),
        processedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        status: 'COMPLETED',
      },
      _count: true,
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: refunds,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          pendingApproval: pendingCount,
          todayCount: todayRefunds._count,
          todayAmount: todayRefunds._sum.amount || 0,
        },
      },
    });
  },
  { permissions: ['payment:read'] }
);
