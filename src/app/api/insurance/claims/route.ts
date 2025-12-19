import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createInsuranceClaimSchema,
  insuranceClaimQuerySchema,
} from '@/lib/validations/insurance';
import {
  generateClaimNumber,
  calculateClaimTotals,
  createClaimStatusHistory,
} from '@/lib/billing/insurance-utils';

/**
 * GET /api/insurance/claims
 * List insurance claims with pagination and filters
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      patientInsuranceId: searchParams.get('patientInsuranceId') ?? undefined,
      insuranceCompanyId: searchParams.get('insuranceCompanyId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      claimType: searchParams.get('claimType') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      minAmount: searchParams.get('minAmount') ?? undefined,
      maxAmount: searchParams.get('maxAmount') ?? undefined,
      deniedOnly: searchParams.get('deniedOnly') ?? undefined,
      pendingOnly: searchParams.get('pendingOnly') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = insuranceClaimQuerySchema.safeParse(rawParams);

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
      patientInsuranceId,
      insuranceCompanyId,
      status,
      claimType,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      deniedOnly,
      pendingOnly,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (patientId) where.patientId = patientId;
    if (patientInsuranceId) where.patientInsuranceId = patientInsuranceId;
    if (insuranceCompanyId) where.insuranceCompanyId = insuranceCompanyId;
    if (status) where.status = status;
    if (claimType) where.claimType = claimType;

    // Special status filters
    if (deniedOnly) {
      where.status = 'DENIED';
    }
    if (pendingOnly) {
      where.status = { in: ['SUBMITTED', 'ACCEPTED', 'IN_PROCESS'] };
    }

    // Date range filter
    if (fromDate || toDate) {
      where.serviceDate = {};
      if (fromDate) (where.serviceDate as Record<string, unknown>).gte = fromDate;
      if (toDate) (where.serviceDate as Record<string, unknown>).lte = toDate;
    }

    // Amount range filter
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.billedAmount = {};
      if (minAmount !== undefined) (where.billedAmount as Record<string, unknown>).gte = minAmount;
      if (maxAmount !== undefined) (where.billedAmount as Record<string, unknown>).lte = maxAmount;
    }

    // Search by claim number or patient name
    if (search) {
      where.OR = [
        { claimNumber: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await db.insuranceClaim.count({ where });

    // Get paginated results
    const claims = await db.insuranceClaim.findMany({
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
        insuranceCompany: {
          select: {
            id: true,
            name: true,
            payerId: true,
          },
        },
        _count: {
          select: {
            items: true,
            eobs: true,
          },
        },
      },
    });

    // Get summary statistics
    const stats = await db.insuranceClaim.groupBy({
      by: ['status'],
      where: withSoftDelete(getClinicFilter(session)),
      _count: true,
      _sum: {
        billedAmount: true,
        paidAmount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: claims,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          statusCounts: stats.reduce((acc, item) => {
            acc[item.status] = {
              count: item._count,
              billedAmount: item._sum.billedAmount || 0,
              paidAmount: item._sum.paidAmount || 0,
            };
            return acc;
          }, {} as Record<string, { count: number; billedAmount: number; paidAmount: number }>),
        },
      },
    });
  },
  { permissions: ['insurance:read'] }
);

/**
 * POST /api/insurance/claims
 * Create a new insurance claim
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createInsuranceClaimSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid claim data',
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
        { status: 404 }
      );
    }

    // Generate claim number
    const claimNumber = await generateClaimNumber(session.user.clinicId);

    // Calculate totals from items
    const { totalBilled } = calculateClaimTotals(data.items);

    // Create the claim with items
    const claim = await db.insuranceClaim.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        patientInsuranceId: data.patientInsuranceId,
        insuranceCompanyId: data.insuranceCompanyId,
        claimNumber,
        claimType: data.claimType,
        serviceDate: data.serviceDate,
        filingDate: data.filingDate,
        status: data.status,
        billedAmount: totalBilled,
        originalClaimId: data.originalClaimId,
        preauthNumber: data.preauthNumber,
        renderingProviderId: data.renderingProviderId,
        npi: data.npi,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        items: {
          create: data.items.map((item, index) => ({
            lineNumber: item.lineNumber || index + 1,
            procedureCode: item.procedureCode,
            procedureCodeModifier: item.procedureCodeModifier,
            description: item.description,
            serviceDate: item.serviceDate,
            quantity: item.quantity,
            toothNumbers: item.toothNumbers || [],
            billedAmount: item.billedAmount,
            procedureId: item.procedureId,
          })),
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        insuranceCompany: {
          select: {
            id: true,
            name: true,
            payerId: true,
          },
        },
        items: true,
      },
    });

    // Create initial status history
    await createClaimStatusHistory(
      claim.id,
      null,
      claim.status,
      session.user.id,
      'Claim created'
    );

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'InsuranceClaim',
      entityId: claim.id,
      details: {
        claimNumber: claim.claimNumber,
        patientId: data.patientId,
        insuranceCompany: company.name,
        billedAmount: totalBilled,
        itemCount: data.items.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: claim },
      { status: 201 }
    );
  },
  { permissions: ['insurance:submit_claim'] }
);
