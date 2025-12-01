import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createBiologicalIndicatorSchema,
  biologicalIndicatorQuerySchema,
} from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/biological-indicators
 * List biological indicator tests with pagination and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      cycleId: searchParams.get('cycleId') ?? undefined,
      result: searchParams.get('result') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      lotNumber: searchParams.get('lotNumber') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = biologicalIndicatorQuerySchema.safeParse(rawParams);

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
      cycleId,
      result,
      startDate,
      endDate,
      lotNumber,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (cycleId) where.cycleId = cycleId;
    if (result) where.result = result;
    if (lotNumber) where.lotNumber = { contains: lotNumber, mode: 'insensitive' };

    // Date range filter
    if (startDate || endDate) {
      where.testDate = {};
      if (startDate) (where.testDate as Record<string, unknown>).gte = startDate;
      if (endDate) (where.testDate as Record<string, unknown>).lte = endDate;
    }

    // Get total count
    const total = await db.biologicalIndicator.count({ where });

    // Get paginated results
    const items = await db.biologicalIndicator.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        cycle: {
          select: {
            cycleNumber: true,
            cycleType: true,
            status: true,
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
  { permissions: ['sterilization:read'] }
);

/**
 * POST /api/resources/sterilization/biological-indicators
 * Create a new biological indicator test record
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createBiologicalIndicatorSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid biological indicator data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // If cycleId provided, verify it exists and belongs to this clinic
    if (data.cycleId) {
      const cycle = await db.sterilizationCycle.findFirst({
        where: {
          id: data.cycleId,
          clinicId: session.user.clinicId,
        },
      });

      if (!cycle) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CYCLE_NOT_FOUND',
              message: 'Sterilization cycle not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Create the biological indicator record
    const indicator = await db.biologicalIndicator.create({
      data: {
        clinicId: session.user.clinicId,
        cycleId: data.cycleId,
        lotNumber: data.lotNumber,
        brand: data.brand,
        testDate: data.testDate,
        readDate: data.readDate,
        incubationHours: data.incubationHours,
        result: data.result,
        controlPassed: data.controlPassed,
        readerType: data.readerType,
        readerId: data.readerId,
        performedById: session.user.id,
        notes: data.notes,
      },
      include: {
        cycle: {
          select: {
            cycleNumber: true,
            cycleType: true,
            status: true,
          },
        },
      },
    });

    // If result is not pending and has a cycle, update the cycle's biological pass
    if (data.result !== 'PENDING' && data.cycleId) {
      await db.sterilizationCycle.update({
        where: { id: data.cycleId },
        data: {
          biologicalPass: data.result === 'PASSED',
          updatedBy: session.user.id,
        },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'BiologicalIndicator',
      entityId: indicator.id,
      details: {
        lotNumber: indicator.lotNumber,
        cycleId: indicator.cycleId,
        result: indicator.result,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: indicator }, { status: 201 });
  },
  { permissions: ['sterilization:create'] }
);
