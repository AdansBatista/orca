import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createValidationScheduleSchema,
  validationScheduleQuerySchema,
} from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/validations/schedules
 * List validation schedules with filtering and pagination
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      equipmentId: searchParams.get('equipmentId') ?? undefined,
      validationType: searchParams.get('validationType') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      overdue: searchParams.get('overdue') ?? undefined,
      dueSoon: searchParams.get('dueSoon') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = validationScheduleQuerySchema.safeParse(rawParams);

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
      validationType,
      isActive,
      overdue,
      dueSoon,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    const clinicFilter = getClinicFilter(session);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Build where clause
    const where: Record<string, unknown> = { ...clinicFilter };

    if (equipmentId) where.equipmentId = equipmentId;
    if (validationType) where.validationType = validationType;
    if (isActive !== undefined) where.isActive = isActive;

    // Overdue filter - nextDue is in the past
    if (overdue) {
      where.nextDue = { lt: now };
      where.isActive = true;
    }

    // Due soon filter - nextDue is within 30 days
    if (dueSoon) {
      where.nextDue = { gte: now, lte: thirtyDaysFromNow };
      where.isActive = true;
    }

    // Get total count
    const total = await db.validationSchedule.count({ where });

    // Get paginated results
    const items = await db.validationSchedule.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Get equipment names for display
    const equipmentIds = [...new Set(items.map((s) => s.equipmentId))];
    const equipment = await db.equipment.findMany({
      where: { id: { in: equipmentIds } },
      select: { id: true, name: true, equipmentNumber: true },
    });
    const equipmentMap = new Map(equipment.map((e) => [e.id, e]));

    // Attach equipment info and calculate status
    const itemsWithDetails = items.map((item) => {
      let status = 'on_track';
      if (item.nextDue) {
        if (item.nextDue < now) {
          status = 'overdue';
        } else if (item.nextDue <= thirtyDaysFromNow) {
          status = 'due_soon';
        }
      }

      return {
        ...item,
        equipment: equipmentMap.get(item.equipmentId) || null,
        status,
        daysUntilDue: item.nextDue
          ? Math.ceil((item.nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: itemsWithDetails,
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
 * POST /api/resources/sterilization/validations/schedules
 * Create a new validation schedule
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createValidationScheduleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid schedule data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify equipment exists and is sterilization equipment
    const equipment = await db.equipment.findFirst({
      where: {
        id: data.equipmentId,
        clinicId: session.user.clinicId,
        deletedAt: null,
        category: 'STERILIZATION',
      },
    });

    if (!equipment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EQUIPMENT_NOT_FOUND',
            message: 'Sterilization equipment not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if schedule already exists for this equipment/type combo
    const existing = await db.validationSchedule.findUnique({
      where: {
        equipmentId_validationType: {
          equipmentId: data.equipmentId,
          validationType: data.validationType,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SCHEDULE_EXISTS',
            message: 'A schedule already exists for this equipment and validation type',
          },
        },
        { status: 409 }
      );
    }

    // Calculate next due date if not provided
    let nextDue = data.nextDue;
    if (!nextDue && data.lastPerformed) {
      nextDue = new Date(data.lastPerformed);
      nextDue.setDate(nextDue.getDate() + data.frequencyDays);
    } else if (!nextDue) {
      // If no last performed date, set next due to today
      nextDue = new Date();
    }

    // Create the schedule
    const schedule = await db.validationSchedule.create({
      data: {
        clinicId: session.user.clinicId,
        equipmentId: data.equipmentId,
        validationType: data.validationType,
        frequencyDays: data.frequencyDays,
        isActive: data.isActive ?? true,
        lastPerformed: data.lastPerformed,
        nextDue,
        reminderDays: data.reminderDays ?? 30,
        notes: data.notes,
        createdBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ValidationSchedule',
      entityId: schedule.id,
      details: {
        validationType: schedule.validationType,
        frequencyDays: schedule.frequencyDays,
        equipmentId: schedule.equipmentId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: schedule }, { status: 201 });
  },
  { permissions: ['sterilization:create'] }
);
