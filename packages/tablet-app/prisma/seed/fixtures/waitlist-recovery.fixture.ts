/**
 * Waitlist & Recovery fixture data for seeding
 * Includes waitlist entries, cancellations, and patient risk scores
 */

import type {
  WaitlistPriority,
  WaitlistStatus,
  CancellationType,
  CancelledByType,
  CancellationReason,
  RecoveryStatus,
  RiskLevel,
  RiskStatus,
  InterventionStatus,
} from '@prisma/client';

// Helper to get random element
function random<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generate sample waitlist entries
 */
export function generateWaitlistEntries(
  patientIds: string[],
  appointmentTypeIds: string[],
  providerIds: string[],
  addedByUserId: string
): Array<{
  patientId: string;
  appointmentTypeId: string;
  priority: WaitlistPriority;
  status: WaitlistStatus;
  preferredProviderId: string | null;
  dateRangeStart: Date | null;
  dateRangeEnd: Date | null;
  preferredTimes: string[];
  preferredDays: number[];
  notes: string | null;
  reasonForWaitlist: string;
  expiresAt: Date | null;
  addedBy: string;
  notificationsSent: number;
  lastNotifiedAt: Date | null;
}> {
  const entries: Array<{
    patientId: string;
    appointmentTypeId: string;
    priority: WaitlistPriority;
    status: WaitlistStatus;
    preferredProviderId: string | null;
    dateRangeStart: Date | null;
    dateRangeEnd: Date | null;
    preferredTimes: string[];
    preferredDays: number[];
    notes: string | null;
    reasonForWaitlist: string;
    expiresAt: Date | null;
    addedBy: string;
    notificationsSent: number;
    lastNotifiedAt: Date | null;
  }> = [];

  const priorities: WaitlistPriority[] = ['URGENT', 'HIGH', 'STANDARD', 'FLEXIBLE'];
  const statuses: WaitlistStatus[] = ['ACTIVE', 'NOTIFIED', 'ACTIVE', 'ACTIVE']; // Mostly active
  const reasons = [
    'Needs earlier appointment',
    'Prefers different time slot',
    'Looking for cancellation',
    'Wants to see specific provider',
    'Schedule changed, needs sooner',
    'Treatment urgency increased',
    'Rescheduling from cancelled',
    'Looking for afternoon slot',
  ];

  const timePreferences = [
    ['MORNING'],
    ['AFTERNOON'],
    ['MORNING', 'AFTERNOON'],
    ['AFTERNOON', 'EVENING'],
    [],
  ];

  const dayPreferences = [
    [1, 2, 3, 4, 5], // Weekdays
    [1, 3, 5], // MWF
    [2, 4], // Tue/Thu
    [6], // Saturday only
    [], // Any day
  ];

  const now = new Date();

  // Create 8-12 waitlist entries
  const entryCount = 8 + Math.floor(Math.random() * 5);

  for (let i = 0; i < entryCount; i++) {
    const patientId = random(patientIds);
    const appointmentTypeId = random(appointmentTypeIds);
    const priority = random(priorities);
    const status = random(statuses);
    const wantsSpecificProvider = Math.random() > 0.6;

    // Date range preferences
    const hasDateRange = Math.random() > 0.4;
    let dateRangeStart: Date | null = null;
    let dateRangeEnd: Date | null = null;

    if (hasDateRange) {
      dateRangeStart = new Date(now);
      dateRangeStart.setDate(dateRangeStart.getDate() + Math.floor(Math.random() * 7));
      dateRangeEnd = new Date(dateRangeStart);
      dateRangeEnd.setDate(dateRangeEnd.getDate() + 14 + Math.floor(Math.random() * 21));
    }

    // Expiration
    const hasExpiration = Math.random() > 0.5;
    let expiresAt: Date | null = null;
    if (hasExpiration) {
      expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 30 + Math.floor(Math.random() * 30));
    }

    // Notifications for NOTIFIED status
    const notificationsSent = status === 'NOTIFIED' ? 1 + Math.floor(Math.random() * 2) : 0;
    const lastNotifiedAt = notificationsSent > 0 ? new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000) : null;

    entries.push({
      patientId,
      appointmentTypeId,
      priority,
      status,
      preferredProviderId: wantsSpecificProvider ? random(providerIds) : null,
      dateRangeStart,
      dateRangeEnd,
      preferredTimes: random(timePreferences),
      preferredDays: random(dayPreferences),
      notes: Math.random() > 0.7 ? 'Please contact via text message' : null,
      reasonForWaitlist: random(reasons),
      expiresAt,
      addedBy: addedByUserId,
      notificationsSent,
      lastNotifiedAt,
    });
  }

  return entries;
}

