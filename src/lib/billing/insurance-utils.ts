import { db } from '@/lib/db';

/**
 * Generate a unique claim number
 * Format: CLM-YYYY-NNNNN (e.g., CLM-2024-00001)
 */
export async function generateClaimNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `CLM-${year}-`;

  const lastClaim = await db.insuranceClaim.findFirst({
    where: {
      clinicId,
      claimNumber: { startsWith: prefix },
    },
    orderBy: { claimNumber: 'desc' },
    select: { claimNumber: true },
  });

  let nextNumber = 1;
  if (lastClaim?.claimNumber) {
    const lastNumber = parseInt(lastClaim.claimNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
}

/**
 * Calculate total billed amount from claim items
 */
export function calculateClaimTotals(items: {
  billedAmount: number;
  quantity?: number;
}[]): {
  totalBilled: number;
  lineCount: number;
} {
  let totalBilled = 0;

  for (const item of items) {
    const quantity = item.quantity || 1;
    totalBilled += item.billedAmount * quantity;
  }

  return {
    totalBilled: Math.round(totalBilled * 100) / 100,
    lineCount: items.length,
  };
}

/**
 * Calculate claim aging (days since filing)
 */
export function calculateClaimAging(filingDate: Date | null | undefined): number {
  if (!filingDate) return 0;

  const now = new Date();
  const filing = new Date(filingDate);
  const diffTime = now.getTime() - filing.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

/**
 * Determine claim aging bucket
 */
export function getClaimAgingBucket(filingDate: Date | null | undefined): string {
  const days = calculateClaimAging(filingDate);

  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  if (days <= 120) return '91-120';
  return '120+';
}

/**
 * Calculate days until appeal deadline
 */
export function daysUntilAppealDeadline(appealDeadline: Date | null | undefined): number | null {
  if (!appealDeadline) return null;

  const now = new Date();
  const deadline = new Date(appealDeadline);
  const diffTime = deadline.getTime() - now.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Check if patient's ortho benefit is still available
 */
export function checkOrthoBenefitAvailability(insurance: {
  hasOrthoBenefit: boolean;
  orthoLifetimeMax?: number | null;
  orthoUsedAmount?: number | null;
  orthoRemainingAmount?: number | null;
  orthoAgeLimit?: number | null;
  orthoWaitingPeriod?: number | null;
  effectiveDate: Date;
  terminationDate?: Date | null;
}): {
  isAvailable: boolean;
  remainingBenefit: number;
  reason?: string;
} {
  // Check if ortho benefit exists
  if (!insurance.hasOrthoBenefit) {
    return { isAvailable: false, remainingBenefit: 0, reason: 'No orthodontic benefit on this plan' };
  }

  // Check if coverage is still active
  const now = new Date();
  if (insurance.terminationDate && new Date(insurance.terminationDate) < now) {
    return { isAvailable: false, remainingBenefit: 0, reason: 'Coverage has terminated' };
  }

  // Check waiting period
  if (insurance.orthoWaitingPeriod) {
    const effectiveDate = new Date(insurance.effectiveDate);
    const waitingEndDate = new Date(effectiveDate);
    waitingEndDate.setMonth(waitingEndDate.getMonth() + insurance.orthoWaitingPeriod);

    if (now < waitingEndDate) {
      return {
        isAvailable: false,
        remainingBenefit: 0,
        reason: `Waiting period until ${waitingEndDate.toLocaleDateString()}`
      };
    }
  }

  // Calculate remaining benefit
  const lifetimeMax = insurance.orthoLifetimeMax || 0;
  const usedAmount = insurance.orthoUsedAmount || 0;
  const remainingBenefit = Math.max(0, lifetimeMax - usedAmount);

  if (remainingBenefit <= 0) {
    return { isAvailable: false, remainingBenefit: 0, reason: 'Lifetime maximum has been met' };
  }

  return { isAvailable: true, remainingBenefit };
}

/**
 * Calculate estimated insurance payment based on coverage percentage
 */
export function calculateEstimatedInsurancePayment(
  procedureAmount: number,
  insurance: {
    orthoCoveragePercent?: number | null;
    orthoRemainingAmount?: number | null;
    orthoDeductible?: number | null;
    orthoDeductibleMet?: number | null;
  }
): {
  estimatedPayment: number;
  deductibleApplied: number;
  coveragePercent: number;
} {
  const coveragePercent = insurance.orthoCoveragePercent || 0;
  const deductible = insurance.orthoDeductible || 0;
  const deductibleMet = insurance.orthoDeductibleMet || 0;
  const remainingDeductible = Math.max(0, deductible - deductibleMet);
  const remainingBenefit = insurance.orthoRemainingAmount || Infinity;

  // Apply deductible first
  const afterDeductible = Math.max(0, procedureAmount - remainingDeductible);

  // Calculate coverage amount
  let estimatedPayment = (afterDeductible * coveragePercent) / 100;

  // Cap at remaining benefit
  estimatedPayment = Math.min(estimatedPayment, remainingBenefit);

  return {
    estimatedPayment: Math.round(estimatedPayment * 100) / 100,
    deductibleApplied: Math.min(remainingDeductible, procedureAmount),
    coveragePercent,
  };
}

/**
 * Update patient insurance benefit usage after a claim is paid
 */
export async function updateInsuranceBenefitUsage(
  patientInsuranceId: string,
  paidAmount: number,
  clinicId: string
): Promise<void> {
  const insurance = await db.patientInsurance.findUnique({
    where: { id: patientInsuranceId },
    select: {
      orthoLifetimeMax: true,
      orthoUsedAmount: true,
      orthoDeductible: true,
      orthoDeductibleMet: true,
    },
  });

  if (!insurance) return;

  const newUsedAmount = (insurance.orthoUsedAmount || 0) + paidAmount;
  const newRemainingAmount = Math.max(0, (insurance.orthoLifetimeMax || 0) - newUsedAmount);

  await db.patientInsurance.update({
    where: { id: patientInsuranceId },
    data: {
      orthoUsedAmount: Math.round(newUsedAmount * 100) / 100,
      orthoRemainingAmount: Math.round(newRemainingAmount * 100) / 100,
    },
  });
}

/**
 * Create a status history entry for a claim
 */
export async function createClaimStatusHistory(
  claimId: string,
  previousStatus: string | null,
  newStatus: string,
  userId: string,
  notes?: string,
  errorCode?: string,
  errorMessage?: string
): Promise<void> {
  await db.claimStatusHistory.create({
    data: {
      claimId,
      previousStatus: previousStatus as never,
      newStatus: newStatus as never,
      changedBy: userId,
      notes,
      errorCode,
      errorMessage,
    },
  });
}

/**
 * Format payer ID for display
 */
export function formatPayerId(payerId: string): string {
  return payerId.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Validate CDT procedure code format
 * CDT codes are typically D followed by 4 digits (e.g., D8080)
 */
export function validateCDTCode(code: string): boolean {
  const cdtPattern = /^D\d{4}$/;
  return cdtPattern.test(code.toUpperCase());
}

/**
 * Common ortho CDT codes reference
 */
export const ORTHO_CDT_CODES = {
  COMPREHENSIVE_ADOLESCENT: 'D8080', // Comprehensive orthodontic treatment - adolescent
  COMPREHENSIVE_ADULT: 'D8090', // Comprehensive orthodontic treatment - adult
  LIMITED_TREATMENT: 'D8010', // Limited orthodontic treatment - primary dentition
  LIMITED_MIXED: 'D8020', // Limited orthodontic treatment - transitional dentition
  LIMITED_PERMANENT: 'D8030', // Limited orthodontic treatment - permanent dentition
  INTERCEPTIVE: 'D8050', // Interceptive orthodontic treatment - primary dentition
  INTERCEPTIVE_MIXED: 'D8060', // Interceptive orthodontic treatment - transitional dentition
  RETENTION: 'D8680', // Orthodontic retention
  RETENTION_REMOVAL: 'D8681', // Removable orthodontic retainer
  RETENTION_FIXED: 'D8682', // Fixed retention
  PERIODIC_VISIT: 'D8670', // Periodic orthodontic treatment visit
  RECORDS: 'D0350', // Orthodontic photos/images
  CEPH: 'D0340', // Cephalometric film
  PANORAMIC: 'D0330', // Panoramic radiographic image
} as const;

/**
 * Get claim status display color
 */
export function getClaimStatusColor(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'gray';
    case 'READY':
      return 'blue';
    case 'SUBMITTED':
      return 'purple';
    case 'ACCEPTED':
    case 'IN_PROCESS':
      return 'indigo';
    case 'PAID':
      return 'green';
    case 'PARTIAL':
      return 'yellow';
    case 'DENIED':
      return 'red';
    case 'APPEALED':
      return 'orange';
    case 'VOID':
    case 'CLOSED':
      return 'gray';
    default:
      return 'gray';
  }
}

/**
 * Get claim status display text
 */
export function getClaimStatusText(status: string): string {
  switch (status) {
    case 'DRAFT':
      return 'Draft';
    case 'READY':
      return 'Ready to Submit';
    case 'SUBMITTED':
      return 'Submitted';
    case 'ACCEPTED':
      return 'Accepted';
    case 'IN_PROCESS':
      return 'In Process';
    case 'PAID':
      return 'Paid';
    case 'PARTIAL':
      return 'Partial Payment';
    case 'DENIED':
      return 'Denied';
    case 'APPEALED':
      return 'Appealed';
    case 'VOID':
      return 'Void';
    case 'CLOSED':
      return 'Closed';
    default:
      return status;
  }
}

/**
 * Calculate summary statistics for claims
 */
export interface ClaimsSummary {
  totalClaims: number;
  totalBilled: number;
  totalPaid: number;
  totalAdjusted: number;
  totalPatientResponsibility: number;
  byStatus: Record<string, { count: number; amount: number }>;
  averageProcessingDays: number;
  denialRate: number;
}

export async function calculateClaimsSummary(
  clinicId: string,
  fromDate?: Date,
  toDate?: Date
): Promise<ClaimsSummary> {
  const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {};
  if (fromDate) dateFilter.createdAt = { ...dateFilter.createdAt, gte: fromDate };
  if (toDate) dateFilter.createdAt = { ...dateFilter.createdAt, lte: toDate };

  const claims = await db.insuranceClaim.findMany({
    where: {
      clinicId,
      deletedAt: null,
      ...dateFilter,
    },
    select: {
      status: true,
      billedAmount: true,
      paidAmount: true,
      adjustmentAmount: true,
      patientResponsibility: true,
      filingDate: true,
      updatedAt: true,
    },
  });

  const summary: ClaimsSummary = {
    totalClaims: claims.length,
    totalBilled: 0,
    totalPaid: 0,
    totalAdjusted: 0,
    totalPatientResponsibility: 0,
    byStatus: {},
    averageProcessingDays: 0,
    denialRate: 0,
  };

  let totalProcessingDays = 0;
  let processedCount = 0;
  let deniedCount = 0;

  for (const claim of claims) {
    summary.totalBilled += claim.billedAmount;
    summary.totalPaid += claim.paidAmount || 0;
    summary.totalAdjusted += claim.adjustmentAmount || 0;
    summary.totalPatientResponsibility += claim.patientResponsibility || 0;

    // Status aggregation
    if (!summary.byStatus[claim.status]) {
      summary.byStatus[claim.status] = { count: 0, amount: 0 };
    }
    summary.byStatus[claim.status].count++;
    summary.byStatus[claim.status].amount += claim.billedAmount;

    // Calculate processing time for completed claims
    if (['PAID', 'PARTIAL', 'DENIED', 'CLOSED'].includes(claim.status) && claim.filingDate) {
      const processingDays = Math.floor(
        (claim.updatedAt.getTime() - new Date(claim.filingDate).getTime()) / (1000 * 60 * 60 * 24)
      );
      totalProcessingDays += processingDays;
      processedCount++;
    }

    // Count denials
    if (claim.status === 'DENIED') {
      deniedCount++;
    }
  }

  // Calculate averages
  if (processedCount > 0) {
    summary.averageProcessingDays = Math.round(totalProcessingDays / processedCount);
  }

  if (claims.length > 0) {
    summary.denialRate = Math.round((deniedCount / claims.length) * 100 * 10) / 10;
  }

  // Round monetary values
  summary.totalBilled = Math.round(summary.totalBilled * 100) / 100;
  summary.totalPaid = Math.round(summary.totalPaid * 100) / 100;
  summary.totalAdjusted = Math.round(summary.totalAdjusted * 100) / 100;
  summary.totalPatientResponsibility = Math.round(summary.totalPatientResponsibility * 100) / 100;

  return summary;
}
