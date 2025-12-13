import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createCreditBalanceSchema,
  creditBalanceQuerySchema,
  applyCreditSchema,
  transferCreditSchema,
} from '@/lib/validations/billing';
import { updateAccountBalance } from '@/lib/billing/utils';

/**
 * GET /api/billing/credits
 * List credit balances with pagination and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      accountId: searchParams.get('accountId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      source: searchParams.get('source') ?? undefined,
      expiringBefore: searchParams.get('expiringBefore') ?? undefined,
      minAmount: searchParams.get('minAmount') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = creditBalanceQuerySchema.safeParse(rawParams);

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
      accountId,
      status,
      source,
      expiringBefore,
      minAmount,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = getClinicFilter(session);

    if (accountId) where.accountId = accountId;
    if (status) where.status = status;
    if (source) where.source = source;

    if (expiringBefore) {
      where.expiresAt = { lte: expiringBefore };
    }

    if (minAmount !== undefined) {
      where.remainingAmount = { gte: minAmount };
    }

    // Get total count
    const total = await db.creditBalance.count({ where });

    // Get paginated results
    const credits = await db.creditBalance.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        account: {
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
        },
      },
    });

    // Calculate totals
    const stats = await db.creditBalance.aggregate({
      where: {
        ...getClinicFilter(session),
        status: 'AVAILABLE',
        remainingAmount: { gt: 0 },
      },
      _sum: {
        remainingAmount: true,
      },
      _count: true,
    });

    // Count expiring soon (next 30 days)
    const expiringSoon = await db.creditBalance.count({
      where: {
        ...getClinicFilter(session),
        status: 'AVAILABLE',
        remainingAmount: { gt: 0 },
        expiresAt: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: credits,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          totalAvailableCredits: stats._count,
          totalAvailableAmount: stats._sum.remainingAmount || 0,
          expiringSoon,
        },
      },
    });
  },
  { permissions: ['billing:read'] }
);

/**
 * POST /api/billing/credits
 * Create a new credit balance
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Check for action type
    const { action } = body;

    if (action === 'apply') {
      return handleApplyCredit(req, session, body);
    } else if (action === 'transfer') {
      return handleTransferCredit(req, session, body);
    }

    // Standard create credit
    const result = createCreditBalanceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid credit data',
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

    // Create credit
    const credit = await db.creditBalance.create({
      data: {
        clinicId: session.user.clinicId,
        accountId: data.accountId,
        amount: data.amount,
        remainingAmount: data.amount,
        source: data.source,
        description: data.description,
        expiresAt: data.expiresAt,
        status: 'AVAILABLE',
        createdBy: session.user.id,
      },
      include: {
        account: {
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
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'CreditBalance',
      entityId: credit.id,
      details: {
        accountId: credit.accountId,
        amount: credit.amount,
        source: credit.source,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: credit },
      { status: 201 }
    );
  },
  { permissions: ['billing:create'] }
);

// Helper: Apply credit to invoice
async function handleApplyCredit(
  req: Request,
  session: Session,
  body: unknown
) {
  // Extract creditId from body
  const { creditId, ...rest } = body as { creditId: string; [key: string]: unknown };

  if (!creditId) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_CREDIT_ID', message: 'Credit ID is required' } },
      { status: 400 }
    );
  }

  const result = applyCreditSchema.safeParse(rest);
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid apply credit data',
          details: result.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const data = result.data;

  // Get credit
  const credit = await db.creditBalance.findFirst({
    where: {
      id: creditId,
      clinicId: session.user.clinicId,
      status: 'AVAILABLE',
    },
  });

  if (!credit) {
    return NextResponse.json(
      { success: false, error: { code: 'CREDIT_NOT_FOUND', message: 'Credit not found or not available' } },
      { status: 404 }
    );
  }

  if (credit.remainingAmount < data.amount) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INSUFFICIENT_CREDIT',
          message: 'Insufficient credit balance',
          details: { available: credit.remainingAmount, requested: data.amount },
        },
      },
      { status: 400 }
    );
  }

  // Get invoice
  const invoice = await db.invoice.findFirst({
    where: withSoftDelete({
      id: data.invoiceId,
      clinicId: session.user.clinicId,
      accountId: credit.accountId,
    }),
  });

  if (!invoice) {
    return NextResponse.json(
      { success: false, error: { code: 'INVOICE_NOT_FOUND', message: 'Invoice not found' } },
      { status: 404 }
    );
  }

  if (invoice.balance < data.amount) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'AMOUNT_EXCEEDS_BALANCE',
          message: 'Amount exceeds invoice balance due',
          details: { balance: invoice.balance, requested: data.amount },
        },
      },
      { status: 400 }
    );
  }

  // Apply credit in transaction
  const newRemainingAmount = credit.remainingAmount - data.amount;
  const newInvoiceBalance = invoice.balance - data.amount;

  const [updatedCredit, updatedInvoice] = await db.$transaction([
    // Update credit
    db.creditBalance.update({
      where: { id: creditId },
      data: {
        remainingAmount: newRemainingAmount,
        status: newRemainingAmount <= 0 ? 'APPLIED' : 'AVAILABLE',
      },
    }),
    // Update invoice
    db.invoice.update({
      where: { id: data.invoiceId },
      data: {
        paidAmount: invoice.paidAmount + data.amount,
        balance: newInvoiceBalance,
        status: newInvoiceBalance <= 0 ? 'PAID' : 'PARTIAL',
        updatedBy: session.user.id,
      },
    }),
  ]);

  // Update account balance
  await updateAccountBalance(credit.accountId, session.user.clinicId, session.user.id);

  const { ipAddress, userAgent } = getRequestMeta(req);
  await logAudit(session, {
    action: 'UPDATE',
    entity: 'CreditBalance',
    entityId: creditId,
    details: {
      action: 'applied',
      invoiceId: data.invoiceId,
      amount: data.amount,
    },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({
    success: true,
    data: { credit: updatedCredit, invoice: updatedInvoice },
  });
}

// Helper: Transfer credit between accounts
async function handleTransferCredit(
  req: Request,
  session: Session,
  body: unknown
) {
  const { creditId, ...rest } = body as { creditId: string; [key: string]: unknown };

  if (!creditId) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_CREDIT_ID', message: 'Credit ID is required' } },
      { status: 400 }
    );
  }

  const result = transferCreditSchema.safeParse(rest);
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid transfer data',
          details: result.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const data = result.data;

  // Get source credit
  const sourceCredit = await db.creditBalance.findFirst({
    where: {
      id: creditId,
      clinicId: session.user.clinicId,
      status: 'AVAILABLE',
    },
  });

  if (!sourceCredit) {
    return NextResponse.json(
      { success: false, error: { code: 'CREDIT_NOT_FOUND', message: 'Credit not found or not available' } },
      { status: 404 }
    );
  }

  if (sourceCredit.remainingAmount < data.amount) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INSUFFICIENT_CREDIT',
          message: 'Insufficient credit balance for transfer',
        },
      },
      { status: 400 }
    );
  }

  // Verify destination account
  const destAccount = await db.patientAccount.findFirst({
    where: withSoftDelete({
      id: data.toAccountId,
      clinicId: session.user.clinicId,
    }),
  });

  if (!destAccount) {
    return NextResponse.json(
      { success: false, error: { code: 'DEST_ACCOUNT_NOT_FOUND', message: 'Destination account not found' } },
      { status: 404 }
    );
  }

  // Perform transfer in transaction
  const newRemainingAmount = sourceCredit.remainingAmount - data.amount;

  const [updatedSource, newCredit] = await db.$transaction([
    // Reduce source credit - when fully transferred, mark as APPLIED (used up)
    db.creditBalance.update({
      where: { id: creditId },
      data: {
        remainingAmount: newRemainingAmount,
        status: newRemainingAmount <= 0 ? 'APPLIED' : 'AVAILABLE',
      },
    }),
    // Create new credit on destination account
    db.creditBalance.create({
      data: {
        clinicId: session.user.clinicId,
        accountId: data.toAccountId,
        amount: data.amount,
        remainingAmount: data.amount,
        source: 'TRANSFER',
        description: `Transferred from another account`,
        status: 'AVAILABLE',
        createdBy: session.user.id,
      },
    }),
  ]);

  const { ipAddress, userAgent } = getRequestMeta(req);
  await logAudit(session, {
    action: 'UPDATE',
    entity: 'CreditBalance',
    entityId: creditId,
    details: {
      action: 'transferred',
      toAccountId: data.toAccountId,
      amount: data.amount,
      newCreditId: newCredit.id,
    },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({
    success: true,
    data: { sourceCredit: updatedSource, newCredit },
  });
}
