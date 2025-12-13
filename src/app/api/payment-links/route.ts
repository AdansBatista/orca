import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createPaymentLinkSchema,
  paymentLinkQuerySchema,
} from '@/lib/validations/billing';
import { generatePaymentLinkCode } from '@/lib/billing/utils';

/**
 * GET /api/payment-links
 * List payment links with pagination and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      accountId: searchParams.get('accountId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = paymentLinkQuerySchema.safeParse(rawParams);

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
      accountId,
      status,
      dateFrom,
      dateTo,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (patientId) where.patientId = patientId;
    if (accountId) where.accountId = accountId;
    if (status) where.status = status;

    // Date range filters
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) (where.createdAt as Record<string, unknown>).gte = dateFrom;
      if (dateTo) (where.createdAt as Record<string, unknown>).lte = dateTo;
    }

    // Search
    if (search) {
      where.OR = [
        { linkCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await db.paymentLink.count({ where });

    // Get paginated results
    const paymentLinks = await db.paymentLink.findMany({
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
        account: {
          select: {
            id: true,
            accountNumber: true,
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            balance: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Count by status
    const statusCounts = await db.paymentLink.groupBy({
      by: ['status'],
      where: withSoftDelete(getClinicFilter(session)),
      _count: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: paymentLinks,
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
  { permissions: ['payment:read'] }
);

/**
 * POST /api/payment-links
 * Create a new payment link
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createPaymentLinkSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payment link data',
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
            phone: true,
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

    // Verify invoice if specified
    if (data.invoiceId) {
      const invoice = await db.invoice.findFirst({
        where: withSoftDelete({
          id: data.invoiceId,
          accountId: data.accountId,
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

    // Generate unique code
    let code: string;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      code = generatePaymentLinkCode();
      const existing = await db.paymentLink.findUnique({
        where: { linkCode: code },
      });
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CODE_GENERATION_FAILED',
            message: 'Failed to generate unique payment link code',
          },
        },
        { status: 500 }
      );
    }

    // Calculate expiry date (default 7 days)
    const expiresAt = data.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Construct the payment URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const linkUrl = `${baseUrl}/pay/${code!}`;

    // Create payment link
    const paymentLink = await db.paymentLink.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: account.patientId,
        accountId: data.accountId,
        invoiceIds: data.invoiceIds || (data.invoiceId ? [data.invoiceId] : []),
        linkCode: code!,
        linkUrl,
        amount: data.amount,
        description: data.description || `Payment for account ${account.accountNumber}`,
        allowPartial: data.allowPartial || false,
        minimumAmount: data.minimumAmount,
        status: 'ACTIVE',
        expiresAt,
        createdBy: session.user.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        account: {
          select: {
            id: true,
            accountNumber: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'PaymentLink',
      entityId: paymentLink.id,
      details: {
        code: paymentLink.linkCode,
        amount: paymentLink.amount,
        patientId: paymentLink.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...paymentLink,
          code: paymentLink.linkCode,
          paymentUrl: paymentLink.linkUrl,
        },
      },
      { status: 201 }
    );
  },
  { permissions: ['payment:create'] }
);
