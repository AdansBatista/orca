import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createCaseAcceptanceSchema, caseAcceptanceQuerySchema } from '@/lib/validations/treatment';

/**
 * GET /api/case-acceptances
 * List case acceptances with filtering
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse and validate query params
    const query = caseAcceptanceQuerySchema.parse({
      treatmentPlanId: searchParams.get('treatmentPlanId'),
      patientId: searchParams.get('patientId'),
      status: searchParams.get('status'),
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
      ...(query.status && { status: query.status }),
      ...(query.fromDate || query.toDate
        ? {
            createdAt: {
              ...(query.fromDate && { gte: query.fromDate }),
              ...(query.toDate && { lte: query.toDate }),
            },
          }
        : {}),
    };

    // Get total count
    const total = await db.caseAcceptance.count({ where });

    // Get acceptances
    const acceptances = await db.caseAcceptance.findMany({
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
        selectedOption: {
          select: {
            id: true,
            optionName: true,
            applianceSystem: true,
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
        items: acceptances,
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
 * POST /api/case-acceptances
 * Create a new case acceptance record
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createCaseAcceptanceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid case acceptance data',
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

    // Check if acceptance already exists for this plan
    const existingAcceptance = await db.caseAcceptance.findFirst({
      where: {
        treatmentPlanId: data.treatmentPlanId,
        ...getClinicFilter(session),
        deletedAt: null,
        status: { notIn: ['EXPIRED', 'WITHDRAWN'] },
      },
    });

    if (existingAcceptance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCEPTANCE_EXISTS',
            message: 'An active case acceptance already exists for this treatment plan',
          },
        },
        { status: 400 }
      );
    }

    // Create acceptance
    const acceptance = await db.caseAcceptance.create({
      data: {
        clinicId: session.user.clinicId,
        treatmentPlanId: data.treatmentPlanId,
        patientId: data.patientId,
        casePresentationId: data.casePresentationId,
        selectedOptionId: data.selectedOptionId,
        totalTreatmentCost: data.totalTreatmentCost,
        downPayment: data.downPayment,
        monthlyPayment: data.monthlyPayment,
        paymentPlanMonths: data.paymentPlanMonths,
        insuranceEstimate: data.insuranceEstimate,
        patientResponsibility: data.patientResponsibility,
        guardianName: data.guardianName,
        guardianRelation: data.guardianRelation,
        specialConditions: data.specialConditions,
        notes: data.notes,
        status: 'PENDING',
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        selectedOption: {
          select: {
            id: true,
            optionName: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'CaseAcceptance',
      entityId: acceptance.id,
      details: {
        treatmentPlanId: data.treatmentPlanId,
        patientId: data.patientId,
        totalTreatmentCost: data.totalTreatmentCost,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: acceptance }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
