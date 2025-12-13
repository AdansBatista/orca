import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createPaymentSchema,
  paymentQuerySchema,
} from '@/lib/validations/billing';
import { generatePaymentNumber, updateAccountBalance } from '@/lib/billing/utils';
import {
  createPaymentIntent,
  toCents,
  fromCents,
  isPaymentSuccessful,
} from '@/lib/payments/stripe';

/**
 * GET /api/payments
 * List payments with pagination, search, and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      accountId: searchParams.get('accountId') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      invoiceId: searchParams.get('invoiceId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      paymentType: searchParams.get('paymentType') ?? undefined,
      paymentMethodType: searchParams.get('paymentMethodType') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      minAmount: searchParams.get('minAmount') ?? undefined,
      maxAmount: searchParams.get('maxAmount') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = paymentQuerySchema.safeParse(rawParams);

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
      invoiceId,
      status,
      paymentType,
      paymentMethodType,
      dateFrom,
      dateTo,
      minAmount,
      maxAmount,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with standardized soft delete filter
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (accountId) where.accountId = accountId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (paymentType) where.paymentType = paymentType;
    if (paymentMethodType) where.paymentMethodType = paymentMethodType;

    // Filter by invoice via allocations
    if (invoiceId) {
      where.allocations = { some: { invoiceId } };
    }

    // Date range filters
    if (dateFrom || dateTo) {
      where.paymentDate = {};
      if (dateFrom) (where.paymentDate as Record<string, unknown>).gte = dateFrom;
      if (dateTo) (where.paymentDate as Record<string, unknown>).lte = dateTo;
    }

    // Amount range filters
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) (where.amount as Record<string, unknown>).gte = minAmount;
      if (maxAmount !== undefined) (where.amount as Record<string, unknown>).lte = maxAmount;
    }

    // Search across payment number and patient name
    if (search) {
      where.OR = [
        { paymentNumber: { contains: search, mode: 'insensitive' } },
        { patient: { firstName: { contains: search, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search, mode: 'insensitive' } } },
        { account: { accountNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get total count
    const total = await db.payment.count({ where });

    // Get paginated results
    const payments = await db.payment.findMany({
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
          },
        },
        account: {
          select: {
            id: true,
            accountNumber: true,
          },
        },
        allocations: {
          select: {
            id: true,
            invoiceId: true,
            amount: true,
            invoice: {
              select: {
                invoiceNumber: true,
              },
            },
          },
        },
        processedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Calculate stats for the filtered results
    const stats = await db.payment.aggregate({
      where: withSoftDelete(getClinicFilter(session)),
      _count: true,
      _sum: {
        amount: true,
      },
    });

    // Today's payments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPayments = await db.payment.aggregate({
      where: {
        ...withSoftDelete(getClinicFilter(session)),
        paymentDate: { gte: today },
        status: 'COMPLETED',
      },
      _count: true,
      _sum: {
        amount: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: payments,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          totalPayments: stats._count,
          totalAmount: stats._sum.amount || 0,
          todayPayments: todayPayments._count,
          todayAmount: todayPayments._sum.amount || 0,
        },
      },
    });
  },
  { permissions: ['payment:read'] }
);

/**
 * POST /api/payments
 * Create and process a new payment
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createPaymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payment data',
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
            stripeCustomerId: true,
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

    // Verify patient matches
    if (data.patientId && data.patientId !== account.patientId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENT_MISMATCH',
            message: 'Patient ID does not match account',
          },
        },
        { status: 400 }
      );
    }

    // Verify invoices if specified for allocation
    if (data.allocations && data.allocations.length > 0) {
      const invoiceIds = data.allocations.map((a) => a.invoiceId);
      const invoices = await db.invoice.findMany({
        where: {
          id: { in: invoiceIds },
          accountId: data.accountId,
          clinicId: session.user.clinicId,
          status: { in: ['PENDING', 'SENT', 'PARTIAL', 'OVERDUE'] },
          deletedAt: null,
        },
      });

      if (invoices.length !== invoiceIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_INVOICES',
              message: 'One or more invoices not found or not eligible for payment',
            },
          },
          { status: 400 }
        );
      }
    }

    // Generate payment number
    const paymentNumber = await generatePaymentNumber(session.user.clinicId);

    // Determine initial status based on payment method
    let paymentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' = 'PENDING';
    let gatewayPaymentId: string | null = null;
    let gatewayResponse: unknown = null;

    // For card payments, create a Stripe payment intent
    if (
      data.paymentMethodType === 'CREDIT_CARD' ||
      data.paymentMethodType === 'DEBIT_CARD'
    ) {
      if (data.gateway === 'STRIPE' || !data.gateway) {
        try {
          const paymentIntent = await createPaymentIntent({
            amount: toCents(data.amount),
            currency: 'cad',
            customerId: account.patient.stripeCustomerId ?? undefined,
            paymentMethodId: data.paymentMethodId ?? undefined,
            description: `Payment for account ${account.accountNumber}`,
            metadata: {
              clinicId: session.user.clinicId,
              accountId: data.accountId,
              paymentNumber,
            },
            captureMethod: data.captureMethod === 'MANUAL' ? 'manual' : 'automatic',
            receiptEmail: account.patient.email ?? undefined,
          });

          gatewayPaymentId = paymentIntent.id;
          gatewayResponse = {
            clientSecret: paymentIntent.client_secret,
            status: paymentIntent.status,
          };

          // Update status based on payment intent result
          if (isPaymentSuccessful(paymentIntent)) {
            paymentStatus = 'COMPLETED';
          } else if (paymentIntent.status === 'processing') {
            paymentStatus = 'PROCESSING';
          } else {
            paymentStatus = 'PENDING';
          }
        } catch (error) {
          const stripeError = error as { message?: string };
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'PAYMENT_FAILED',
                message: stripeError.message || 'Failed to create payment',
              },
            },
            { status: 400 }
          );
        }
      }
    } else if (data.paymentMethodType === 'CASH' || data.paymentMethodType === 'CHECK') {
      // Cash and check payments are immediately completed
      paymentStatus = 'COMPLETED';
    }

    // Create the payment record
    const payment = await db.payment.create({
      data: {
        clinicId: session.user.clinicId,
        accountId: data.accountId,
        patientId: account.patientId,
        paymentNumber,
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentType: data.paymentType,
        paymentMethodType: data.paymentMethodType,
        sourceType: data.sourceType,
        gateway: data.gateway ?? 'STRIPE',
        gatewayPaymentId,
        gatewayResponse: gatewayResponse ? JSON.stringify(gatewayResponse) : null,
        status: paymentStatus,
        // Card details (last 4 only, from gateway)
        cardLast4: data.cardLast4,
        cardBrand: data.cardBrand,
        cardExpiry: data.cardExpiry,
        // Check details
        checkNumber: data.checkNumber,
        checkBank: data.checkBank,
        notes: data.notes,
        processedBy: session.user.id,
        processedAt: paymentStatus === 'COMPLETED' ? new Date() : null,
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

    // If payment is completed, create allocations and update balances
    if (paymentStatus === 'COMPLETED' && data.allocations && data.allocations.length > 0) {
      for (const allocation of data.allocations) {
        await db.paymentAllocation.create({
          data: {
            paymentId: payment.id,
            invoiceId: allocation.invoiceId,
            amount: allocation.amount,
            allocatedBy: session.user.id,
          },
        });

        // Update invoice balance
        const invoice = await db.invoice.findUnique({
          where: { id: allocation.invoiceId },
        });

        if (invoice) {
          const newBalance = Math.max(0, invoice.balance - allocation.amount);
          const newStatus = newBalance === 0 ? 'PAID' : 'PARTIAL';

          await db.invoice.update({
            where: { id: allocation.invoiceId },
            data: {
              balance: newBalance,
              status: newStatus,
              paidAt: newBalance === 0 ? new Date() : null,
              updatedBy: session.user.id,
            },
          });
        }
      }

      // Update account balance
      await updateAccountBalance(data.accountId, session.user.clinicId, session.user.id);
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Payment',
      entityId: payment.id,
      details: {
        paymentNumber: payment.paymentNumber,
        amount: payment.amount,
        paymentMethodType: payment.paymentMethodType,
        status: payment.status,
        accountId: payment.accountId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...payment,
          // Include client secret for frontend confirmation if needed
          clientSecret:
            gatewayResponse &&
            typeof gatewayResponse === 'object' &&
            'clientSecret' in gatewayResponse
              ? (gatewayResponse as { clientSecret: string }).clientSecret
              : null,
        },
      },
      { status: 201 }
    );
  },
  { permissions: ['payment:process'] }
);
