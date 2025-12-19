import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createTreatmentOutcomeSchema,
  treatmentOutcomeQuerySchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/treatment-outcomes
 * List treatment outcomes with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse and validate query parameters
    const rawParams = {
      treatmentPlanId: searchParams.get('treatmentPlanId') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      overallRating: searchParams.get('overallRating') ?? undefined,
      assessedById: searchParams.get('assessedById') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = treatmentOutcomeQuerySchema.safeParse(rawParams);

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
      overallRating,
      assessedById,
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
    if (overallRating) where.overallRating = overallRating;
    if (assessedById) where.assessedById = assessedById;

    if (fromDate) {
      where.assessmentDate = { ...((where.assessmentDate as object) || {}), gte: fromDate };
    }
    if (toDate) {
      where.assessmentDate = { ...((where.assessmentDate as object) || {}), lte: toDate };
    }

    // Get total count
    const total = await db.treatmentOutcome.count({ where });

    // Get paginated results
    const items = await db.treatmentOutcome.findMany({
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
 * POST /api/treatment-outcomes
 * Create a new treatment outcome assessment
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createTreatmentOutcomeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid treatment outcome data',
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

    // Check if an outcome already exists for this treatment plan (unique constraint)
    const existingOutcome = await db.treatmentOutcome.findFirst({
      where: {
        treatmentPlanId: data.treatmentPlanId,
      },
    });

    if (existingOutcome) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'OUTCOME_EXISTS',
            message: 'A treatment outcome already exists for this treatment plan',
          },
        },
        { status: 400 }
      );
    }

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

    // Create the treatment outcome
    const treatmentOutcome = await db.treatmentOutcome.create({
      data: {
        clinicId: session.user.clinicId,
        treatmentPlanId: data.treatmentPlanId,
        patientId: data.patientId,
        treatmentStartDate: data.treatmentStartDate,
        treatmentEndDate: data.treatmentEndDate,
        totalDurationMonths: data.totalDurationMonths,
        totalVisits: data.totalVisits,
        overallRating: data.overallRating,
        objectivesAchieved: data.objectivesAchieved,
        objectivesPartial: data.objectivesPartial,
        objectivesNotMet: data.objectivesNotMet,
        alignmentScore: data.alignmentScore,
        occlusionScore: data.occlusionScore,
        aestheticScore: data.aestheticScore,
        functionalScore: data.functionalScore,
        initialMeasurements: data.initialMeasurements,
        finalMeasurements: data.finalMeasurements,
        patientSatisfactionScore: data.patientSatisfactionScore,
        patientFeedback: data.patientFeedback,
        wouldRecommend: data.wouldRecommend,
        clinicalNotes: data.clinicalNotes,
        treatmentChallenges: data.treatmentChallenges,
        lessonsLearned: data.lessonsLearned,
        wouldDoAnythingDifferent: data.wouldDoAnythingDifferent,
        followUpRecommendations: data.followUpRecommendations,
        retentionProtocolId: data.retentionProtocolId,
        beforePhotoIds: data.beforePhotoIds,
        afterPhotoIds: data.afterPhotoIds,
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
      entity: 'TreatmentOutcome',
      entityId: treatmentOutcome.id,
      details: {
        patientId: treatmentOutcome.patientId,
        treatmentPlanId: treatmentOutcome.treatmentPlanId,
        overallRating: treatmentOutcome.overallRating,
        patientSatisfactionScore: treatmentOutcome.patientSatisfactionScore,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: treatmentOutcome }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
