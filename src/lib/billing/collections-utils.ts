import { db } from '@/lib/db';

// =============================================================================
// COLLECTIONS MANAGEMENT - Utility Functions
// =============================================================================

/**
 * Generate a unique write-off number
 * Format: WO-YYYY-NNNNN (e.g., WO-2024-00001)
 */
export async function generateWriteOffNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `WO-${year}-`;

  const lastWriteOff = await db.writeOff.findFirst({
    where: {
      clinicId,
      writeOffNumber: { startsWith: prefix },
    },
    orderBy: { writeOffNumber: 'desc' },
    select: { writeOffNumber: true },
  });

  let nextNumber = 1;
  if (lastWriteOff?.writeOffNumber) {
    const lastNumber = parseInt(lastWriteOff.writeOffNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

/**
 * Calculate aging bucket from days overdue
 */
export function getAgingBucket(daysOverdue: number): string {
  if (daysOverdue <= 0) return 'CURRENT';
  if (daysOverdue <= 30) return '1_30';
  if (daysOverdue <= 60) return '31_60';
  if (daysOverdue <= 90) return '61_90';
  if (daysOverdue <= 120) return '91_120';
  return '120_PLUS';
}

/**
 * Calculate days overdue from due date
 */
export function calculateDaysOverdue(dueDate: Date | null | undefined): number {
  if (!dueDate) return 0;

  const now = new Date();
  const due = new Date(dueDate);
  const diffTime = now.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Get aging bucket display label
 */
export function getAgingBucketLabel(bucket: string): string {
  switch (bucket) {
    case 'CURRENT':
      return 'Current';
    case '1_30':
      return '1-30 Days';
    case '31_60':
      return '31-60 Days';
    case '61_90':
      return '61-90 Days';
    case '91_120':
      return '91-120 Days';
    case '120_PLUS':
      return '120+ Days';
    default:
      return bucket;
  }
}

/**
 * Get collection status display color
 */
export function getCollectionStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'blue';
    case 'PAUSED':
      return 'yellow';
    case 'PAYMENT_PLAN':
      return 'purple';
    case 'SETTLED':
      return 'green';
    case 'WRITTEN_OFF':
      return 'gray';
    case 'AGENCY':
      return 'red';
    case 'COMPLETED':
      return 'green';
    default:
      return 'gray';
  }
}

/**
 * Get collection status display text
 */
export function getCollectionStatusText(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'Active';
    case 'PAUSED':
      return 'Paused';
    case 'PAYMENT_PLAN':
      return 'Payment Plan';
    case 'SETTLED':
      return 'Settled';
    case 'WRITTEN_OFF':
      return 'Written Off';
    case 'AGENCY':
      return 'With Agency';
    case 'COMPLETED':
      return 'Completed';
    default:
      return status;
  }
}

/**
 * Get promise status display color
 */
export function getPromiseStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'yellow';
    case 'FULFILLED':
      return 'green';
    case 'PARTIAL':
      return 'blue';
    case 'BROKEN':
      return 'red';
    case 'CANCELLED':
      return 'gray';
    default:
      return 'gray';
  }
}

/**
 * Get write-off status display color
 */
export function getWriteOffStatusColor(status: string): string {
  switch (status) {
    case 'PENDING':
      return 'yellow';
    case 'APPROVED':
      return 'green';
    case 'REJECTED':
      return 'red';
    case 'PARTIALLY_RECOVERED':
      return 'blue';
    case 'FULLY_RECOVERED':
      return 'green';
    default:
      return 'gray';
  }
}

/**
 * Get write-off reason display text
 */
export function getWriteOffReasonText(reason: string): string {
  switch (reason) {
    case 'BANKRUPTCY':
      return 'Bankruptcy';
    case 'DECEASED':
      return 'Deceased';
    case 'UNCOLLECTIBLE':
      return 'Uncollectible';
    case 'STATUTE_OF_LIMITATIONS':
      return 'Statute of Limitations';
    case 'SMALL_BALANCE':
      return 'Small Balance';
    case 'HARDSHIP':
      return 'Financial Hardship';
    case 'OTHER':
      return 'Other';
    default:
      return reason;
  }
}

