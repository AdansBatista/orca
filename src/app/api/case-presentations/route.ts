import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createCasePresentationSchema, casePresentationQuerySchema } from '@/lib/validations/treatment';

/**
 * GET /api/case-presentations
 * List case presentations with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse and validate query params
    const query = casePresentationQuerySchema.parse({
      treatmentPlanId: searchParams.get('treatmentPlanId'),
      patientId: searchParams.get('patientId'),
      presentedById: searchParams.get('presentedById'),
      outcome: searchParams.get('outcome'),
      fromDate: searchParams.get('fromDate'),
      toDate: searchParams.get('toDate'),
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder'),
    });

    // Build filters
    const where = {
      ...getClinicFilter(session),
      deletedAt: null,
      ...(query.treatmentPlanId && { treatmentPlanId: query.treatmentPlanId }),
      ...(query.patientId && { patientId: query.patientId }),
      ...(query.presentedById && { presentedById: query.presentedById }),
      ...(query.outcome && { outcome: query.outcome }),
      ...(query.fromDate || query.toDate
        ? {
            presentationDate: {
              ...(query.fromDate && { gte: query.fromDate }),
              ...(query.toDate && { lte: query.toDate }),
            },
          }
        : {}),
    };

    // Get total count
    const total = await db.casePresentation.count({ where });

    // Get presentations
    const presentations = await db.casePresentation.findMany({
      where,
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
            status: true,
          },
        },
        presentedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: presentations,
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
      },
    });
  },
  { permissions: ['treatment:read'] }
);

/**
 * POST /api/case-presentations
 * Create a new case presentation
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createCasePresentationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid case presentation data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify treatment plan exists
    const plan = await db.treatmentPlan.findFirst({
      where: {
        id: data.treatmentPlanId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!plan) {
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

    // Verify patient exists
    const patient = await db.patient.findFirst({
      where: {
        id: data.patientId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
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

    // Verify presenter exists
    const presenter = await db.staffProfile.findFirst({
      where: {
        id: data.presentedById,
        ...getClinicFilter(session),
      },
    });

    if (!presenter) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRESENTER_NOT_FOUND',
            message: 'Presenter not found',
          },
        },
        { status: 404 }
      );
    }

    // Create presentation
    const presentation = await db.casePresentation.create({
      data: {
        clinicId: session.user.clinicId,
        treatmentPlanId: data.treatmentPlanId,
        patientId: data.patientId,
        presentationDate: data.presentationDate,
        presentedById: data.presentedById,
        presentationType: data.presentationType,
        location: data.location,
        attendees: data.attendees,
        guardianPresent: data.guardianPresent,
        guardianName: data.guardianName,
        treatmentOptionsPresented: data.treatmentOptionsPresented,
        visualsUsed: data.visualsUsed,
        materialsProvided: data.materialsProvided,
        outcome: data.outcome,
        outcomeNotes: data.outcomeNotes,
        patientQuestions: data.patientQuestions,
        patientConcerns: data.patientConcerns,
        followUpRequired: data.followUpRequired,
        followUpDate: data.followUpDate,
        followUpNotes: data.followUpNotes,
        durationMinutes: data.durationMinutes,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        presentedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update treatment plan status if this is the first presentation
    if (plan.status === 'DRAFT') {
      await db.treatmentPlan.update({
        where: { id: data.treatmentPlanId },
        data: {
          status: 'PRESENTED',
          presentedDate: data.presentationDate,
        },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'CasePresentation',
      entityId: presentation.id,
      details: {
        treatmentPlanId: data.treatmentPlanId,
        patientId: data.patientId,
        outcome: data.outcome,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: presentation }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
