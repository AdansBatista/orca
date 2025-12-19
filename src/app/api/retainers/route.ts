import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createRetainerRecordSchema,
  retainerRecordQuerySchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/retainers
 * List retainer records with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      treatmentPlanId: searchParams.get('treatmentPlanId') ?? undefined,
      retainerType: searchParams.get('retainerType') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      arch: searchParams.get('arch') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = retainerRecordQuerySchema.safeParse(rawParams);

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
      retainerType,
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
    if (retainerType) where.retainerType = retainerType;
    if (status) where.status = status;
    if (arch) where.arch = arch;

    if (search) {
      where.OR = [
        { material: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { wearInstructions: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await db.retainerRecord.count({ where });

    const items = await db.retainerRecord.findMany({
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
        deliveredBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
 * POST /api/retainers
 * Create a new retainer record
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createRetainerRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid retainer data',
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

    // Create the retainer record
    const retainer = await db.retainerRecord.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        treatmentPlanId: data.treatmentPlanId,
        retainerType: data.retainerType,
        arch: data.arch,
        material: data.material,
        labOrderId: data.labOrderId,
        orderedDate: data.orderedDate,
        receivedDate: data.receivedDate,
        deliveredDate: data.deliveredDate,
        status: data.status,
        deliveredById: data.deliveredById,
        wearSchedule: data.wearSchedule,
        wearInstructions: data.wearInstructions,
        isReplacement: data.isReplacement,
        replacementReason: data.replacementReason,
        previousRetainerId: data.previousRetainerId,
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
        treatmentPlan: {
          select: {
            id: true,
            planName: true,
          },
        },
        deliveredBy: {
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
      entity: 'RetainerRecord',
      entityId: retainer.id,
      details: {
        patientId: retainer.patientId,
        retainerType: retainer.retainerType,
        arch: retainer.arch,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: retainer }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