/**
 * Get reminder type display text
 */
export function getReminderTypeText(type: string): string {
  switch (type) {
    case 'UPCOMING_DUE':
      return 'Upcoming Due';
    case 'PAST_DUE_GENTLE':
      return 'Friendly Reminder';
    case 'PAST_DUE_FIRM':
      return 'Firm Reminder';
    case 'PAST_DUE_URGENT':
      return 'Urgent Notice';
    case 'FINAL_NOTICE':
      return 'Final Notice';
    case 'PAYMENT_PLAN_DUE':
      return 'Payment Plan Due';
    case 'PAYMENT_PLAN_LATE':
      return 'Payment Plan Late';
    default:
      return type;
  }
}

/**
 * Calculate collection effectiveness metrics
 */
export interface CollectionEffectiveness {
  totalAccounts: number;
  completedAccounts: number;
  completionRate: number;
  totalStartingBalance: number;
  totalCollected: number;
  collectionRate: number;
  avgDaysToComplete: number;
}

export async function calculateWorkflowEffectiveness(
  clinicId: string,
  workflowId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<CollectionEffectiveness> {
  const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (fromDate) dateFilter.createdAt = { ...dateFilter.createdAt, gte: fromDate };
  if (toDate) dateFilter.createdAt = { ...dateFilter.createdAt, lte: toDate };

  const accounts = await db.accountCollection.findMany({
    where: {
      clinicId,
      workflowId,
      ...dateFilter,
    },
    select: {
      status: true,
      startingBalance: true,
      paidAmount: true,
      startedAt: true,
      completedAt: true,
    },
  });

  const result: CollectionEffectiveness = {
    totalAccounts: accounts.length,
    completedAccounts: 0,
    completionRate: 0,
    totalStartingBalance: 0,
    totalCollected: 0,
    collectionRate: 0,
    avgDaysToComplete: 0,
  };

  let totalDaysToComplete = 0;
  let completedWithDates = 0;

  for (const account of accounts) {
    result.totalStartingBalance += account.startingBalance;
    result.totalCollected += account.paidAmount;

    if (['COMPLETED', 'SETTLED'].includes(account.status)) {
      result.completedAccounts++;

      if (account.completedAt) {
        const days = Math.floor(
          (new Date(account.completedAt).getTime() - new Date(account.startedAt).getTime()) /
          (1000 * 60 * 60 * 24)
        );
        totalDaysToComplete += days;
        completedWithDates++;
      }
    }
  }

  // Calculate rates
  if (accounts.length > 0) {
    result.completionRate = Math.round((result.completedAccounts / accounts.length) * 100 * 10) / 10;
  }

  if (result.totalStartingBalance > 0) {
    result.collectionRate = Math.round((result.totalCollected / result.totalStartingBalance) * 100 * 10) / 10;
  }

  if (completedWithDates > 0) {
    result.avgDaysToComplete = Math.round(totalDaysToComplete / completedWithDates);
  }

  // Round monetary values
  result.totalStartingBalance = Math.round(result.totalStartingBalance * 100) / 100;
  result.totalCollected = Math.round(result.totalCollected * 100) / 100;

  return result;
}

/**
 * Calculate aging summary for a clinic
 */
export interface AgingSummary {
  totalAR: number;
  patientAR: number;
  insuranceAR: number;
  buckets: {
    current: number;
    days1_30: number;
    days31_60: number;
    days61_90: number;
    days91_120: number;
    days120Plus: number;
  };
  accountCount: number;
  avgDaysOutstanding: number;
}

export async function calculateAgingSummary(
  clinicId: string,
  includeZeroBalance = false
): Promise<AgingSummary> {
  const accounts = await db.patientAccount.findMany({
    where: {
      clinicId,
      deletedAt: null,
      ...(includeZeroBalance ? {} : { currentBalance: { gt: 0 } }),
    },
    select: {
      currentBalance: true,
      aging30: true,
      aging60: true,
      aging90: true,
      aging120Plus: true,
      insuranceBalance: true,
      patientBalance: true,
      createdAt: true, // Use createdAt as proxy for oldest date
    },
  });

  const summary: AgingSummary = {
    totalAR: 0,
    patientAR: 0,
    insuranceAR: 0,
    buckets: {
      current: 0,
      days1_30: 0,
      days31_60: 0,
      days61_90: 0,
      days91_120: 0,
      days120Plus: 0,
    },
    accountCount: accounts.length,
    avgDaysOutstanding: 0,
  };

  let totalDaysOutstanding = 0;
  let accountsWithDates = 0;

  for (const account of accounts) {
    summary.totalAR += account.currentBalance || 0;
    summary.patientAR += account.patientBalance || 0;
    summary.insuranceAR += account.insuranceBalance || 0;

    // current bucket is calculated as total minus other aging buckets
    const currentBucket = (account.currentBalance || 0) -
      (account.aging30 || 0) - (account.aging60 || 0) -
      (account.aging90 || 0) - (account.aging120Plus || 0);
    summary.buckets.current += Math.max(0, currentBucket);
    summary.buckets.days1_30 += account.aging30 || 0;
    summary.buckets.days31_60 += account.aging60 || 0;
    summary.buckets.days61_90 += account.aging90 || 0;
    summary.buckets.days91_120 += 0; // Not tracked separately
    summary.buckets.days120Plus += account.aging120Plus || 0;

    // Use createdAt as proxy for days outstanding calculation
    if (account.createdAt) {
      const days = calculateDaysOverdue(account.createdAt);
      totalDaysOutstanding += days;
      accountsWithDates++;
    }
  }

  if (accountsWithDates > 0) {
    summary.avgDaysOutstanding = Math.round(totalDaysOutstanding / accountsWithDates);
  }

  // Round monetary values
  summary.totalAR = Math.round(summary.totalAR * 100) / 100;
  summary.patientAR = Math.round(summary.patientAR * 100) / 100;
  summary.insuranceAR = Math.round(summary.insuranceAR * 100) / 100;
  summary.buckets.current = Math.round(summary.buckets.current * 100) / 100;
  summary.buckets.days1_30 = Math.round(summary.buckets.days1_30 * 100) / 100;
  summary.buckets.days31_60 = Math.round(summary.buckets.days31_60 * 100) / 100;
  summary.buckets.days61_90 = Math.round(summary.buckets.days61_90 * 100) / 100;
  summary.buckets.days91_120 = Math.round(summary.buckets.days91_120 * 100) / 100;
  summary.buckets.days120Plus = Math.round(summary.buckets.days120Plus * 100) / 100;

  return summary;
}

/**
 * Calculate Days Sales Outstanding (DSO)
 */
export async function calculateDSO(
  clinicId: string,
  periodDays: number = 90
): Promise<number> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  // Get total AR
  const arResult = await db.patientAccount.aggregate({
    where: {
      clinicId,
      deletedAt: null,
    },
    _sum: {
      currentBalance: true,
    },
  });

  const totalAR = arResult._sum.currentBalance || 0;

  // Get credit sales (invoices) in the period
  const salesResult = await db.invoice.aggregate({
    where: {
      clinicId,
      deletedAt: null,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      subtotal: true,
    },
  });

  const totalSales = salesResult._sum?.subtotal || 0;

  if (totalSales === 0) return 0;

  // DSO = (Average AR / Total Credit Sales) × Days in Period
  const dso = (totalAR / totalSales) * periodDays;

  return Math.round(dso * 10) / 10;
}

