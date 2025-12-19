import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { maintenanceQuerySchema } from '@/lib/validations/equipment';

/**
 * GET /api/resources/maintenance
 * Get maintenance schedule across all equipment
 * Supports filtering for overdue and upcoming maintenance
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      equipmentId: searchParams.get('equipmentId') ?? undefined,
      maintenanceType: searchParams.get('maintenanceType') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      vendorId: searchParams.get('vendorId') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      overdue: searchParams.get('overdue') ?? undefined,
      upcoming: searchParams.get('upcoming') ?? undefined,
      upcomingDays: searchParams.get('upcomingDays') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = maintenanceQuerySchema.safeParse(rawParams);

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
      maintenanceType,
      status,
      vendorId,
      dateFrom,
      dateTo,
      overdue,
      upcoming,
      upcomingDays,
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
    if (maintenanceType) where.maintenanceType = maintenanceType;
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;

    const now = new Date();

    // Filter for overdue maintenance
    if (overdue) {
      where.status = { in: ['SCHEDULED', 'IN_PROGRESS'] };
      where.scheduledDate = { lt: now };
    }

    // Filter for upcoming maintenance
    if (upcoming) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + upcomingDays);
      where.status = { in: ['SCHEDULED'] };
      where.scheduledDate = {
        gte: now,
        lte: futureDate,
      };
    }

    // Date range filter (only if not using overdue/upcoming)
    if (!overdue && !upcoming && (dateFrom || dateTo)) {
      where.scheduledDate = {};
      if (dateFrom) (where.scheduledDate as Record<string, Date>).gte = dateFrom;
      if (dateTo) (where.scheduledDate as Record<string, Date>).lte = dateTo;
    }

    // Get total count
    const total = await db.maintenanceRecord.count({ where });

    // Get paginated results
    const items = await db.maintenanceRecord.findMany({
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
    const [overdueCount, upcomingCount, completedThisMonth] = await Promise.all([
      db.maintenanceRecord.count({
        where: {
          clinicId: session.user.clinicId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          scheduledDate: { lt: now },
        },
      }),
      db.maintenanceRecord.count({
        where: {
          clinicId: session.user.clinicId,
          status: 'SCHEDULED',
          scheduledDate: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        },
      }),
      db.maintenanceRecord.count({
        where: {
          clinicId: session.user.clinicId,
          status: 'COMPLETED',
          completedDate: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
          },
        },
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
          overdueCount,
          upcomingCount,
          completedThisMonth,
        },
      },
    });
  },
  { permissions: ['equipment:read'] }
);
