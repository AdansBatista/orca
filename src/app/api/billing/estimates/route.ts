import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createTreatmentEstimateSchema,
  treatmentEstimateQuerySchema,
} from '@/lib/validations/billing';
import { generateEstimateNumber } from '@/lib/billing/utils';

/**
 * GET /api/billing/estimates
 * List treatment estimates with pagination and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      accountId: searchParams.get('accountId') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      treatmentPlanId: searchParams.get('treatmentPlanId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      expired: searchParams.get('expired') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = treatmentEstimateQuerySchema.safeParse(rawParams);

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
      accountId,
      patientId,
      treatmentPlanId,
      status,
      expired,
      fromDate,
      toDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (accountId) where.accountId = accountId;
    if (patientId) where.patientId = patientId;
    if (treatmentPlanId) where.treatmentPlanId = treatmentPlanId;
    if (status) where.status = status;

    // Expired filter
    if (expired === true) {
      where.validUntil = { lt: new Date() };
      where.status = { notIn: ['ACCEPTED', 'DECLINED'] };
    } else if (expired === false) {
      where.OR = [
        { validUntil: null },
        { validUntil: { gte: new Date() } },
      ];
    }

    // Date filters
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) (where.createdAt as Record<string, Date>).gte = fromDate;
      if (toDate) (where.createdAt as Record<string, Date>).lte = toDate;
    }

    // Search
    if (search) {
      where.OR = [
        { estimateNumber: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await db.treatmentEstimate.count({ where });

    // Get paginated results
    const estimates = await db.treatmentEstimate.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        account: {
          select: {
            id: true,
            accountNumber: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        scenarios: true,
      },
    });

    // Calculate stats
    const statusCounts = await db.treatmentEstimate.groupBy({
      by: ['status'],
      where: withSoftDelete(getClinicFilter(session)),
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: estimates,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          statusCounts: statusCounts.reduce((acc, item) => {
            acc[item.status] = item._count;
            return acc;
          }, {} as Record<string, number>),
        },
      },
    });
  },
  { permissions: ['billing:read'] }
);

/**
 * POST /api/billing/estimates
 * Create a new treatment estimate
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createTreatmentEstimateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid estimate data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify account exists
    const account = await db.patientAccount.findFirst({
      where: withSoftDelete({
        id: data.accountId,
        clinicId: session.user.clinicId,
      }),
    });

    if (!account) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_NOT_FOUND',
            message: 'Patient account not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify patient
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        id: data.patientId,
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

    // Verify treatment plan if provided
    if (data.treatmentPlanId) {
      const plan = await db.treatmentPlan.findFirst({
        where: withSoftDelete({
          id: data.treatmentPlanId,
          clinicId: session.user.clinicId,
        }),
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
    }

    // Generate estimate number
    const estimateNumber = await generateEstimateNumber(session.user.clinicId);

    // Create estimate with scenarios
    const estimate = await db.treatmentEstimate.create({
      data: {
        clinicId: session.user.clinicId,
        accountId: data.accountId,
        patientId: data.patientId,
        treatmentPlanId: data.treatmentPlanId,
        estimateNumber,
        validUntil: data.validUntil,
        totalCost: data.totalCost,
        insuranceEstimate: data.insuranceEstimate || 0,
        patientEstimate: data.patientEstimate,
        downPayment: data.downPayment || 0,
        notes: data.notes,
        status: data.status,
        createdBy: session.user.id,
        scenarios: data.scenarios?.length ? {
          create: data.scenarios.map((scenario) => ({
            name: scenario.name,
            description: scenario.description,
            totalCost: scenario.totalCost,
            insuranceEstimate: scenario.insuranceEstimate || 0,
            patientEstimate: scenario.patientEstimate,
            procedures: scenario.procedures || [],
            isRecommended: scenario.isRecommended || false,
            isSelected: scenario.isSelected || false,
          })),
        } : undefined,
      },
      include: {
        account: {
          select: {
            id: true,
            accountNumber: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        scenarios: true,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'TreatmentEstimate',
      entityId: estimate.id,
      details: {
        estimateNumber: estimate.estimateNumber,
        patientId: estimate.patientId,
        totalCost: estimate.totalCost,
        scenarioCount: data.scenarios?.length || 0,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: estimate },
      { status: 201 }
    );
  },
  { permissions: ['billing:create'] }
);
