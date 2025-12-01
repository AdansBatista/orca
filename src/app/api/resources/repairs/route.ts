import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { repairQuerySchema } from '@/lib/validations/equipment';

/**
 * GET /api/resources/repairs
 * Get all repairs across all equipment
 * Supports filtering for active repairs
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      equipmentId: searchParams.get('equipmentId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      severity: searchParams.get('severity') ?? undefined,
      vendorId: searchParams.get('vendorId') ?? undefined,
      coveredByWarranty: searchParams.get('coveredByWarranty') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      activeOnly: searchParams.get('activeOnly') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = repairQuerySchema.safeParse(rawParams);

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
      equipmentId,
      status,
      severity,
      vendorId,
      coveredByWarranty,
      dateFrom,
      dateTo,
      activeOnly,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      clinicId: session.user.clinicId,
    };

    if (equipmentId) where.equipmentId = equipmentId;
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (vendorId) where.vendorId = vendorId;
    if (coveredByWarranty !== undefined) where.coveredByWarranty = coveredByWarranty;

    // Filter for active (non-completed) repairs
    if (activeOnly) {
      where.status = {
        notIn: ['COMPLETED', 'CANNOT_REPAIR', 'CANCELLED'],
      };
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.reportedDate = {};
      if (dateFrom) (where.reportedDate as Record<string, Date>).gte = dateFrom;
      if (dateTo) (where.reportedDate as Record<string, Date>).lte = dateTo;
    }

    // Get total count
    const total = await db.repairRecord.count({ where });

    // Get paginated results
    const items = await db.repairRecord.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            equipmentNumber: true,
            category: true,
            status: true,
            roomId: true,
          },
        },
        vendor: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Get summary statistics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      activeCount,
      criticalCount,
      completedThisMonth,
      totalCostThisMonth,
    ] = await Promise.all([
      db.repairRecord.count({
        where: {
          clinicId: session.user.clinicId,
          status: { notIn: ['COMPLETED', 'CANNOT_REPAIR', 'CANCELLED'] },
        },
      }),
      db.repairRecord.count({
        where: {
          clinicId: session.user.clinicId,
          severity: 'CRITICAL',
          status: { notIn: ['COMPLETED', 'CANNOT_REPAIR', 'CANCELLED'] },
        },
      }),
      db.repairRecord.count({
        where: {
          clinicId: session.user.clinicId,
          status: 'COMPLETED',
          completedDate: { gte: thirtyDaysAgo },
        },
      }),
      db.repairRecord.aggregate({
        where: {
          clinicId: session.user.clinicId,
          status: 'COMPLETED',
          completedDate: { gte: thirtyDaysAgo },
        },
        _sum: { totalCost: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        summary: {
          activeCount,
          criticalCount,
          completedThisMonth,
          totalCostThisMonth: totalCostThisMonth._sum.totalCost ?? 0,
        },
      },
    });
  },
  { permissions: ['equipment:read'] }
);
