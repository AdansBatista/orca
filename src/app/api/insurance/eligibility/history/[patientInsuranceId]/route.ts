import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { eligibilityCheckQuerySchema } from '@/lib/validations/insurance';

interface RouteContext {
  params: Promise<{ patientInsuranceId: string }>;
}

/**
 * GET /api/insurance/eligibility/history/[patientInsuranceId]
 * Get eligibility check history for a patient insurance
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session, context: RouteContext) => {
    const { patientInsuranceId } = await context.params;
    const { searchParams } = new URL(req.url);

    // Verify patient insurance exists
    const patientInsurance = await db.patientInsurance.findFirst({
      where: withSoftDelete({
        id: patientInsuranceId,
        clinicId: session.user.clinicId,
      }),
      include: {
        company: {
          select: {
            id: true,
            name: true,
            payerId: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!patientInsurance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Patient insurance not found',
          },
        },
        { status: 404 }
      );
    }

    // Parse query parameters
    const rawParams = {
      patientInsuranceId,
      status: searchParams.get('status') ?? undefined,
      isEligible: searchParams.get('isEligible') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = eligibilityCheckQuerySchema.safeParse(rawParams);

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
      status,
      isEligible,
      fromDate,
      toDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
      patientInsuranceId,
    };

    if (status) where.status = status;
    if (isEligible !== undefined) where.isEligible = isEligible;

    // Date range filter
    if (fromDate || toDate) {
      where.checkDate = {};
      if (fromDate) (where.checkDate as Record<string, unknown>).gte = fromDate;
      if (toDate) (where.checkDate as Record<string, unknown>).lte = toDate;
    }

    // Get total count
    const total = await db.eligibilityCheck.count({ where });

    // Get paginated results
    const checks = await db.eligibilityCheck.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Get summary stats
    const stats = await db.eligibilityCheck.groupBy({
      by: ['status'],
      where: {
        ...getClinicFilter(session),
        patientInsuranceId,
      },
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        insurance: {
          id: patientInsurance.id,
          priority: patientInsurance.priority,
          subscriberId: patientInsurance.subscriberId,
          verificationStatus: patientInsurance.verificationStatus,
          lastVerified: patientInsurance.lastVerified,
          company: patientInsurance.company,
          patient: patientInsurance.patient,
        },
        checks: {
          items: checks,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
        stats: {
          statusCounts: stats.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
          }, {} as Record<string, number>),
        },
      },
    });
  },
  { permissions: ['insurance:read'] }
);
