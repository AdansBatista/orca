import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { packageUsageQuerySchema } from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/usage
 * List all package usages with filters (for reports and patient history)
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      packageId: searchParams.get('packageId') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      appointmentId: searchParams.get('appointmentId') ?? undefined,
      usedById: searchParams.get('usedById') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = packageUsageQuerySchema.safeParse(rawParams);

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
      packageId,
      patientId,
      appointmentId,
      usedById,
      startDate,
      endDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (packageId) where.packageId = packageId;
    if (patientId) where.patientId = patientId;
    if (appointmentId) where.appointmentId = appointmentId;
    if (usedById) where.usedById = usedById;

    // Date range filter
    if (startDate || endDate) {
      where.usedAt = {};
      if (startDate) (where.usedAt as Record<string, unknown>).gte = startDate;
      if (endDate) (where.usedAt as Record<string, unknown>).lte = endDate;
    }

    const total = await db.packageUsage.count({ where });

    const usages = await db.packageUsage.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        package: {
          select: {
            id: true,
            packageNumber: true,
            packageType: true,
            instrumentNames: true,
            sterilizedDate: true,
            cycle: {
              select: {
                id: true,
                cycleNumber: true,
                cycleType: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: usages,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['sterilization:read'] }
);
