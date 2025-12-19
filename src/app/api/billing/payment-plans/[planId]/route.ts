import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  updatePaymentPlanSchema,
  pausePaymentPlanSchema,
  cancelPaymentPlanSchema,
} from '@/lib/validations/billing';

/**
 * GET /api/billing/payment-plans/[planId]
 * Get a single payment plan by ID
 */
export const GET = withAuth<{ planId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { planId } = await context.params;

    const plan = await db.paymentPlan.findFirst({
      where: withSoftDelete({
        id: planId,
        ...getClinicFilter(session),
      }),
      include: {
        account: {
          select: {
            id: true,
            accountNumber: true,
            currentBalance: true,
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
        },
        paymentMethod: {
          select: {
            id: true,
            type: true,
            cardBrand: true,
            cardLast4: true,
            nickname: true,
            status: true,
          },
        },
        scheduledPayments: {
          orderBy: { scheduledDate: 'asc' },
          select: {
            id: true,
            scheduledDate: true,
            amount: true,
            status: true,
            processedAt: true,
            resultPaymentId: true,
            failureReason: true,
          },
        },
      },
    });

    if (!plan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payment plan not found',
          },
        },
        { status: 404 }
      );
    }

    // Calculate progress stats
    const completedPaymentsCount = plan.scheduledPayments.filter(p => p.status === 'COMPLETED').length;
    const upcomingPayments = plan.scheduledPayments.filter(p => p.status === 'PENDING');
    const nextPayment = upcomingPayments[0] || null;
    const totalPaid = plan.totalAmount - plan.remainingBalance;

    return NextResponse.json({
      success: true,
      data: {
        ...plan,
        progress: {
          completedPayments: completedPaymentsCount,
          totalPayments: plan.numberOfPayments,
          percentComplete: Math.round((completedPaymentsCount / plan.numberOfPayments) * 100),
          totalPaid,
          nextPayment,
        },
      },
    });
  },
  { permissions: ['billing:read'] }
);

/**
 * PATCH /api/billing/payment-plans/[planId]
 * Update a payment plan
 */
export const PATCH = withAuth<{ planId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { planId } = await context.params;
    const body = await req.json();

    // Check for action-specific handlers
    const { action } = body;

    if (action === 'activate') {
      return handleActivate(req, session, planId);
    } else if (action === 'pause') {
      return handlePause(req, session, planId, body);
    } else if (action === 'cancel') {
      return handleCancel(req, session, planId, body);
    } else if (action === 'resume') {
      return handleResume(req, session, planId);
    }

    // Standard update
    const result = updatePaymentPlanSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid update data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check plan exists
    const existingPlan = await db.paymentPlan.findFirst({
      where: withSoftDelete({
        id: planId,
        ...getClinicFilter(session),
      }),
    });

    if (!existingPlan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payment plan not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if plan can be modified
    if (['COMPLETED', 'CANCELLED'].includes(existingPlan.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PLAN_LOCKED',
            message: `Cannot modify payment plan with status: ${existingPlan.status}`,
          },
        },
        { status: 400 }
      );
    }

    // Verify payment method if changing
    if (data.paymentMethodId && data.paymentMethodId !== existingPlan.paymentMethodId) {
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

    // Update plan
    const plan = await db.paymentPlan.update({
      where: { id: planId },
      data: {
        ...data,
        updatedBy: session.user.id,
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
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PaymentPlan',
      entityId: plan.id,
      details: {
        planNumber: plan.planNumber,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: plan });
  },
  { permissions: ['billing:update'] }
);

/**
 * DELETE /api/billing/payment-plans/[planId]
 * Cancel a payment plan
 */
export const DELETE = withAuth<{ planId: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { planId } = await context.params;

    // Check plan exists
    const existingPlan = await db.paymentPlan.findFirst({
      where: withSoftDelete({
        id: planId,
        ...getClinicFilter(session),
      }),
      include: {
        scheduledPayments: {
          where: { status: 'COMPLETED' },
          select: { id: true },
        },
      },
    });

    if (!existingPlan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Payment plan not found',
          },
        },
        { status: 404 }
      );
    }

    // If plan has completed payments, just mark as cancelled
    if (existingPlan.scheduledPayments.length > 0) {
      await db.paymentPlan.update({
        where: { id: planId },
        data: {
          status: 'CANCELLED',
          updatedBy: session.user.id,
        },
      });

      // Cancel remaining scheduled payments
      await db.scheduledPayment.updateMany({
        where: {
          paymentPlanId: planId,
          status: 'PENDING',
        },
        data: {
          status: 'CANCELLED',
        },
      });
    } else {
      // No completed payments - soft delete
      await db.paymentPlan.update({
        where: { id: planId },
        data: {
          deletedAt: new Date(),
          status: 'CANCELLED',
          updatedBy: session.user.id,
        },
      });

      // Delete scheduled payments
      await db.scheduledPayment.deleteMany({
        where: { paymentPlanId: planId },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'PaymentPlan',
      entityId: planId,
      details: {
        planNumber: existingPlan.planNumber,
        hadCompletedPayments: existingPlan.scheduledPayments.length > 0,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id: planId } });
  },
  { permissions: ['billing:delete'] }
);

