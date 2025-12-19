import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createPatientInsuranceSchema,
  patientInsuranceQuerySchema,
} from '@/lib/validations/insurance';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/patients/[id]/insurance
 * List patient's insurance coverages
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session, context: RouteContext) => {
    const { id: patientId } = await context.params;
    const { searchParams } = new URL(req.url);

    // Verify patient exists
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        id: patientId,
        clinicId: session.user.clinicId,
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

    // Parse query parameters
    const rawParams = {
      patientId,
      insuranceCompanyId: searchParams.get('insuranceCompanyId') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      verificationStatus: searchParams.get('verificationStatus') ?? undefined,
      hasOrthoBenefit: searchParams.get('hasOrthoBenefit') ?? undefined,
      active: searchParams.get('active') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = patientInsuranceQuerySchema.safeParse(rawParams);

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
      insuranceCompanyId,
      priority,
      verificationStatus,
      hasOrthoBenefit,
      active,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete({
      ...getClinicFilter(session),
      patientId,
    });

    if (insuranceCompanyId) where.insuranceCompanyId = insuranceCompanyId;
    if (priority) where.priority = priority;
    if (verificationStatus) where.verificationStatus = verificationStatus;
    if (hasOrthoBenefit !== undefined) where.hasOrthoBenefit = hasOrthoBenefit;

    // Filter for active coverages (not terminated)
    if (active === true) {
      where.OR = [
        { terminationDate: null },
        { terminationDate: { gt: new Date() } },
      ];
    } else if (active === false) {
      where.terminationDate = { lte: new Date() };
    }

    // Get total count
    const total = await db.patientInsurance.count({ where });

    // Get paginated results
    const insurances = await db.patientInsurance.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            payerId: true,
            type: true,
            phone: true,
            requiresPreauth: true,
          },
        },
        _count: {
          select: {
            claims: true,
            eligibilityChecks: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: insurances,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['insurance:read'] }
);

/**
 * POST /api/patients/[id]/insurance
 * Add insurance coverage to a patient
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session, context: RouteContext) => {
    const { id: patientId } = await context.params;
    const body = await req.json();

    // Verify patient exists
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        id: patientId,
        clinicId: session.user.clinicId,
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

    // Validate input
    const result = createPatientInsuranceSchema.safeParse({ ...body, patientId });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid insurance data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify insurance company exists
    const company = await db.insuranceCompany.findFirst({
      where: withSoftDelete({
        id: data.insuranceCompanyId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'COMPANY_NOT_FOUND',
            message: 'Insurance company not found',
          },
        },
        { status: 400 }
      );
    }

    // Check for existing coverage with same priority
    const existingPriority = await db.patientInsurance.findFirst({
      where: withSoftDelete({
        patientId,
        clinicId: session.user.clinicId,
        priority: data.priority,
        OR: [
          { terminationDate: null },
          { terminationDate: { gt: new Date() } },
        ],
      }),
    });

    if (existingPriority) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_PRIORITY',
            message: `Patient already has an active ${data.priority.toLowerCase()} insurance`,
          },
        },
        { status: 409 }
      );
    }

    // Create the patient insurance
    const insurance = await db.patientInsurance.create({
      data: {
        clinicId: session.user.clinicId,
        patientId,
        insuranceCompanyId: data.insuranceCompanyId,
        priority: data.priority,
        subscriberId: data.subscriberId,
        groupNumber: data.groupNumber,
        subscriberName: data.subscriberName,
        subscriberDob: data.subscriberDob,
        relationToSubscriber: data.relationToSubscriber,
        effectiveDate: data.effectiveDate,
        terminationDate: data.terminationDate,
        hasOrthoBenefit: data.hasOrthoBenefit,
        orthoLifetimeMax: data.orthoLifetimeMax,
        orthoUsedAmount: data.orthoUsedAmount,
        orthoRemainingAmount: data.orthoRemainingAmount ??
          (data.orthoLifetimeMax ? data.orthoLifetimeMax - (data.orthoUsedAmount || 0) : null),
        orthoAgeLimit: data.orthoAgeLimit,
        orthoWaitingPeriod: data.orthoWaitingPeriod,
        orthoCoveragePercent: data.orthoCoveragePercent,
        orthoDeductible: data.orthoDeductible,
        orthoDeductibleMet: data.orthoDeductibleMet,
        cardFrontUrl: data.cardFrontUrl,
        cardBackUrl: data.cardBackUrl,
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            payerId: true,
            type: true,
          },
        },
      },
    });

    // Audit log (PHI access)
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'PatientInsurance',
      entityId: insurance.id,
      details: {
        patientId,
        companyName: company.name,
        priority: insurance.priority,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: insurance },
      { status: 201 }
    );
  },
  { permissions: ['insurance:create'] }
);
