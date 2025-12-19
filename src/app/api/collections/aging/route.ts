import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { agingReportQuerySchema } from '@/lib/validations/collections';
import {
  calculateAgingSummary,
} from '@/lib/billing/collections-utils';

/**
 * GET /api/collections/aging
 * Get aging report with account details
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      arType: searchParams.get('arType') ?? undefined,
      includeZeroBalance: searchParams.get('includeZeroBalance') ?? undefined,
      minBalance: searchParams.get('minBalance') ?? undefined,
      groupBy: searchParams.get('groupBy') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = agingReportQuerySchema.safeParse(rawParams);

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
      arType,
      includeZeroBalance,
      minBalance,
      page,
      pageSize,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    // Balance filter
    if (!includeZeroBalance) {
      where.currentBalance = { gt: 0 };
    }
    if (minBalance !== undefined) {
      where.currentBalance = { gte: minBalance };
    }

    // Get total count
    const total = await db.patientAccount.count({ where });

    // Get paginated accounts with aging
    const accounts = await db.patientAccount.findMany({
      where,
      orderBy: { currentBalance: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        accountNumber: true,
        currentBalance: true,
        patientBalance: true,
        insuranceBalance: true,
        aging30: true,
        aging60: true,
        aging90: true,
        aging120Plus: true,
        status: true,
        createdAt: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Calculate aging bucket for each account based on aging amounts
    const accountsWithAging = accounts.map(account => {
      // Determine primary aging bucket based on where the balance sits
      let agingBucket: 'current' | '1-30' | '31-60' | '61-90' | '90+' = 'current';
      let daysOverdue = 0;

      if (account.aging120Plus > 0) {
        agingBucket = '90+';
        daysOverdue = 120;
      } else if (account.aging90 > 0) {
        agingBucket = '61-90';
        daysOverdue = 90;
      } else if (account.aging60 > 0) {
        agingBucket = '31-60';
        daysOverdue = 60;
      } else if (account.aging30 > 0) {
        agingBucket = '1-30';
        daysOverdue = 30;
      }

      // Filter by AR type if specified
      let balance = account.currentBalance;
      if (arType === 'PATIENT') {
        balance = account.patientBalance || 0;
      } else if (arType === 'INSURANCE') {
        balance = account.insuranceBalance || 0;
      }

      return {
        ...account,
        daysOverdue,
        agingBucket,
        relevantBalance: balance,
      };
    });

    // Get summary statistics
    const summary = await calculateAgingSummary(
      session.user.clinicId,
      includeZeroBalance
    );

    return NextResponse.json({
      success: true,
      data: {
        items: accountsWithAging,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        summary,
      },
    });
  },
  { permissions: ['collections:read'] }
);
