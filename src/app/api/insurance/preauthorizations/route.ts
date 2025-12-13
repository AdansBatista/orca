import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createPreauthorizationSchema,
  preauthorizationQuerySchema,
} from '@/lib/validations/insurance';

/**
 * GET /api/insurance/preauthorizations
 * List preauthorizations with pagination and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      patientId: searchParams.get('patientId') ?? undefined,
      patientInsuranceId: searchParams.get('patientInsuranceId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      expiringSoon: searchParams.get('expiringSoon') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = preauthorizationQuerySchema.safeParse(rawParams);

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
      patientId,
      patientInsuranceId,
      status,
      fromDate,
      toDate,
      expiringSoon,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = getClinicFilter(session);

    if (patientId) where.patientId = patientId;
    if (patientInsuranceId) where.patientInsuranceId = patientInsuranceId;
    if (status) where.status = status;

    // Date range filter
    if (fromDate || toDate) {
      where.requestDate = {};
      if (fromDate) (where.requestDate as Record<string, unknown>).gte = fromDate;
      if (toDate) (where.requestDate as Record<string, unknown>).lte = toDate;
    }

    // Expiring soon filter (within 30 days)
    if (expiringSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      where.status = 'APPROVED';
      where.expirationDate = {
        gte: new Date(),
        lte: thirtyDaysFromNow,
      };
    }

    // Get total count
    const total = await db.preauthorization.count({ where });

    // Get paginated results
    const preauths = await db.preauthorization.findMany({
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
        patientInsurance: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                payerId: true,
              },
            },
          },
        },
      },
    });

    // Get status counts
    const statusCounts = await db.preauthorization.groupBy({
      by: ['status'],
      where: getClinicFilter(session),
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: preauths,
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
  { permissions: ['insurance:read'] }
);

/**
 * POST /api/insurance/preauthorizations
 * Create a new preauthorization request
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createPreauthorizationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid preauthorization data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify patient exists
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

    // Verify patient insurance exists
    const patientInsurance = await db.patientInsurance.findFirst({
      where: withSoftDelete({
        id: data.patientInsuranceId,
        patientId: data.patientId,
        clinicId: session.user.clinicId,
      }),
      include: {
        company: true,
      },
    });

    if (!patientInsurance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INSURANCE_NOT_FOUND',
            message: 'Patient insurance not found',
          },
        },
        { status: 404 }
      );
    }

    // Create the preauthorization
    const preauth = await db.preauthorization.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        patientInsuranceId: data.patientInsuranceId,
        treatmentPlanId: data.treatmentPlanId,
        procedureCodes: data.procedureCodes,
        requestedAmount: data.requestedAmount,
        attachments: data.attachments || [],
        status: data.status,
        createdBy: session.user.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        patientInsurance: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                payerId: true,
              },
            },
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Preauthorization',
      entityId: preauth.id,
      details: {
        patientId: data.patientId,
        insuranceCompany: patientInsurance.company.name,
        requestedAmount: data.requestedAmount,
        procedureCodes: data.procedureCodes,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: preauth },
      { status: 201 }
    );
  },
  { permissions: ['insurance:create'] }
);
