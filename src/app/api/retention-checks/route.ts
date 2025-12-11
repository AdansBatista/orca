import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { retentionCheckQuerySchema } from '@/lib/validations/treatment';

/**
 * GET /api/retention-checks
 * List retention checks across all protocols with filtering
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse and validate query parameters
    const rawParams = {
      retentionProtocolId: searchParams.get('retentionProtocolId') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = retentionCheckQuerySchema.safeParse(rawParams);

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
      retentionProtocolId,
      patientId,
      fromDate,
      toDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with clinic filter
    const where: Record<string, unknown> = getClinicFilter(session);

    // Apply filters
    if (retentionProtocolId) where.retentionProtocolId = retentionProtocolId;
    if (patientId) where.patientId = patientId;

    if (fromDate) {
      where.checkDate = { ...((where.checkDate as object) || {}), gte: fromDate };
    }
    if (toDate) {
      where.checkDate = { ...((where.checkDate as object) || {}), lte: toDate };
    }

    // Get total count
    const total = await db.retentionCheck.count({ where });

    // Get paginated results
    const items = await db.retentionCheck.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        retentionProtocol: {
          select: {
            id: true,
            currentPhase: true,
            wearSchedule: true,
            treatmentPlan: {
              select: {
                id: true,
                planNumber: true,
              },
            },
          },
        },
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['treatment:read'] }
);