/**
 * Check if account is eligible for agency referral
 */
export async function checkAgencyEligibility(
  accountId: string,
  clinicId: string
): Promise<{
  eligible: boolean;
  reason?: string;
  daysOverdue: number;
  balance: number;
}> {
  const account = await db.patientAccount.findFirst({
    where: {
      id: accountId,
      clinicId,
      deletedAt: null,
    },
    select: {
      currentBalance: true,
      aging30: true,
      aging60: true,
      aging90: true,
      aging120Plus: true,
      status: true,
    },
  });

  if (!account) {
    return { eligible: false, reason: 'Account not found', daysOverdue: 0, balance: 0 };
  }

  const balance = account.currentBalance || 0;
  // Calculate days overdue from aging buckets
  let daysOverdue = 0;
  if (account.aging120Plus && account.aging120Plus > 0) daysOverdue = 120;
  else if (account.aging90 && account.aging90 > 0) daysOverdue = 90;
  else if (account.aging60 && account.aging60 > 0) daysOverdue = 60;
  else if (account.aging30 && account.aging30 > 0) daysOverdue = 30;

  // Check if already in collection status
  if (account.status === 'COLLECTIONS') {
    return { eligible: false, reason: 'Already in collections', daysOverdue, balance };
  }

  // Check existing agency referral
  const existingReferral = await db.agencyReferral.findFirst({
    where: {
      accountId,
      clinicId,
      status: { in: ['ACTIVE', 'PARTIAL'] },
    },
  });

  if (existingReferral) {
    return { eligible: false, reason: 'Already referred to agency', daysOverdue, balance };
  }

  // Check if there's an active payment plan
  const activePlan = await db.paymentPlan.findFirst({
    where: {
      accountId,
      clinicId,
      status: 'ACTIVE',
      deletedAt: null,
    },
  });

  if (activePlan) {
    return { eligible: false, reason: 'Active payment plan exists', daysOverdue, balance };
  }

  return { eligible: true, daysOverdue, balance };
}

