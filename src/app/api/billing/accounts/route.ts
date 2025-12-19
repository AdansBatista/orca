import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createPatientAccountSchema,
  patientAccountQuerySchema,
} from '@/lib/validations/billing';
import { generateAccountNumber } from '@/lib/billing/utils';

/**
 * GET /api/billing/accounts
 * List patient accounts with pagination, search, and filters
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      guarantorId: searchParams.get('guarantorId') ?? undefined,
      familyGroupId: searchParams.get('familyGroupId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      accountType: searchParams.get('accountType') ?? undefined,
      hasOutstandingBalance: searchParams.get('hasOutstandingBalance') ?? undefined,
      minBalance: searchParams.get('minBalance') ?? undefined,
      maxBalance: searchParams.get('maxBalance') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = patientAccountQuerySchema.safeParse(rawParams);

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
      guarantorId,
      familyGroupId,
      status,
      accountType,
      hasOutstandingBalance,
      minBalance,
      maxBalance,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with standardized soft delete filter
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (patientId) where.patientId = patientId;
    if (guarantorId) where.guarantorId = guarantorId;
    if (familyGroupId) where.familyGroupId = familyGroupId;
    if (status) where.status = status;
    if (accountType) where.accountType = accountType;

    // Filter by outstanding balance
    if (hasOutstandingBalance === true) {
      where.currentBalance = { gt: 0 };
    } else if (hasOutstandingBalance === false) {
      where.currentBalance = { lte: 0 };
    }

    // Balance range filters
    if (minBalance !== undefined && maxBalance !== undefined) {
      where.currentBalance = { gte: minBalance, lte: maxBalance };
    } else if (minBalance !== undefined) {
      where.currentBalance = { ...((where.currentBalance as object) || {}), gte: minBalance };
    } else if (maxBalance !== undefined) {
      where.currentBalance = { ...((where.currentBalance as object) || {}), lte: maxBalance };
    }

    // Search across account number and patient name
    if (search) {
      where.OR = [
        { accountNumber: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await db.patientAccount.count({ where });

    // Get paginated results
    const accounts = await db.patientAccount.findMany({
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
            email: true,
            phone: true,
          },
        },
        guarantor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        familyGroup: {
          select: {
            id: true,
            groupName: true,
          },
        },
        _count: {
          select: {
            invoices: true,
            paymentPlans: { where: { status: 'ACTIVE' } },
            payments: true,
          },
        },
      },
    });

    // Calculate aggregate stats
    const stats = await db.patientAccount.aggregate({
      where: withSoftDelete(getClinicFilter(session)),
      _count: true,
      _sum: {
        currentBalance: true,
        insuranceBalance: true,
        patientBalance: true,
        creditBalance: true,
      },
    });

    // Count accounts in various states
    const statusCounts = await db.patientAccount.groupBy({
      by: ['status'],
      where: withSoftDelete(getClinicFilter(session)),
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: accounts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          totalAccounts: stats._count,
          totalOutstandingBalance: stats._sum.currentBalance || 0,
          totalInsuranceBalance: stats._sum.insuranceBalance || 0,
          totalPatientBalance: stats._sum.patientBalance || 0,
          totalCreditBalance: stats._sum.creditBalance || 0,
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
 * POST /api/billing/accounts
 * Create a new patient account
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createPatientAccountSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid patient account data',
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

    // Check if patient already has an account
    const existingAccount = await db.patientAccount.findFirst({
      where: withSoftDelete({
        patientId: data.patientId,
        clinicId: session.user.clinicId,
      }),
    });

    if (existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ACCOUNT_EXISTS',
            message: 'Patient already has a billing account',
            details: { accountId: existingAccount.id },
          },
        },
        { status: 409 }
      );
    }

    // Verify guarantor if specified
    if (data.guarantorId) {
      const guarantor = await db.patient.findFirst({
        where: withSoftDelete({
          id: data.guarantorId,
          clinicId: session.user.clinicId,
        }),
      });

      if (!guarantor) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'GUARANTOR_NOT_FOUND',
              message: 'Guarantor patient not found',
            },
          },
          { status: 400 }
        );
      }
    }

    // Verify family group if specified
    if (data.familyGroupId) {
      const familyGroup = await db.familyGroup.findFirst({
        where: withSoftDelete({
          id: data.familyGroupId,
          clinicId: session.user.clinicId,
        }),
      });

      if (!familyGroup) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'FAMILY_GROUP_NOT_FOUND',
              message: 'Family group not found',
            },
          },
          { status: 400 }
        );
      }
    }

    // Generate unique account number
    const accountNumber = await generateAccountNumber(session.user.clinicId);

    // Create the patient account
    const account = await db.patientAccount.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        accountNumber,
        accountType: data.accountType,
        guarantorId: data.guarantorId,
        familyGroupId: data.familyGroupId,
        status: data.status,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        guarantor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        familyGroup: {
          select: {
            id: true,
            groupName: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'PatientAccount',
      entityId: account.id,
      details: {
        accountNumber: account.accountNumber,
        patientId: account.patientId,
        accountType: account.accountType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: account },
      { status: 201 }
    );
  },
  { permissions: ['billing:create'] }
);
