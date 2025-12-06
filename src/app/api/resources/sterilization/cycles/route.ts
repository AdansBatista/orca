import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete } from '@/lib/db/soft-delete';
import {
  createSterilizationCycleSchema,
  sterilizationCycleQuerySchema,
} from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/cycles
 * List sterilization cycles with pagination, search, and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      equipmentId: searchParams.get('equipmentId') ?? undefined,
      cycleType: searchParams.get('cycleType') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      operatorId: searchParams.get('operatorId') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = sterilizationCycleQuerySchema.safeParse(rawParams);

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
      equipmentId,
      cycleType,
      status,
      operatorId,
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

    if (equipmentId) where.equipmentId = equipmentId;
    if (cycleType) where.cycleType = cycleType;
    if (status) where.status = status;
    if (operatorId) where.operatorId = operatorId;

    // Date range filter
    if (startDate || endDate) {
      where.startTime = {};
      if (startDate) (where.startTime as Record<string, unknown>).gte = startDate;
      if (endDate) (where.startTime as Record<string, unknown>).lte = endDate;
    }

    // Search across cycle number
    if (search) {
      where.OR = [
        { cycleNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.sterilizationCycle.count({ where });

    // Get paginated results
    const items = await db.sterilizationCycle.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: {
            loads: true,
            biologicalIndicators: true,
            chemicalIndicators: true,
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
 * POST /api/resources/sterilization/cycles
 * Create a new sterilization cycle
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createSterilizationCycleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid sterilization cycle data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify equipment exists and belongs to this clinic
    const equipment = await db.equipment.findFirst({
      where: withSoftDelete({
        id: data.equipmentId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!equipment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EQUIPMENT_NOT_FOUND',
            message: 'Equipment not found',
          },
        },
        { status: 404 }
      );
    }

    // Generate cycle number
    const year = new Date().getFullYear();
    const latestCycle = await db.sterilizationCycle.findFirst({
      where: {
        clinicId: session.user.clinicId,
        cycleNumber: { startsWith: `CYC-${year}-` },
      },
      orderBy: { cycleNumber: 'desc' },
    });

    let nextNum = 1;
    if (latestCycle) {
      const match = latestCycle.cycleNumber.match(/CYC-\d{4}-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const cycleNumber = `CYC-${year}-${String(nextNum).padStart(4, '0')}`;

    // Create the cycle
    const cycle = await db.sterilizationCycle.create({
      data: {
        clinicId: session.user.clinicId,
        cycleNumber,
        equipmentId: data.equipmentId,
        cycleType: data.cycleType,
        startTime: data.startTime,
        endTime: data.endTime,
        temperature: data.temperature,
        pressure: data.pressure,
        exposureTime: data.exposureTime,
        dryingTime: data.dryingTime,
        status: data.status,
        mechanicalPass: data.mechanicalPass,
        chemicalPass: data.chemicalPass,
        biologicalPass: data.biologicalPass,
        operatorId: session.user.id,
        notes: data.notes,
        failureReason: data.failureReason,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        _count: {
          select: {
            loads: true,
            biologicalIndicators: true,
            chemicalIndicators: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'SterilizationCycle',
      entityId: cycle.id,
      details: {
        cycleNumber: cycle.cycleNumber,
        cycleType: cycle.cycleType,
        equipmentId: cycle.equipmentId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: cycle }, { status: 201 });
  },
  { permissions: ['sterilization:create'] }
);