/**
 * Create a collection activity log entry
 */
export async function logCollectionActivity(
  accountCollectionId: string,
  activityType: string,
  description: string,
  performedBy?: string,
  options?: {
    stageNumber?: number;
    channel?: string;
    templateUsed?: string;
    sentTo?: string;
    result?: string;
    responseReceived?: boolean;
    paymentReceived?: number;
  }
): Promise<void> {
  await db.collectionActivity.create({
    data: {
      accountCollectionId,
      activityType: activityType as never,
      description,
      performedBy,
      stageNumber: options?.stageNumber,
      channel: options?.channel as never,
      templateUsed: options?.templateUsed,
      sentTo: options?.sentTo,
      result: options?.result,
      responseReceived: options?.responseReceived,
      paymentReceived: options?.paymentReceived,
    },
  });
}

/**
 * Start a collection workflow for an account
 */
export async function startCollectionWorkflow(
  accountId: string,
  workflowId: string,
  clinicId: string,
  userId: string
): Promise<{ success: boolean; accountCollectionId?: string; error?: string }> {
  // Check if account is already in a collection workflow
  const existingCollection = await db.accountCollection.findFirst({
    where: {
      accountId,
      clinicId,
      status: { in: ['ACTIVE', 'PAUSED', 'PAYMENT_PLAN'] },
    },
  });

  if (existingCollection) {
    return { success: false, error: 'Account is already in a collection workflow' };
  }

  // Get account balance
  const account = await db.patientAccount.findFirst({
    where: {
      id: accountId,
      clinicId,
      deletedAt: null,
    },
    select: {
      currentBalance: true,
    },
  });

  if (!account) {
    return { success: false, error: 'Account not found' };
  }

  // Create the account collection record
  const accountCollection = await db.accountCollection.create({
    data: {
      clinicId,
      accountId,
      workflowId,
      status: 'ACTIVE',
      currentStage: 1,
      startingBalance: account.currentBalance || 0,
      currentBalance: account.currentBalance || 0,
      startedAt: new Date(),
      enteredStageAt: new Date(),
    },
  });

  // Log the workflow start
  await logCollectionActivity(
    accountCollection.id,
    'WORKFLOW_STARTED',
    'Collection workflow started',
    userId,
    { stageNumber: 1 }
  );

  return { success: true, accountCollectionId: accountCollection.id };
}

/**
 * Advance account to next collection stage
 */
