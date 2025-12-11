import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createApplianceRecordSchema,
  applianceRecordQuerySchema,
} from '@/lib/validations/treatment';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/appliances
 * List appliance records with filtering
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      treatmentPlanId: searchParams.get('treatmentPlanId') ?? undefined,
      applianceType: searchParams.get('applianceType') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      arch: searchParams.get('arch') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = applianceRecordQuerySchema.safeParse(rawParams);

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
      patientId,
      treatmentPlanId,
      applianceType,
      status,
      arch,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause (no soft delete on this model)
    const where: Record<string, unknown> = getClinicFilter(session);

    if (patientId) where.patientId = patientId;
    if (treatmentPlanId) where.treatmentPlanId = treatmentPlanId;
    if (applianceType) where.applianceType = applianceType;
    if (status) where.status = status;
    if (arch) where.arch = arch;

    if (search) {
      where.OR = [
        { applianceSystem: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await db.applianceRecord.count({ where });

    const items = await db.applianceRecord.findMany({
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
        treatmentPlan: {
          select: {
            id: true,
            planName: true,
          },
        },
        placedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        removedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            wireRecords: true,
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

/**
 * POST /api/appliances
 * Create a new appliance record
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createApplianceRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid appliance data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify patient exists and belongs to clinic
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        id: data.patientId,
        ...getClinicFilter(session),
      }),
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: 'Patient not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify treatment plan if provided
    if (data.treatmentPlanId) {
      const treatmentPlan = await db.treatmentPlan.findFirst({
        where: withSoftDelete({
          id: data.treatmentPlanId,
          patientId: data.patientId,
          ...getClinicFilter(session),
        }),
      });

      if (!treatmentPlan) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TREATMENT_PLAN_NOT_FOUND',
              message: 'Treatment plan not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Create the appliance record
    const appliance = await db.applianceRecord.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        treatmentPlanId: data.treatmentPlanId,
        applianceType: data.applianceType,
        applianceSystem: data.applianceSystem,
        manufacturer: data.manufacturer,
        specification: data.specification as Prisma.InputJsonValue | undefined,
        arch: data.arch,
        toothNumbers: data.toothNumbers,
        placedDate: data.placedDate,
        removedDate: data.removedDate,
        status: data.status,
        placedById: data.placedById,
        removedById: data.removedById,
        notes: data.notes,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        placedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ApplianceRecord',
      entityId: appliance.id,
      details: {
        patientId: appliance.patientId,
        applianceType: appliance.applianceType,
        arch: appliance.arch,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: appliance }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
