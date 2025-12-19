import { db } from '@/lib/db';
import {
  createPaymentIntent,
  toCents,
  isPaymentSuccessful,
} from '@/lib/payments/stripe';
import { generatePaymentNumber, updateAccountBalance } from '@/lib/billing/utils';

// =============================================================================
// RECURRING BILLING ENGINE
// =============================================================================

/**
 * Configuration for the recurring billing engine
 */
export interface RecurringBillingConfig {
  maxRetryAttempts: number;
  retryDelayDays: number[];
  notifyOnFailure: boolean;
  notifyOnSuccess: boolean;
}

const DEFAULT_CONFIG: RecurringBillingConfig = {
  maxRetryAttempts: 3,
  retryDelayDays: [1, 3, 7], // Retry after 1 day, then 3 days, then 7 days
  notifyOnFailure: true,
  notifyOnSuccess: true,
};

/**
 * Result of processing a scheduled payment
 */
export interface ProcessingResult {
  scheduledPaymentId: string;
  success: boolean;
  paymentId?: string;
  error?: string;
  retryScheduled?: boolean;
  nextRetryDate?: Date;
}

/**
 * Process all due scheduled payments for a clinic
 * This should be called by a cron job or scheduled task
 */
export async function processDuePayments(
  clinicId: string,
  config: Partial<RecurringBillingConfig> = {}
): Promise<ProcessingResult[]> {
  const settings = { ...DEFAULT_CONFIG, ...config };
  const results: ProcessingResult[] = [];

  // Find all due scheduled payments
  const duePayments = await db.scheduledPayment.findMany({
    where: {
      clinicId,
      status: 'PENDING',
      scheduledDate: {
        lte: new Date(),
      },
    },
    include: {
      paymentPlan: {
        include: {
          account: {
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
          },
          paymentMethod: {
            select: {
              id: true,
              gatewayCustomerId: true,
              gatewayMethodId: true,
            },
          },
        },
      },
    },
    orderBy: {
      scheduledDate: 'asc',
    },
  });

  for (const scheduledPayment of duePayments) {
    const result = await processScheduledPayment(scheduledPayment, settings);
    results.push(result);
  }

  return results;
}

/**
 * Process a single scheduled payment
 */
