import { NextResponse } from 'next/server';
import { InvoiceStatus } from '@prisma/client';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createInvoiceSchema,
  invoiceQuerySchema,
} from '@/lib/validations/billing';
import {
  generateInvoiceNumber,
  calculateInvoiceTotals,
  updateAccountBalance,
} from '@/lib/billing/utils';

/**
 * GET /api/billing/invoices
 * List invoices with pagination, search, and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      accountId: searchParams.get('accountId') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      dueBefore: searchParams.get('dueBefore') ?? undefined,
      dueAfter: searchParams.get('dueAfter') ?? undefined,
      minAmount: searchParams.get('minAmount') ?? undefined,
      maxAmount: searchParams.get('maxAmount') ?? undefined,
      overdue: searchParams.get('overdue') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = invoiceQuerySchema.safeParse(rawParams);

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
      status,
      fromDate,
      toDate,
      dueBefore,
      dueAfter,
      minAmount,
      maxAmount,
      overdue,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (accountId) where.accountId = accountId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;

    // Date filters
    if (fromDate || toDate) {
      where.invoiceDate = {};
      if (fromDate) (where.invoiceDate as Record<string, Date>).gte = fromDate;
      if (toDate) (where.invoiceDate as Record<string, Date>).lte = toDate;
    }

    if (dueBefore || dueAfter) {
      where.dueDate = {};
      if (dueBefore) (where.dueDate as Record<string, Date>).lte = dueBefore;
      if (dueAfter) (where.dueDate as Record<string, Date>).gte = dueAfter;
    }

    // Amount filters (using subtotal since the model doesn't have totalAmount)
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.subtotal = {};
      if (minAmount !== undefined) (where.subtotal as Record<string, number>).gte = minAmount;
      if (maxAmount !== undefined) (where.subtotal as Record<string, number>).lte = maxAmount;
    }

    // Overdue filter
    if (overdue === true) {
      where.dueDate = { lt: new Date() };
      where.status = { in: ['PENDING', 'SENT', 'PARTIAL'] };
    }

    // Search across invoice number and patient name
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await db.invoice.count({ where });

    // Get paginated results
    const invoices = await db.invoice.findMany({
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
        items: {
          select: {
            id: true,
            description: true,
            quantity: true,
            unitPrice: true,
            total: true,
          },
        },
        _count: {
          select: {
            allocations: true,
          },
        },
      },
    });

    // Calculate summary stats
    const stats = await db.invoice.aggregate({
      where: withSoftDelete(getClinicFilter(session)),
      _count: true,
      _sum: {
        subtotal: true,
        paidAmount: true,
        balance: true,
      },
    });

    // Count by status
    const statusCounts = await db.invoice.groupBy({
      by: ['status'],
      where: withSoftDelete(getClinicFilter(session)),
      _count: true,
      _sum: { subtotal: true },
    });

    // Count overdue
    const overdueCount = await db.invoice.count({
      where: withSoftDelete({
        ...getClinicFilter(session),
        dueDate: { lt: new Date() },
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.SENT, InvoiceStatus.PARTIAL] },
      }),
    });

    return NextResponse.json({
      success: true,
      data: {
        items: invoices,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          totalInvoices: stats._count,
          totalBilled: stats._sum.subtotal || 0,
          totalCollected: stats._sum.paidAmount || 0,
          totalOutstanding: stats._sum.balance || 0,
          overdueCount,
          statusCounts: statusCounts.reduce((acc, item) => {
            acc[item.status] = { count: item._count, amount: item._sum.subtotal || 0 };
            return acc;
          }, {} as Record<string, { count: number; amount: number }>),
        },
      },
    });
  },
  { permissions: ['billing:read'] }
);

/**
 * POST /api/billing/invoices
 * Create a new invoice
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createInvoiceSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid invoice data',
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

    // Verify patient matches account
    if (data.patientId !== account.patientId) {
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
    }

    // Calculate totals
    const totals = calculateInvoiceTotals(data.items);

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(session.user.clinicId);

    // Create invoice with items
    const invoice = await db.invoice.create({
      data: {
        clinicId: session.user.clinicId,
        accountId: data.accountId,
        patientId: data.patientId,
        invoiceNumber,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        subtotal: totals.subtotal,
        adjustments: totals.adjustments,
        insuranceAmount: totals.insuranceAmount,
        patientAmount: totals.patientAmount,
        paidAmount: 0,
        balance: totals.balance,
        treatmentPlanId: data.treatmentPlanId,
        appointmentId: data.appointmentId,
        notes: data.notes,
        internalNotes: data.internalNotes,
        status: data.status,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        items: {
          create: data.items.map((item) => {
            const lineSubtotal = item.quantity * item.unitPrice;
            const lineTotal = lineSubtotal - (item.discount || 0);

            return {
              procedureCode: item.procedureCode,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount || 0,
              total: lineTotal,
              insuranceAmount: item.insuranceAmount || 0,
              patientAmount: item.patientAmount || lineTotal,
              procedureId: item.procedureId,
              toothNumbers: item.toothNumbers || [],
            };
          }),
        },
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
        items: true,
      },
    });

    // Update account balance if invoice is not draft
    if (data.status !== 'DRAFT') {
      await updateAccountBalance(data.accountId, session.user.clinicId, session.user.id);
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Invoice',
      entityId: invoice.id,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        accountId: invoice.accountId,
        patientId: invoice.patientId,
        subtotal: invoice.subtotal,
        itemCount: data.items.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: invoice },
      { status: 201 }
    );
  },
  { permissions: ['billing:create'] }
);
