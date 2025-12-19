import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createWriteOffSchema,
  writeOffQuerySchema,
} from '@/lib/validations/collections';
import { generateWriteOffNumber } from '@/lib/billing/collections-utils';

/**
 * GET /api/collections/write-offs
 * List write-offs
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      accountId: searchParams.get('accountId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      reason: searchParams.get('reason') ?? undefined,
      minAmount: searchParams.get('minAmount') ?? undefined,
      maxAmount: searchParams.get('maxAmount') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      pendingOnly: searchParams.get('pendingOnly') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = writeOffQuerySchema.safeParse(rawParams);

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
      status,
      reason,
      minAmount,
      maxAmount,
      fromDate,
      toDate,
      pendingOnly,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = getClinicFilter(session);

    if (accountId) where.accountId = accountId;
    if (status) where.status = status;
    if (reason) where.reason = reason;
    if (pendingOnly) where.status = 'PENDING';

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) (where.amount as Record<string, unknown>).gte = minAmount;
      if (maxAmount !== undefined) (where.amount as Record<string, unknown>).lte = maxAmount;
    }

    if (fromDate || toDate) {
      where.requestedAt = {};
      if (fromDate) (where.requestedAt as Record<string, unknown>).gte = fromDate;
      if (toDate) (where.requestedAt as Record<string, unknown>).lte = toDate;
    }

    if (search) {
      where.writeOffNumber = { contains: search, mode: 'insensitive' };
    }

    // Get total count
    const total = await db.writeOff.count({ where });

    // Get paginated results
    const writeOffs = await db.writeOff.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Get account details for each write-off
    const accountIds = [...new Set(writeOffs.map(wo => wo.accountId))];
    const accounts = await db.patientAccount.findMany({
      where: { id: { in: accountIds } },
      select: {
        id: true,
        accountNumber: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    const accountMap = new Map(accounts.map(a => [a.id, a]));

    const writeOffsWithAccounts = writeOffs.map(wo => ({
      ...wo,
      account: accountMap.get(wo.accountId),
    }));

    // Get summary statistics
    const [pendingCount, approvedSum, rejectedCount] = await Promise.all([
      db.writeOff.count({
        where: { ...getClinicFilter(session), status: 'PENDING' },
      }),
      db.writeOff.aggregate({
        where: { ...getClinicFilter(session), status: 'APPROVED' },
        _sum: { amount: true },
      }),
      db.writeOff.count({
        where: { ...getClinicFilter(session), status: 'REJECTED' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: writeOffsWithAccounts,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        summary: {
          pending: pendingCount,
          approvedTotal: approvedSum._sum.amount || 0,
          rejected: rejectedCount,
        },
      },
    });
  },
  { permissions: ['collections:read'] }
);

/**
 * POST /api/collections/write-offs
 * Request a write-off
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const result = createWriteOffSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid write-off data',
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

    // Check if write-off amount exceeds balance
    if (data.amount > (account.currentBalance || 0)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AMOUNT_EXCEEDS_BALANCE',
            message: `Write-off amount ($${data.amount}) exceeds account balance ($${account.currentBalance})`,
          },
        },
        { status: 400 }
      );
    }

    // If invoice specified, verify it exists
    if (data.invoiceId) {
      const invoice = await db.invoice.findFirst({
        where: withSoftDelete({
          id: data.invoiceId,
          clinicId: session.user.clinicId,
        }),
      });

      if (!invoice) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVOICE_NOT_FOUND',
              message: 'Invoice not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Generate write-off number
    const writeOffNumber = await generateWriteOffNumber(session.user.clinicId);

    // Create the write-off request
    const writeOff = await db.writeOff.create({
      data: {
        clinicId: session.user.clinicId,
        accountId: data.accountId,
        invoiceId: data.invoiceId,
        writeOffNumber,
        amount: data.amount,
        reason: data.reason,
        reasonDetails: data.reasonDetails,
        status: 'PENDING',
        requestedBy: session.user.id,
        requestedAt: new Date(),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'WriteOff',
      entityId: writeOff.id,
      details: {
        writeOffNumber,
        accountId: data.accountId,
        amount: data.amount,
        reason: data.reason,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: writeOff },
      { status: 201 }
    );
  },
  { permissions: ['collections:write_off'] }
);