/**
 * Generate sample cancellation records
 */
export function generateCancellations(
  patientIds: string[],
  appointmentTypeIds: string[],
  providerIds: string[],
  cancelledByUserId: string
): Array<{
  patientId: string;
  appointmentId: string;
  cancellationType: CancellationType;
  cancelledBy: string;
  cancelledByType: CancelledByType;
  originalStartTime: Date;
  originalEndTime: Date;
  originalProviderId: string;
  appointmentTypeId: string;
  reason: CancellationReason;
  reasonDetails: string | null;
  noticeHours: number;
  isLateCancel: boolean;
  lateCancelFee: number | null;
  feeWaived: boolean;
  feeWaivedReason: string | null;
  recoveryStatus: RecoveryStatus;
  recoveryAttempts: number;
  lastRecoveryAttemptAt: Date | null;
  recoveryNotes: string | null;
}> {
  const cancellations: Array<{
    patientId: string;
    appointmentId: string;
    cancellationType: CancellationType;
    cancelledBy: string;
    cancelledByType: CancelledByType;
    originalStartTime: Date;
    originalEndTime: Date;
    originalProviderId: string;
    appointmentTypeId: string;
    reason: CancellationReason;
    reasonDetails: string | null;
    noticeHours: number;
    isLateCancel: boolean;
    lateCancelFee: number | null;
    feeWaived: boolean;
    feeWaivedReason: string | null;
    recoveryStatus: RecoveryStatus;
    recoveryAttempts: number;
    lastRecoveryAttemptAt: Date | null;
    recoveryNotes: string | null;
  }> = [];

  const cancelTypes: CancellationType[] = ['CANCELLED', 'LATE_CANCEL', 'NO_SHOW', 'CANCELLED'];
  const cancelledByTypes: CancelledByType[] = ['PATIENT', 'PATIENT', 'PATIENT', 'STAFF'];
  const reasons: CancellationReason[] = [
    'SCHEDULE_CONFLICT',
    'ILLNESS',
    'TRANSPORTATION',
    'FORGOT',
    'FAMILY_EMERGENCY',
    'WEATHER',
  ];
  const recoveryStatuses: RecoveryStatus[] = ['PENDING', 'IN_PROGRESS', 'RECOVERED', 'LOST', 'NOT_NEEDED'];

  const reasonDetails: Record<CancellationReason, string[]> = {
    SCHEDULE_CONFLICT: ['Work meeting came up', 'School event', 'Doctor appointment conflict'],
    ILLNESS: ['Caught the flu', 'Child is sick', 'Not feeling well'],
    TRANSPORTATION: ['Car broke down', 'No ride available', 'Traffic accident'],
    FORGOT: ['Forgot about the appointment', 'Thought it was next week'],
    FAMILY_EMERGENCY: ['Family emergency', 'Had to travel unexpectedly'],
    WEATHER: ['Snow storm', 'Severe weather warning'],
    FINANCIAL: ['Financial constraints'],
    CHANGED_PROVIDERS: ['Switching to different provider'],
    PRACTICE_CLOSURE: ['Office closed for holiday', 'Emergency maintenance'],
    PROVIDER_UNAVAILABLE: ['Provider called in sick', 'Provider at conference'],
    OTHER: ['Other reason'],
  };

  const now = new Date();

  // Create 6-10 cancellation records
  const cancelCount = 6 + Math.floor(Math.random() * 5);

  for (let i = 0; i < cancelCount; i++) {
    const patientId = random(patientIds);
    const cancelType = random(cancelTypes);
    const reason = random(reasons);
    const cancelledByType = cancelType === 'NO_SHOW' ? ('SYSTEM' as CancelledByType) : random(cancelledByTypes);

    // Original appointment time (1-14 days ago)
    const daysAgo = 1 + Math.floor(Math.random() * 14);
    const originalStartTime = new Date(now);
    originalStartTime.setDate(originalStartTime.getDate() - daysAgo);
    originalStartTime.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

    const originalEndTime = new Date(originalStartTime);
    originalEndTime.setMinutes(originalEndTime.getMinutes() + 30 + Math.floor(Math.random() * 3) * 15);

    // Notice hours (how far in advance they cancelled)
    let noticeHours: number;
    if (cancelType === 'NO_SHOW') {
      noticeHours = 0;
    } else if (cancelType === 'LATE_CANCEL') {
      noticeHours = Math.floor(Math.random() * 24); // Within 24 hours
    } else {
      noticeHours = 24 + Math.floor(Math.random() * 72); // 24-96 hours
    }

    const isLateCancel = cancelType === 'LATE_CANCEL' || cancelType === 'NO_SHOW';
    const lateCancelFee = isLateCancel ? (cancelType === 'NO_SHOW' ? 50 : 25) : null;
    const feeWaived = isLateCancel && Math.random() > 0.7;

    // Recovery status
    const recoveryStatus = random(recoveryStatuses);
    const hasRecoveryAttempts = recoveryStatus !== 'NOT_NEEDED';
    const recoveryAttempts = hasRecoveryAttempts ? 1 + Math.floor(Math.random() * 3) : 0;
    const lastRecoveryAttemptAt = recoveryAttempts > 0 ? new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null;

    const recoveryNotes: Record<RecoveryStatus, string | null> = {
      PENDING: 'Awaiting patient callback',
      IN_PROGRESS: 'Patient reviewing schedule, will call back',
      RECOVERED: 'Successfully rescheduled for next week',
      LOST: 'Patient no longer interested in treatment',
      NOT_NEEDED: null,
    };

    cancellations.push({
      patientId,
      appointmentId: `placeholder-${i}`, // Will be replaced with actual appointment ID
      cancellationType: cancelType,
      cancelledBy: cancelledByUserId,
      cancelledByType,
      originalStartTime,
      originalEndTime,
      originalProviderId: random(providerIds),
      appointmentTypeId: random(appointmentTypeIds),
      reason,
      reasonDetails: random(reasonDetails[reason] || ['No additional details']),
      noticeHours,
      isLateCancel,
      lateCancelFee,
      feeWaived,
      feeWaivedReason: feeWaived ? 'First-time occurrence' : null,
      recoveryStatus,
      recoveryAttempts,
      lastRecoveryAttemptAt,
      recoveryNotes: recoveryNotes[recoveryStatus],
    });
  }

  return cancellations;
}

