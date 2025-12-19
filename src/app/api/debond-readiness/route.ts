import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createDebondReadinessSchema,
  debondReadinessQuerySchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/debond-readiness
 * List debond readiness assessments with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse and validate query parameters
    const rawParams = {
      treatmentPlanId: searchParams.get('treatmentPlanId') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      isReady: searchParams.get('isReady') ?? undefined,
      debondCompleted: searchParams.get('debondCompleted') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = debondReadinessQuerySchema.safeParse(rawParams);

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
      treatmentPlanId,
      patientId,
      isReady,
      debondCompleted,
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
    if (treatmentPlanId) where.treatmentPlanId = treatmentPlanId;
    if (patientId) where.patientId = patientId;
    if (isReady !== undefined) where.isReady = isReady;
    if (debondCompleted !== undefined) where.debondCompleted = debondCompleted;

    if (fromDate) {
      where.assessmentDate = { ...((where.assessmentDate as object) || {}), gte: fromDate };
    }
    if (toDate) {
      where.assessmentDate = { ...((where.assessmentDate as object) || {}), lte: toDate };
    }

    // Get total count
    const total = await db.debondReadiness.count({ where });

    // Get paginated results
    const items = await db.debondReadiness.findMany({
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
            planNumber: true,
            status: true,
          },
        },
        assessedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        approvedBy: {
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

/**
 * POST /api/debond-readiness
 * Create a new debond readiness assessment
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createDebondReadinessSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid debond readiness data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Get staff profile for assessedBy
    const staffProfile = await db.staffProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STAFF_NOT_FOUND',
            message: 'Staff profile not found for current user',
          },
        },
        { status: 400 }
      );
    }

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

    // Verify treatment plan exists and belongs to patient
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
            message: 'Treatment plan not found or does not belong to this patient',
          },
        },
        { status: 404 }
      );
    }

    // Calculate readiness score based on criteria
    const criteria = [
      data.alignmentComplete,
      data.spaceClosure,
      data.overbiteCorrection,
      data.overjetCorrection,
      data.midlineAlignment,
      data.occlusionSatisfactory,
      data.patientSatisfied,
      data.rootParallelism,
      data.marginalRidges,
      data.interproximalContacts,
    ];
    const criteriaCount = criteria.filter(Boolean).length;
    const readinessScore = (criteriaCount / criteria.length) * 100;

    // Create the debond readiness assessment
    const debondReadiness = await db.debondReadiness.create({
      data: {
        clinicId: session.user.clinicId,
        treatmentPlanId: data.treatmentPlanId,
        patientId: data.patientId,
        alignmentComplete: data.alignmentComplete,
        spaceClosure: data.spaceClosure,
        overbiteCorrection: data.overbiteCorrection,
        overjetCorrection: data.overjetCorrection,
        midlineAlignment: data.midlineAlignment,
        occlusionSatisfactory: data.occlusionSatisfactory,
        patientSatisfied: data.patientSatisfied,
        rootParallelism: data.rootParallelism,
        marginalRidges: data.marginalRidges,
        interproximalContacts: data.interproximalContacts,
        additionalCriteria: data.additionalCriteria,
        isReady: data.isReady,
        readinessScore,
        notReadyReasons: data.notReadyReasons,
        clinicalNotes: data.clinicalNotes,
        recommendations: data.recommendations,
        scheduledDebondDate: data.scheduledDebondDate,
        assessedById: staffProfile.id,
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
            planNumber: true,
            status: true,
          },
        },
        assessedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'DebondReadiness',
      entityId: debondReadiness.id,
      details: {
        patientId: debondReadiness.patientId,
        treatmentPlanId: debondReadiness.treatmentPlanId,
        isReady: debondReadiness.isReady,
        readinessScore,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: debondReadiness }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