// Helper functions for specific actions

async function handleActivate(
  req: Request,
  session: { user: { id: string; clinicId: string } },
  planId: string
) {
  const plan = await db.paymentPlan.findFirst({
    where: withSoftDelete({
      id: planId,
      clinicId: session.user.clinicId,
    }),
  });

  if (!plan) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Payment plan not found' } },
      { status: 404 }
    );
  }

  if (plan.status !== 'PENDING') {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_STATUS', message: 'Only pending plans can be activated' } },
      { status: 400 }
    );
  }

  const updatedPlan = await db.paymentPlan.update({
    where: { id: planId },
    data: {
      status: 'ACTIVE',
      updatedBy: session.user.id,
    },
  });

  const { ipAddress, userAgent } = getRequestMeta(req);
  await logAudit({ user: session.user } as Parameters<typeof logAudit>[0], {
    action: 'UPDATE',
    entity: 'PaymentPlan',
    entityId: planId,
    details: { action: 'activated' },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ success: true, data: updatedPlan });
}

async function handlePause(
  req: Request,
  session: { user: { id: string; clinicId: string } },
  planId: string,
  body: unknown
) {
  const result = pausePaymentPlanSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid pause data',
          details: result.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const plan = await db.paymentPlan.findFirst({
    where: withSoftDelete({
      id: planId,
      clinicId: session.user.clinicId,
    }),
  });

  if (!plan) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Payment plan not found' } },
      { status: 404 }
    );
  }

  if (plan.status !== 'ACTIVE') {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_STATUS', message: 'Only active plans can be paused' } },
      { status: 400 }
    );
  }

  const updatedPlan = await db.paymentPlan.update({
    where: { id: planId },
    data: {
      status: 'PAUSED',
      notes: result.data.reason ? `Paused: ${result.data.reason}` : plan.notes,
      updatedBy: session.user.id,
    },
  });

  const { ipAddress, userAgent } = getRequestMeta(req);
  await logAudit({ user: session.user } as Parameters<typeof logAudit>[0], {
    action: 'UPDATE',
    entity: 'PaymentPlan',
    entityId: planId,
    details: { action: 'paused', reason: result.data.reason },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ success: true, data: updatedPlan });
}

async function handleCancel(
  req: Request,
  session: { user: { id: string; clinicId: string } },
  planId: string,
  body: unknown
) {
  const result = cancelPaymentPlanSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid cancellation data',
          details: result.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  const plan = await db.paymentPlan.findFirst({
    where: withSoftDelete({
      id: planId,
      clinicId: session.user.clinicId,
    }),
  });

  if (!plan) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Payment plan not found' } },
      { status: 404 }
    );
  }

  if (['COMPLETED', 'CANCELLED'].includes(plan.status)) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_STATUS', message: 'Plan is already completed or cancelled' } },
      { status: 400 }
    );
  }

  const updatedPlan = await db.paymentPlan.update({
    where: { id: planId },
    data: {
      status: 'CANCELLED',
      notes: result.data.reason ? `Cancelled: ${result.data.reason}` : plan.notes,
      updatedBy: session.user.id,
    },
  });

  // Cancel remaining scheduled payments
  await db.scheduledPayment.updateMany({
    where: {
      paymentPlanId: planId,
      status: 'PENDING',
    },
    data: {
      status: 'CANCELLED',
    },
  });

  const { ipAddress, userAgent } = getRequestMeta(req);
  await logAudit({ user: session.user } as Parameters<typeof logAudit>[0], {
    action: 'UPDATE',
    entity: 'PaymentPlan',
    entityId: planId,
    details: { action: 'cancelled', reason: result.data.reason },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ success: true, data: updatedPlan });
}

async function handleResume(
  req: Request,
  session: { user: { id: string; clinicId: string } },
  planId: string
) {
  const plan = await db.paymentPlan.findFirst({
    where: withSoftDelete({
      id: planId,
      clinicId: session.user.clinicId,
    }),
  });

  if (!plan) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_FOUND', message: 'Payment plan not found' } },
      { status: 404 }
    );
  }

  if (plan.status !== 'PAUSED') {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_STATUS', message: 'Only paused plans can be resumed' } },
      { status: 400 }
    );
  }

  const updatedPlan = await db.paymentPlan.update({
    where: { id: planId },
    data: {
      status: 'ACTIVE',
      updatedBy: session.user.id,
    },
  });

  const { ipAddress, userAgent } = getRequestMeta(req);
  await logAudit({ user: session.user } as Parameters<typeof logAudit>[0], {
    action: 'UPDATE',
    entity: 'PaymentPlan',
    entityId: planId,
    details: { action: 'resumed' },
    ipAddress,
    userAgent,
  });

  return NextResponse.json({ success: true, data: updatedPlan });
}
