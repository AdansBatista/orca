import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createPaymentPlanSchema,
  paymentPlanQuerySchema,
} from '@/lib/validations/billing';
import { generatePlanNumber, calculatePaymentPlanAmounts } from '@/lib/billing/utils';

/**
 * GET /api/billing/payment-plans
 * List payment plans with pagination and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      accountId: searchParams.get('accountId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      autoPayEnabled: searchParams.get('autoPayEnabled') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = paymentPlanQuerySchema.safeParse(rawParams);

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
      autoPayEnabled,
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
    if (status) where.status = status;
    if (autoPayEnabled !== undefined) where.autoPayEnabled = autoPayEnabled;

    // Date filters
    if (fromDate || toDate) {
      where.startDate = {};
      if (fromDate) (where.startDate as Record<string, Date>).gte = fromDate;
      if (toDate) (where.startDate as Record<string, Date>).lte = toDate;
    }

    // Search
    if (search) {
      where.OR = [
        { planNumber: { contains: search, mode: 'insensitive' } },
        { account: { accountNumber: { contains: search, mode: 'insensitive' } } },
        { account: { patient: { firstName: { contains: search, mode: 'insensitive' } } } },
        { account: { patient: { lastName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    // Get total count
    const total = await db.paymentPlan.count({ where });

    // Get paginated results
    const plans = await db.paymentPlan.findMany({
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
        paymentMethod: {
          select: {
            id: true,
            type: true,
            cardBrand: true,
            cardLast4: true,
            nickname: true,
          },
        },
        _count: {
          select: {
            scheduledPayments: true,
          },
        },
      },
    });

    // Calculate stats
    const stats = await db.paymentPlan.aggregate({
      where: withSoftDelete(getClinicFilter(session)),
      _count: true,
      _sum: {
        totalAmount: true,
        remainingBalance: true,
      },
    });

    // Count by status
    const statusCounts = await db.paymentPlan.groupBy({
      by: ['status'],
      where: withSoftDelete(getClinicFilter(session)),
      _count: true,
      _sum: { remainingBalance: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: plans,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        stats: {
          totalPlans: stats._count,
          totalAmount: stats._sum?.totalAmount || 0,
          totalRemaining: stats._sum?.remainingBalance || 0,
          statusCounts: statusCounts.reduce((acc, item) => {
            acc[item.status] = { count: item._count, remaining: item._sum?.remainingBalance || 0 };
            return acc;
          }, {} as Record<string, { count: number; remaining: number }>),
        },
      },
    });
  },
  { permissions: ['billing:read'] }
);

/**
 * POST /api/billing/payment-plans
 * Create a new payment plan
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createPaymentPlanSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid payment plan data',
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

    // Verify payment method if provided
    if (data.paymentMethodId) {
      const paymentMethod = await db.paymentMethod.findFirst({
        where: {
          id: data.paymentMethodId,
          clinicId: session.user.clinicId,
          status: 'ACTIVE',
        },
      });

      if (!paymentMethod) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PAYMENT_METHOD_NOT_FOUND',
              message: 'Payment method not found or not active',
            },
          },
          { status: 400 }
        );
      }
    }

    // Generate plan number
    const planNumber = await generatePlanNumber(session.user.clinicId);

    // Calculate amounts
    const amounts = calculatePaymentPlanAmounts(
      data.totalAmount,
      data.downPayment,
      data.numberOfPayments
    );

    // Generate payment schedule dates
    const scheduleItems: { scheduledDate: Date; amount: number }[] = [];
    let scheduleDate = new Date(data.startDate);
    for (let i = 0; i < data.numberOfPayments; i++) {
      scheduleItems.push({
        scheduledDate: new Date(scheduleDate),
        amount: amounts.monthlyPayment,
      });
      // Add one month
      scheduleDate.setMonth(scheduleDate.getMonth() + 1);
    }

    // Create payment plan with scheduled payments
    const plan = await db.paymentPlan.create({
      data: {
        clinicId: session.user.clinicId,
        accountId: data.accountId,
        planNumber,
        totalAmount: data.totalAmount,
        downPayment: data.downPayment,
        financedAmount: amounts.financedAmount,
        numberOfPayments: data.numberOfPayments,
        monthlyPayment: amounts.monthlyPayment,
        remainingBalance: amounts.remainingBalance,
        completedPayments: 0,
        startDate: data.startDate,
        endDate: data.endDate,
        nextPaymentDate: scheduleItems[0]?.scheduledDate,
        autoPayEnabled: data.autoPayEnabled,
        paymentMethodId: data.paymentMethodId,
        notes: data.notes,
        status: data.status,
        createdBy: session.user.id,
        updatedBy: session.user.id,
        // Create scheduled payments
        scheduledPayments: {
          create: scheduleItems.map((item) => ({
            clinicId: session.user.clinicId,
            scheduledDate: item.scheduledDate,
            amount: item.amount,
            status: 'PENDING',
            paymentMethodId: data.paymentMethodId,
          })),
        },
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
        paymentMethod: {
          select: {
            id: true,
            type: true,
            cardBrand: true,
            cardLast4: true,
            nickname: true,
          },
        },
        scheduledPayments: {
          orderBy: { scheduledDate: 'asc' },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'PaymentPlan',
      entityId: plan.id,
      details: {
        planNumber: plan.planNumber,
        accountId: plan.accountId,
        totalAmount: plan.totalAmount,
        numberOfPayments: plan.numberOfPayments,
        monthlyPayment: plan.monthlyPayment,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: plan },
      { status: 201 }
    );
  },
  { permissions: ['billing:create'] }
);
