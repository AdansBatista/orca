import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { refundQuerySchema } from '@/lib/validations/billing';

/**
 * GET /api/refunds
 * List refunds with pagination and filters
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      paymentId: searchParams.get('paymentId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      reason: searchParams.get('reason') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
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
      paymentId,
      status,
      reason,
      fromDate,
      toDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause (Refund has no soft delete)
    const where: Record<string, unknown> = getClinicFilter(session);

    if (paymentId) where.paymentId = paymentId;
    if (status) where.status = status;
    if (reason) where.reason = reason;

    // Date range filters on createdAt
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) (where.createdAt as Record<string, unknown>).gte = fromDate;
      if (toDate) (where.createdAt as Record<string, unknown>).lte = toDate;
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
      },
    });

    // Calculate stats
    const pendingCount = await db.refund.count({
      where: {
        ...getClinicFilter(session),
        status: 'PENDING',
      },
    });

    const todayRefunds = await db.refund.aggregate({
      where: {
        ...getClinicFilter(session),
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
