import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete, SOFT_DELETE_FILTER } from '@/lib/db/soft-delete';
import {
  createSterilizerValidationSchema,
  sterilizerValidationQuerySchema,
} from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/validations
 * List sterilizer validation records with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      equipmentId: searchParams.get('equipmentId') ?? undefined,
      validationType: searchParams.get('validationType') ?? undefined,
      result: searchParams.get('result') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      overdue: searchParams.get('overdue') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = sterilizerValidationQuerySchema.safeParse(rawParams);

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
      result,
      startDate,
      endDate,
      overdue,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const clinicFilter = getClinicFilter(session);
    const where: Record<string, unknown> = { ...clinicFilter };

    if (equipmentId) where.equipmentId = equipmentId;
    if (validationType) where.validationType = validationType;
    if (result) where.result = result;

    // Date range filter
    if (startDate || endDate) {
      where.validationDate = {};
      if (startDate) (where.validationDate as Record<string, unknown>).gte = startDate;
      if (endDate) (where.validationDate as Record<string, unknown>).lte = endDate;
    }

    // Overdue filter
    if (overdue) {
      where.nextValidationDue = { lt: new Date() };
    }

    // Get total count
    const total = await db.sterilizerValidation.count({ where });

    // Get paginated results
    const items = await db.sterilizerValidation.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Get equipment names for display
    const equipmentIds = [...new Set(items.map((v) => v.equipmentId))];
    const equipment = await db.equipment.findMany({
      where: { id: { in: equipmentIds } },
      select: { id: true, name: true, equipmentNumber: true },
    });
    const equipmentMap = new Map(equipment.map((e) => [e.id, e]));

    // Attach equipment info to items
    const itemsWithEquipment = items.map((item) => ({
      ...item,
      equipment: equipmentMap.get(item.equipmentId) || null,
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: itemsWithEquipment,
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
 * POST /api/resources/sterilization/validations
 * Create a new sterilizer validation record
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createSterilizerValidationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid validation data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify equipment exists, belongs to this clinic, and is sterilization equipment
    const equipment = await db.equipment.findFirst({
      where: {
        id: data.equipmentId,
        clinicId: session.user.clinicId,
        category: 'STERILIZATION',
        ...SOFT_DELETE_FILTER,
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

    // Create the validation record
    const validation = await db.sterilizerValidation.create({
      data: {
        clinicId: session.user.clinicId,
        equipmentId: data.equipmentId,
        validationType: data.validationType,
        validationDate: data.validationDate,
        nextValidationDue: data.nextValidationDue,
        result: data.result,
        parameters: data.parameters as Prisma.InputJsonValue | undefined,
        performedBy: data.performedBy,
        performedById: data.performedById,
        vendorName: data.vendorName,
        technicianName: data.technicianName,
        certificateNumber: data.certificateNumber,
        certificateUrl: data.certificateUrl,
        certificateExpiry: data.certificateExpiry,
        failureDetails: data.failureDetails,
        correctiveAction: data.correctiveAction,
        retestDate: data.retestDate,
        retestResult: data.retestResult,
        maintenanceRecordId: data.maintenanceRecordId,
        notes: data.notes,
        createdBy: session.user.id,
      },
    });

    // Update the validation schedule if it exists
    if (data.result === 'PASS' || data.result === 'CONDITIONAL') {
      const schedule = await db.validationSchedule.findUnique({
        where: {
          equipmentId_validationType: {
            equipmentId: data.equipmentId,
            validationType: data.validationType,
          },
        },
      });

      if (schedule) {
        const nextDue = new Date(data.validationDate);
        nextDue.setDate(nextDue.getDate() + schedule.frequencyDays);

        await db.validationSchedule.update({
          where: { id: schedule.id },
          data: {
            lastPerformed: data.validationDate,
            nextDue,
            reminderSent: false,
          },
        });
      }
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'SterilizerValidation',
      entityId: validation.id,
      details: {
        validationType: validation.validationType,
        result: validation.result,
        equipmentId: validation.equipmentId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: validation }, { status: 201 });
  },
  { permissions: ['sterilization:create'] }
);
