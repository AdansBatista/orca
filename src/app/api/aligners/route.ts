import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createAlignerRecordSchema,
  alignerRecordQuerySchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/aligners
 * List aligner records with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      treatmentPlanId: searchParams.get('treatmentPlanId') ?? undefined,
      alignerSystem: searchParams.get('alignerSystem') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = alignerRecordQuerySchema.safeParse(rawParams);

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
      alignerSystem,
      status,
      fromDate,
      toDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause (no soft delete on this model)
    const where: Record<string, unknown> = getClinicFilter(session);

    if (patientId) where.patientId = patientId;
    if (treatmentPlanId) where.treatmentPlanId = treatmentPlanId;
    if (alignerSystem) where.alignerSystem = alignerSystem;
    if (status) where.status = status;

    if (fromDate) {
      where.startDate = { ...((where.startDate as object) || {}), gte: fromDate };
    }
    if (toDate) {
      where.startDate = { ...((where.startDate as object) || {}), lte: toDate };
    }

    if (search) {
      where.OR = [
        { caseNumber: { contains: search, mode: 'insensitive' } },
        { alignerSystem: { contains: search, mode: 'insensitive' } },
      ];
    }

    const total = await db.alignerRecord.count({ where });

    const items = await db.alignerRecord.findMany({
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
        _count: {
          select: {
            deliveries: true,
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
 * POST /api/aligners
 * Create a new aligner record
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createAlignerRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid aligner data',
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

    // Create the aligner record
    const aligner = await db.alignerRecord.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        treatmentPlanId: data.treatmentPlanId,
        alignerSystem: data.alignerSystem,
        caseNumber: data.caseNumber,
        totalAligners: data.totalAligners,
        currentAligner: data.currentAligner,
        refinementNumber: data.refinementNumber,
        status: data.status,
        startDate: data.startDate,
        estimatedEndDate: data.estimatedEndDate,
        actualEndDate: data.actualEndDate,
        alignersDelivered: data.alignersDelivered,
        lastDeliveryDate: data.lastDeliveryDate,
        averageWearHours: data.averageWearHours,
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
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'AlignerRecord',
      entityId: aligner.id,
      details: {
        patientId: aligner.patientId,
        alignerSystem: aligner.alignerSystem,
        totalAligners: aligner.totalAligners,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: aligner }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