export async function processScheduledPayment(
  scheduledPayment: {
    id: string;
    clinicId: string;
    paymentPlanId: string;
    amount: number;
    scheduledDate: Date;
    attemptCount: number;
    paymentPlan: {
      id: string;
      accountId: string;
      autoPayEnabled: boolean;
      paymentMethod?: {
        id: string;
        gatewayCustomerId?: string | null;
        gatewayMethodId?: string | null;
      } | null;
      account: {
        id: string;
        patientId: string;
        patient: {
          id: string;
          firstName: string;
          lastName: string;
          email?: string | null;
        };
      };
    };
  },
  config: RecurringBillingConfig
): Promise<ProcessingResult> {
  const { paymentPlan, clinicId } = scheduledPayment;
  const { account, paymentMethod } = paymentPlan;

  // Check if auto-charge is enabled
  if (!paymentPlan.autoPayEnabled) {
    return {
      scheduledPaymentId: scheduledPayment.id,
      success: false,
      error: 'Auto-pay is not enabled for this payment plan',
    };
  }

  // Check if patient has a payment method with Stripe customer ID
  if (!paymentMethod?.gatewayCustomerId) {
    await markPaymentFailed(scheduledPayment.id, 'No Stripe customer ID on file');
    return {
      scheduledPaymentId: scheduledPayment.id,
      success: false,
      error: 'No Stripe customer ID on file',
    };
  }

  // Get the payment method ID
  const paymentMethodId = paymentMethod.gatewayMethodId;
  if (!paymentMethodId) {
    await markPaymentFailed(scheduledPayment.id, 'No payment method on file');
    return {
      scheduledPaymentId: scheduledPayment.id,
      success: false,
      error: 'No payment method on file',
    };
  }

  try {
    // Mark as processing
    await db.scheduledPayment.update({
      where: { id: scheduledPayment.id },
      data: { status: 'PROCESSING' },
    });

    // Create payment intent and charge
    const paymentIntent = await createPaymentIntent({
      amount: toCents(scheduledPayment.amount),
      customerId: paymentMethod.gatewayCustomerId,
      paymentMethodId,
      description: `Scheduled payment for payment plan`,
      receiptEmail: account.patient.email || undefined,
      metadata: {
        scheduledPaymentId: scheduledPayment.id,
        paymentPlanId: paymentPlan.id,
        clinicId,
        type: 'recurring',
      },
    });

    if (isPaymentSuccessful(paymentIntent)) {
      // Payment succeeded - create payment record
      const paymentNumber = await generatePaymentNumber(clinicId);

      const payment = await db.payment.create({
        data: {
          clinicId,
          patientId: account.patientId,
          accountId: account.id,
          paymentNumber,
          amount: scheduledPayment.amount,
          paymentDate: new Date(),
          paymentType: 'PATIENT',
          paymentMethodType: 'CREDIT_CARD',
          status: 'COMPLETED',
          gatewayPaymentId: paymentIntent.id,
          gateway: 'STRIPE',
          sourceType: 'PAYMENT_PLAN',
          sourceId: paymentPlan.id,
          paymentMethodId: paymentMethod.id,
          description: `Automatic payment for payment plan`,
          metadata: {
            scheduledPaymentId: scheduledPayment.id,
            paymentPlanId: paymentPlan.id,
          },
        },
      });

      // Update scheduled payment
      await db.scheduledPayment.update({
        where: { id: scheduledPayment.id },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
          resultPaymentId: payment.id,
        },
      });

      // Update account balance
      await updateAccountBalance(account.id, clinicId, 'system');

      // Check if all scheduled payments are complete
      await checkPaymentPlanCompletion(paymentPlan.id);

      return {
        scheduledPaymentId: scheduledPayment.id,
        success: true,
        paymentId: payment.id,
      };
    } else {
      // Payment requires action or failed
      throw new Error(`Payment status: ${paymentIntent.status}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Check if we should retry
    if (scheduledPayment.attemptCount < config.maxRetryAttempts) {
      const retryDelayDays = config.retryDelayDays[scheduledPayment.attemptCount] || 7;
      const nextRetryDate = new Date();
      nextRetryDate.setDate(nextRetryDate.getDate() + retryDelayDays);

      await db.scheduledPayment.update({
        where: { id: scheduledPayment.id },
        data: {
          status: 'PENDING',
          attemptCount: scheduledPayment.attemptCount + 1,
          lastAttemptAt: new Date(),
          failureReason: errorMessage,
          scheduledDate: nextRetryDate,
        },
      });

      return {
        scheduledPaymentId: scheduledPayment.id,
        success: false,
        error: errorMessage,
        retryScheduled: true,
        nextRetryDate,
      };
    } else {
      // Max retries reached
      await markPaymentFailed(scheduledPayment.id, errorMessage);

      return {
        scheduledPaymentId: scheduledPayment.id,
        success: false,
        error: `Max retries reached: ${errorMessage}`,
      };
    }
  }
}

/**
 * Mark a scheduled payment as failed
 */
async function markPaymentFailed(scheduledPaymentId: string, error: string): Promise<void> {
  await db.scheduledPayment.update({
    where: { id: scheduledPaymentId },
    data: {
      status: 'FAILED',
      failureReason: error,
    },
  });
}

/**
 * Check if a payment plan is complete (all scheduled payments paid)
 */
async function checkPaymentPlanCompletion(paymentPlanId: string): Promise<void> {
  const unpaidCount = await db.scheduledPayment.count({
    where: {
      paymentPlanId,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
  });

  if (unpaidCount === 0) {
    await db.paymentPlan.update({
      where: { id: paymentPlanId },
      data: {
        status: 'COMPLETED',
      },
    });
  }
}

/**
 * Get scheduled payments that need attention (failed, overdue)
 */
export async function getPaymentsNeedingAttention(clinicId: string): Promise<{
  failed: number;
  overdue: number;
  dueToday: number;
  upcomingWeek: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [failed, overdue, dueToday, upcomingWeek] = await Promise.all([
    db.scheduledPayment.count({
      where: {
        clinicId,
        status: 'FAILED',
      },
    }),
    db.scheduledPayment.count({
      where: {
        clinicId,
        status: 'PENDING',
        scheduledDate: { lt: today },
      },
    }),
    db.scheduledPayment.count({
      where: {
        clinicId,
        status: 'PENDING',
        scheduledDate: { gte: today, lt: tomorrow },
      },
    }),
    db.scheduledPayment.count({
      where: {
        clinicId,
        status: 'PENDING',
        scheduledDate: { gte: today, lt: nextWeek },
      },
    }),
  ]);

  return { failed, overdue, dueToday, upcomingWeek };
}

/**
 * Manually retry a failed scheduled payment
 */
export async function retryScheduledPayment(
  scheduledPaymentId: string,
  config: Partial<RecurringBillingConfig> = {}
): Promise<ProcessingResult> {
  const scheduledPayment = await db.scheduledPayment.findUnique({
    where: { id: scheduledPaymentId },
    include: {
      paymentPlan: {
        include: {
          account: {
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
          },
          paymentMethod: {
            select: {
              id: true,
              gatewayCustomerId: true,
              gatewayMethodId: true,
            },
          },
        },
      },
    },
  });

  if (!scheduledPayment) {
    return {
      scheduledPaymentId,
      success: false,
      error: 'Scheduled payment not found',
    };
  }

  if (scheduledPayment.status === 'COMPLETED') {
    return {
      scheduledPaymentId,
      success: false,
      error: 'Payment has already been completed',
    };
  }

  // Reset status to allow processing
  await db.scheduledPayment.update({
    where: { id: scheduledPaymentId },
    data: {
      status: 'PENDING',
      scheduledDate: new Date(), // Set to now to process immediately
    },
  });

  const settings = { ...DEFAULT_CONFIG, ...config };
  return processScheduledPayment(scheduledPayment, settings);
}

/**
 * Skip a scheduled payment (for payment plan adjustments)
 */
export async function skipScheduledPayment(
  scheduledPaymentId: string,
  _reason: string
): Promise<void> {
  await db.scheduledPayment.update({
    where: { id: scheduledPaymentId },
    data: {
      status: 'SKIPPED',
    },
  });
}

/**
 * Generate upcoming scheduled payments for payment plans
 * This is typically called when creating/updating a payment plan
 */
export async function generateScheduledPayments(
  paymentPlanId: string,
  startDate: Date,
  numberOfPayments: number,
  amount: number,
  frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
): Promise<void> {
  const paymentPlan = await db.paymentPlan.findUnique({
    where: { id: paymentPlanId },
    select: { clinicId: true, accountId: true },
  });

  if (!paymentPlan) {
    throw new Error('Payment plan not found');
  }

  const payments: Array<{
    clinicId: string;
    paymentPlanId: string;
    amount: number;
    scheduledDate: Date;
    status: 'PENDING';
    attemptCount: number;
  }> = [];

  let currentDate = new Date(startDate);

  for (let i = 0; i < numberOfPayments; i++) {
    payments.push({
      clinicId: paymentPlan.clinicId,
      paymentPlanId,
      amount,
      scheduledDate: new Date(currentDate),
      status: 'PENDING' as const,
      attemptCount: 0,
    });

    // Advance to next payment date based on frequency
    switch (frequency) {
      case 'WEEKLY':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'BIWEEKLY':
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'MONTHLY':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
    }
  }

  await db.scheduledPayment.createMany({
    data: payments,
  });
}
