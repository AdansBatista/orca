import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  generateStatementSchema,
  statementQuerySchema,
} from '@/lib/validations/billing';
import { generateStatementNumber } from '@/lib/billing/utils';

/**
 * GET /api/billing/statements
 * List statements with pagination and filters
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      accountId: searchParams.get('accountId') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      deliveryMethod: searchParams.get('deliveryMethod') ?? undefined,
      sent: searchParams.get('sent') ?? undefined,
      viewed: searchParams.get('viewed') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = statementQuerySchema.safeParse(rawParams);

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
      fromDate,
      toDate,
      deliveryMethod,
      sent,
      viewed,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = getClinicFilter(session);

    if (accountId) where.accountId = accountId;
    if (deliveryMethod) where.deliveryMethod = deliveryMethod;

    // Date filters
    if (fromDate || toDate) {
      where.statementDate = {};
      if (fromDate) (where.statementDate as Record<string, Date>).gte = fromDate;
      if (toDate) (where.statementDate as Record<string, Date>).lte = toDate;
    }

    // Sent/viewed filters
    if (sent === true) {
      where.sentAt = { not: null };
    } else if (sent === false) {
      where.sentAt = null;
    }

    if (viewed === true) {
      where.viewedAt = { not: null };
    } else if (viewed === false) {
      where.viewedAt = null;
    }

    // Get total count
    const total = await db.statement.count({ where });

    // Get paginated results
    const statements = await db.statement.findMany({
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
                email: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: statements,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['billing:read'] }
);

/**
 * POST /api/billing/statements
 * Generate a new statement
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = generateStatementSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid statement data',
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
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
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

    // Get invoices for the period
    const invoices = await db.invoice.findMany({
      where: withSoftDelete({
        accountId: data.accountId,
        clinicId: session.user.clinicId,
        invoiceDate: {
          gte: data.periodStart,
          lte: data.periodEnd,
        },
        status: { notIn: [InvoiceStatus.DRAFT, InvoiceStatus.VOID] },
      }),
      select: {
        id: true,
        invoiceNumber: true,
        invoiceDate: true,
        dueDate: true,
        subtotal: true,
        paidAmount: true,
        balance: true,
        status: true,
      },
      orderBy: { invoiceDate: 'asc' },
    });

    // Get payments for the period
    const payments = await db.payment.findMany({
      where: withSoftDelete({
        accountId: data.accountId,
        clinicId: session.user.clinicId,
        paymentDate: {
          gte: data.periodStart,
          lte: data.periodEnd,
        },
        status: PaymentStatus.COMPLETED,
      }),
      select: {
        id: true,
        paymentNumber: true,
        paymentDate: true,
        amount: true,
      },
      orderBy: { paymentDate: 'asc' },
    });

    // Calculate totals
    const totalCharges = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalPayments = payments.reduce((sum, pay) => sum + pay.amount, 0);

    // Generate statement number
    const statementNumber = await generateStatementNumber(session.user.clinicId);

    // Create statement
    const statement = await db.statement.create({
      data: {
        clinicId: session.user.clinicId,
        accountId: data.accountId,
        statementNumber,
        statementDate: data.statementDate || new Date(),
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        previousBalance: account.currentBalance - totalCharges + totalPayments,
        newCharges: totalCharges,
        payments: totalPayments,
        adjustments: 0,
        currentBalance: account.currentBalance,
        amountDue: account.currentBalance,
        dueDate: data.dueDate,
        deliveryMethod: data.deliveryMethod,
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
                email: true,
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
      entity: 'Statement',
      entityId: statement.id,
      details: {
        statementNumber: statement.statementNumber,
        accountId: statement.accountId,
        currentBalance: statement.currentBalance,
        deliveryMethod: statement.deliveryMethod,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: statement },
      { status: 201 }
    );
  },
  { permissions: ['billing:create'] }
);
