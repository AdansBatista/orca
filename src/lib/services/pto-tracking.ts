import { db } from '@/lib/db';

/**
 * Time-off request types - matches Prisma enum
 */
type TimeOffRequestType =
  | 'VACATION'
  | 'SICK'
  | 'PERSONAL'
  | 'BEREAVEMENT'
  | 'JURY_DUTY'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'MEDICAL'
  | 'UNPAID'
  | 'OTHER';

/**
 * PTO Tracking Service
 * Handles calculation and tracking of PTO usage from approved time-off requests.
 * This is a simple "unlimited PTO" tracking system - we track usage but don't enforce limits.
 */

export interface PTOUsageSummary {
  staffProfileId: string;
  year: number;
  totalDaysUsed: number;
  byType: Record<string, number>;
  requests: {
    id: string;
    requestType: string;
    startDate: Date;
    endDate: Date;
    totalDays: number;
    approvedAt: Date | null;
  }[];
}

/**
 * Calculate PTO usage for a staff member in a given year
 */
export async function calculatePTOUsage(
  staffProfileId: string,
  clinicId: string,
  year: number
): Promise<PTOUsageSummary> {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  // Get all approved time-off requests for this staff member in the year
  const approvedRequests = await db.timeOffRequest.findMany({
    where: {
      staffProfileId,
      clinicId,
      status: 'APPROVED',
      startDate: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
    orderBy: { startDate: 'asc' },
  });

  // Calculate totals by type
  const byType: Record<string, number> = {};
  let totalDaysUsed = 0;

  for (const request of approvedRequests) {
    const days = request.totalDays;
    totalDaysUsed += days;

    if (!byType[request.requestType]) {
      byType[request.requestType] = 0;
    }
    byType[request.requestType] += days;
  }

  return {
    staffProfileId,
    year,
    totalDaysUsed,
    byType,
    requests: approvedRequests.map((r) => ({
      id: r.id,
      requestType: r.requestType,
      startDate: r.startDate,
      endDate: r.endDate,
      totalDays: r.totalDays,
      approvedAt: r.reviewedAt,
    })),
  };
}

/**
 * Update PTO usage record for a staff member
 * Called when a time-off request is approved
 */
export async function updatePTOUsage(
  staffProfileId: string,
  clinicId: string,
  requestType: string, // TimeOffType enum value
  totalDays: number,
  year: number
): Promise<void> {
  // Find existing PTOUsage record for this year
  const existing = await db.pTOUsage.findFirst({
    where: {
      staffProfileId,
      clinicId,
      year,
    },
  });

  // Convert days to hours (8 hours per day)
  const hoursUsed = totalDays * 8;

  if (existing) {
    // Get current usage by type
    const currentUsage = (existing.usageByType as Record<string, number>) || {};
    const currentTypeUsage = currentUsage[requestType] || 0;

    // Update existing record
    await db.pTOUsage.update({
      where: { id: existing.id },
      data: {
        usageByType: {
          ...currentUsage,
          [requestType]: currentTypeUsage + hoursUsed,
        },
        totalHoursUsed: existing.totalHoursUsed + hoursUsed,
      },
    });
  } else {
    // Create new record
    await db.pTOUsage.create({
      data: {
        staffProfileId,
        clinicId,
        year,
        usageByType: { [requestType]: hoursUsed },
        totalHoursUsed: hoursUsed,
      },
    });
  }
}

/**
 * Get PTO usage summary for multiple staff members
 */
export async function getPTOUsageSummaryForClinic(
  clinicId: string,
  year: number
): Promise<
  {
    staffProfileId: string;
    staffName: string;
    totalHoursUsed: number;
    totalDaysUsed: number;
    byType: Record<string, number>;
  }[]
> {
  // Get all PTOUsage records for the clinic and year
  const usageRecords = await db.pTOUsage.findMany({
    where: {
      clinicId,
      year,
    },
    include: {
      staffProfile: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return usageRecords.map((record) => ({
    staffProfileId: record.staffProfileId,
    staffName: `${record.staffProfile.firstName} ${record.staffProfile.lastName}`,
    totalHoursUsed: record.totalHoursUsed,
    totalDaysUsed: record.totalHoursUsed / 8, // Convert hours back to days
    byType: (record.usageByType as Record<string, number>) || {},
  }));
}

/**
 * Recalculate all PTO usage for a staff member from approved requests
 * Useful for data integrity checks or when records need to be rebuilt
 */
export async function recalculatePTOUsage(
  staffProfileId: string,
  clinicId: string,
  year: number
): Promise<void> {
  // Delete existing PTOUsage records for this staff member and year
  await db.pTOUsage.deleteMany({
    where: {
      staffProfileId,
      clinicId,
      year,
    },
  });

  // Get all approved requests for the year
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

  const approvedRequests = await db.timeOffRequest.findMany({
    where: {
      staffProfileId,
      clinicId,
      status: 'APPROVED',
      startDate: {
        gte: startOfYear,
        lte: endOfYear,
      },
    },
  });

  // If no approved requests, nothing to create
  if (approvedRequests.length === 0) {
    return;
  }

  // Group by leave type and calculate hours
  const byType: Record<string, number> = {};
  let totalHours = 0;

  for (const request of approvedRequests) {
    const hours = request.totalDays * 8; // 8 hours per day
    if (!byType[request.requestType]) {
      byType[request.requestType] = 0;
    }
    byType[request.requestType] += hours;
    totalHours += hours;
  }

  // Create single PTOUsage record with JSON usage by type
  await db.pTOUsage.create({
    data: {
      staffProfileId,
      clinicId,
      year,
      usageByType: byType,
      totalHoursUsed: totalHours,
    },
  });
}