/**
 * Generate sample patient risk scores
 */
export function generateRiskScores(
  patientIds: string[]
): Array<{
  patientId: string;
  riskScore: number;
  riskLevel: RiskLevel;
  riskFactors: Array<{ factor: string; weight: number; description: string; value: string }>;
  recommendedActions: string[];
  status: RiskStatus;
  interventionStatus: InterventionStatus | null;
  interventionNotes: string | null;
  noShowCount: number;
  cancelCount: number;
  missedInRowCount: number;
  daysSinceLastVisit: number | null;
  totalAppointments: number;
}> {
  const riskScores: Array<{
    patientId: string;
    riskScore: number;
    riskLevel: RiskLevel;
    riskFactors: Array<{ factor: string; weight: number; description: string; value: string }>;
    recommendedActions: string[];
    status: RiskStatus;
    interventionStatus: InterventionStatus | null;
    interventionNotes: string | null;
    noShowCount: number;
    cancelCount: number;
    missedInRowCount: number;
    daysSinceLastVisit: number | null;
    totalAppointments: number;
  }> = [];

  const statuses: RiskStatus[] = ['ACTIVE', 'ACTIVE', 'REVIEWED', 'ACTIVE'];
  const interventionStatuses: (InterventionStatus | null)[] = [null, 'PENDING', 'IN_PROGRESS', 'SUCCESSFUL'];

  // Only create risk scores for about half the patients (not everyone is at risk)
  const selectedPatients = patientIds.filter(() => Math.random() > 0.4);

  for (const patientId of selectedPatients) {
    // Generate risk factors
    const noShowCount = Math.floor(Math.random() * 4);
    const cancelCount = Math.floor(Math.random() * 5);
    const missedInRowCount = Math.floor(Math.random() * 3);
    const daysSinceLastVisit = Math.random() > 0.3 ? 30 + Math.floor(Math.random() * 150) : null;
    const totalAppointments = 3 + Math.floor(Math.random() * 15);

    // Calculate risk score (simplified version)
    let riskScore = 0;
    riskScore += Math.min(noShowCount * 10, 30);
    riskScore += Math.min(cancelCount * 5, 20);
    riskScore += Math.min(missedInRowCount * 12.5, 25);
    if (daysSinceLastVisit && daysSinceLastVisit > 90) {
      riskScore += Math.min((daysSinceLastVisit - 90) / 10, 25);
    }
    riskScore = Math.min(Math.round(riskScore), 100);

    // Determine risk level
    let riskLevel: RiskLevel;
    if (riskScore >= 75) riskLevel = 'CRITICAL';
    else if (riskScore >= 50) riskLevel = 'HIGH';
    else if (riskScore >= 25) riskLevel = 'MEDIUM';
    else riskLevel = 'LOW';

    // Build risk factors
    const riskFactors: Array<{ factor: string; weight: number; description: string; value: string }> = [];

    if (noShowCount > 0) {
      riskFactors.push({
        factor: 'NO_SHOWS',
        weight: Math.min(noShowCount * 10, 30),
        description: 'Number of no-shows in past 6 months',
        value: String(noShowCount),
      });
    }

    if (cancelCount > 0) {
      riskFactors.push({
        factor: 'CANCELLATIONS',
        weight: Math.min(cancelCount * 5, 20),
        description: 'Number of cancellations in past 6 months',
        value: String(cancelCount),
      });
    }

    if (missedInRowCount >= 2) {
      riskFactors.push({
        factor: 'CONSECUTIVE_MISSES',
        weight: Math.min(missedInRowCount * 12.5, 25),
        description: 'Consecutive missed appointments',
        value: String(missedInRowCount),
      });
    }

    if (daysSinceLastVisit && daysSinceLastVisit > 90) {
      riskFactors.push({
        factor: 'DAYS_SINCE_VISIT',
        weight: Math.min((daysSinceLastVisit - 90) / 10, 25),
        description: 'Days since last completed visit',
        value: String(daysSinceLastVisit),
      });
    }

    // Recommended actions
    const recommendedActions: string[] = [];
    if (missedInRowCount >= 2) recommendedActions.push('Personal outreach recommended');
    if (riskLevel === 'CRITICAL') recommendedActions.push('Schedule follow-up call');
    if (noShowCount >= 2) recommendedActions.push('Implement reminder protocol');
    if (daysSinceLastVisit && daysSinceLastVisit > 120) recommendedActions.push('Re-engagement campaign');

    const status = random(statuses);
    const interventionStatus = status === 'ACTIVE' && riskScore >= 50 ? random(interventionStatuses) : null;

    const interventionNotes: Record<InterventionStatus, string> = {
      PENDING: 'Scheduled to call patient next week',
      IN_PROGRESS: 'Spoke with patient, discussing schedule',
      SUCCESSFUL: 'Patient re-engaged and scheduled appointment',
      UNSUCCESSFUL: 'Unable to reach patient after multiple attempts',
    };

    // Only include if there's meaningful risk
    if (riskScore >= 15) {
      riskScores.push({
        patientId,
        riskScore,
        riskLevel,
        riskFactors,
        recommendedActions,
        status,
        interventionStatus,
        interventionNotes: interventionStatus ? interventionNotes[interventionStatus] : null,
        noShowCount,
        cancelCount,
        missedInRowCount,
        daysSinceLastVisit,
        totalAppointments,
      });
    }
  }

  return riskScores;
}