export async function advanceToNextStage(
  accountCollectionId: string,
  userId: string,
  notes?: string
): Promise<{ success: boolean; newStage?: number; error?: string }> {
  const accountCollection = await db.accountCollection.findUnique({
    where: { id: accountCollectionId },
    include: {
      workflow: {
        include: {
          stages: {
            orderBy: { stageNumber: 'asc' },
          },
        },
      },
    },
  });

  if (!accountCollection) {
    return { success: false, error: 'Account collection not found' };
  }

  if (accountCollection.status !== 'ACTIVE') {
    return { success: false, error: 'Account collection is not active' };
  }

  const currentStageIndex = accountCollection.workflow.stages.findIndex(
    s => s.stageNumber === accountCollection.currentStage
  );

  if (currentStageIndex === -1 || currentStageIndex >= accountCollection.workflow.stages.length - 1) {
    return { success: false, error: 'Already at final stage' };
  }

  const nextStage = accountCollection.workflow.stages[currentStageIndex + 1];

  // Update to next stage
  await db.accountCollection.update({
    where: { id: accountCollectionId },
    data: {
      currentStage: nextStage.stageNumber,
      enteredStageAt: new Date(),
      lastActionAt: new Date(),
    },
  });

  // Log the stage advancement
  await logCollectionActivity(
    accountCollectionId,
    'STAGE_ADVANCED',
    notes || `Advanced to stage ${nextStage.stageNumber}: ${nextStage.name}`,
    userId,
    { stageNumber: nextStage.stageNumber }
  );

  return { success: true, newStage: nextStage.stageNumber };
}

/**
 * Calculate collection summary statistics
 */
export interface CollectionSummary {
  activeAccounts: number;
  pausedAccounts: number;
  atAgencyAccounts: number;
  totalBalance: number;
  totalCollected: number;
  pendingPromises: number;
  pendingWriteOffs: number;
  collectionRate: number;
}

export async function calculateCollectionSummary(clinicId: string): Promise<CollectionSummary> {
  const [activeCount, pausedCount, agencyCount, balances, promisesCount, writeOffsCount] = await Promise.all([
    db.accountCollection.count({
      where: { clinicId, status: 'ACTIVE' },
    }),
    db.accountCollection.count({
      where: { clinicId, status: 'PAUSED' },
    }),
    db.accountCollection.count({
      where: { clinicId, status: 'AGENCY' },
    }),
    db.accountCollection.aggregate({
      where: { clinicId },
      _sum: {
        currentBalance: true,
        paidAmount: true,
        startingBalance: true,
      },
    }),
    db.paymentPromise.count({
      where: {
        accountCollection: { clinicId },
        status: 'PENDING',
      },
    }),
    db.writeOff.count({
      where: { clinicId, status: 'PENDING' },
    }),
  ]);

  const totalBalance = balances._sum.currentBalance || 0;
  const totalCollected = balances._sum.paidAmount || 0;
  const totalStarting = balances._sum.startingBalance || 0;

  return {
    activeAccounts: activeCount,
    pausedAccounts: pausedCount,
    atAgencyAccounts: agencyCount,
    totalBalance: Math.round(totalBalance * 100) / 100,
    totalCollected: Math.round(totalCollected * 100) / 100,
    pendingPromises: promisesCount,
    pendingWriteOffs: writeOffsCount,
    collectionRate: totalStarting > 0
      ? Math.round((totalCollected / totalStarting) * 100 * 10) / 10
      : 0,
  };
}

/**
 * Get promises due today for follow-up
 */
export async function getPromisesDueToday(clinicId: string): Promise<{
  id: string;
  promisedAmount: number;
  promisedDate: Date;
  accountId: string;
  status: string;
}[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const promises = await db.paymentPromise.findMany({
    where: {
      accountCollection: { clinicId },
      status: 'PENDING',
      promisedDate: {
        gte: today,
        lt: tomorrow,
      },
    },
    select: {
      id: true,
      promisedAmount: true,
      promisedDate: true,
      accountId: true,
      status: true,
    },
  });

  return promises;
}

/**
 * Get overdue promises
 */
export async function getOverduePromises(clinicId: string): Promise<{
  id: string;
  promisedAmount: number;
  promisedDate: Date;
  accountId: string;
  daysOverdue: number;
}[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const promises = await db.paymentPromise.findMany({
    where: {
      accountCollection: { clinicId },
      status: 'PENDING',
      promisedDate: {
        lt: today,
      },
    },
    select: {
      id: true,
      promisedAmount: true,
      promisedDate: true,
      accountId: true,
    },
  });

  return promises.map(p => ({
    ...p,
    daysOverdue: calculateDaysOverdue(p.promisedDate),
  }));
}
