import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/settlements
 * List payment settlements with pagination and filters
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const status = searchParams.get('status');

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (status && status !== 'all') {
      where.status = status;
    }

    // Date range filters
    if (dateFrom || dateTo) {
      where.settlementDate = {};
      if (dateFrom) (where.settlementDate as Record<string, unknown>).gte = new Date(dateFrom);
      if (dateTo) (where.settlementDate as Record<string, unknown>).lte = new Date(dateTo);
    }

    // Get total count
    const total = await db.paymentSettlement.count({ where });

    // Get paginated results
    const settlements = await db.paymentSettlement.findMany({
      where,
      orderBy: { settlementDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Calculate summary stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySettlements = await db.paymentSettlement.aggregate({
      where: {
        ...getClinicFilter(session),
        settlementDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        grossAmount: true,
        feeAmount: true,
        netAmount: true,
      },
      _count: true,
    });

    // Get this week's stats
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());

    const weekSettlements = await db.paymentSettlement.aggregate({
      where: {
        ...getClinicFilter(session),
        settlementDate: {
          gte: weekStart,
        },
      },
      _sum: {
        grossAmount: true,
        feeAmount: true,
        netAmount: true,
      },
      _count: true,
    });

    // Get pending settlements (not yet deposited)
    const pendingCount = await db.paymentSettlement.count({
      where: {
        ...getClinicFilter(session),
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: settlements,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          today: {
            count: todaySettlements._count,
            gross: todaySettlements._sum.grossAmount || 0,
            feeAmount: todaySettlements._sum.feeAmount || 0,
            net: todaySettlements._sum.netAmount || 0,
          },
          week: {
            count: weekSettlements._count,
            gross: weekSettlements._sum.grossAmount || 0,
            feeAmount: weekSettlements._sum.feeAmount || 0,
            net: weekSettlements._sum.netAmount || 0,
          },
          pending: pendingCount,
        },
      },
    });
  },
  { permissions: ['payment:reconcile'] }
);

/**
 * POST /api/settlements
 * Create a settlement record (typically from webhook or manual reconciliation)
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const {
      settlementDate,
      grossAmount,
      feeAmount,
      netAmount,
      gateway,
    } = body;

    // Generate settlement ID
    const date = new Date();
    const year = date.getFullYear();
    const count = await db.paymentSettlement.count({
      where: {
        clinicId: session.user.clinicId,
        settlementId: { startsWith: `STL-${year}` },
      },
    });
    const settlementId = `STL-${year}-${String(count + 1).padStart(5, '0')}`;

    const settlement = await db.paymentSettlement.create({
      data: {
        clinicId: session.user.clinicId,
        settlementId,
        settlementDate: new Date(settlementDate),
        gateway: gateway || 'STRIPE',
        grossAmount,
        feeAmount: feeAmount || 0,
        netAmount: netAmount || grossAmount - (feeAmount || 0),
        status: 'PENDING',
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: settlement,
      },
      { status: 201 }
    );
  },
  { permissions: ['payment:reconcile'] }
);
