import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { riskScoreQuerySchema } from '@/lib/validations/waitlist';

/**
 * GET /api/booking/at-risk
 * List at-risk patients with filtering and pagination
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      riskLevel: searchParams.get('riskLevel') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      interventionStatus: searchParams.get('interventionStatus') ?? undefined,
      minRiskScore: searchParams.get('minRiskScore') ?? undefined,
      maxRiskScore: searchParams.get('maxRiskScore') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = riskScoreQuerySchema.safeParse(rawParams);

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
      riskLevel,
      status,
      interventionStatus,
      minRiskScore,
      maxRiskScore,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    // Apply filters
    if (riskLevel) where.riskLevel = riskLevel;
    if (status) where.status = status;
    if (interventionStatus) where.interventionStatus = interventionStatus;

    // Risk score range
    if (minRiskScore !== undefined || maxRiskScore !== undefined) {
      where.riskScore = {};
      if (minRiskScore !== undefined) (where.riskScore as Record<string, number>).gte = minRiskScore;
      if (maxRiskScore !== undefined) (where.riskScore as Record<string, number>).lte = maxRiskScore;
    }

    // Count total
    const total = await db.patientRiskScore.count({ where });

    // Fetch risk scores
    const riskScores = await db.patientRiskScore.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: riskScores,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * POST /api/booking/at-risk/calculate
 * Calculate/recalculate risk scores for patients
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();
    const { patientId } = body; // Optional: calculate for specific patient

    const clinicFilter = getClinicFilter(session);

    // If patientId provided, calculate for that patient only
    const patientWhere = patientId
      ? { id: patientId, ...clinicFilter }
      : { ...clinicFilter, isActive: true };

    const patients = await db.patient.findMany({
      where: patientWhere,
      select: { id: true },
    });

    const results: { patientId: string; riskScore: number; riskLevel: string }[] = [];

    // Process each patient
    for (const patient of patients) {
      // Get appointment history for the last 180 days
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180);

      const appointments = await db.appointment.findMany({
        where: {
          patientId: patient.id,
          ...clinicFilter,
          startTime: { gte: sixMonthsAgo },
        },
        orderBy: { startTime: 'desc' },
        select: {
          id: true,
          status: true,
          startTime: true,
          completedAt: true,
        },
      });

      // Get cancellation records
      const cancellations = await db.appointmentCancellation.findMany({
        where: {
          patientId: patient.id,
          ...clinicFilter,
          cancelledAt: { gte: sixMonthsAgo },
        },
        select: {
          cancellationType: true,
          reason: true,
        },
      });

      // Calculate risk factors
      const totalAppointments = appointments.length;
      const noShowCount = appointments.filter(a => a.status === 'NO_SHOW').length;
      const cancelCount = cancellations.filter(c => c.cancellationType !== 'PRACTICE_CANCEL').length;
      const completedCount = appointments.filter(a => a.status === 'COMPLETED').length;

      // Calculate consecutive misses
      let missedInRowCount = 0;
      for (const apt of appointments) {
        if (apt.status === 'NO_SHOW' || apt.status === 'CANCELLED') {
          missedInRowCount++;
        } else {
          break;
        }
      }

      // Calculate days since last visit
      const lastCompleted = appointments.find(a => a.status === 'COMPLETED');
      const daysSinceLastVisit = lastCompleted
        ? Math.floor((Date.now() - new Date(lastCompleted.completedAt || lastCompleted.startTime).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // Risk score calculation (0-100)
      let riskScore = 0;

      // No-show penalty (up to 30 points)
      riskScore += Math.min(noShowCount * 10, 30);

      // Cancellation penalty (up to 20 points)
      riskScore += Math.min(cancelCount * 5, 20);

      // Consecutive misses penalty (up to 25 points)
      riskScore += Math.min(missedInRowCount * 12.5, 25);

      // Days since last visit penalty (up to 25 points)
      if (daysSinceLastVisit !== null) {
        if (daysSinceLastVisit > 90) riskScore += Math.min((daysSinceLastVisit - 90) / 10, 25);
      }

      // Adjust for good behavior
      if (totalAppointments > 0) {
        const completionRate = completedCount / totalAppointments;
        riskScore = riskScore * (1 - completionRate * 0.3); // Up to 30% reduction for good attendance
      }

      riskScore = Math.min(Math.max(Math.round(riskScore), 0), 100);

      // Determine risk level
      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      if (riskScore >= 75) riskLevel = 'CRITICAL';
      else if (riskScore >= 50) riskLevel = 'HIGH';
      else if (riskScore >= 25) riskLevel = 'MEDIUM';
      else riskLevel = 'LOW';

      // Build risk factors
      const riskFactors: { factor: string; weight: number; description: string; value: string }[] = [];

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

      // Only create/update if there's meaningful risk
      if (riskScore > 0 || riskLevel !== 'LOW') {
        // Check if risk score exists
        const existing = await db.patientRiskScore.findFirst({
          where: {
            patientId: patient.id,
            ...clinicFilter,
          },
        });

        if (existing) {
          await db.patientRiskScore.update({
            where: { id: existing.id },
            data: {
              riskScore,
              riskLevel,
              calculatedAt: new Date(),
              riskFactors,
              recommendedActions,
              noShowCount,
              cancelCount,
              missedInRowCount,
              daysSinceLastVisit,
              totalAppointments,
              // Reset status if score increased significantly
              status: riskScore > (existing.riskScore + 20) ? 'ACTIVE' : existing.status,
            },
          });
        } else {
          await db.patientRiskScore.create({
            data: {
              clinicId: session.user.clinicId,
              patientId: patient.id,
              riskScore,
              riskLevel,
              riskFactors,
              recommendedActions,
              noShowCount,
              cancelCount,
              missedInRowCount,
              daysSinceLastVisit,
              totalAppointments,
            },
          });
        }

        results.push({ patientId: patient.id, riskScore, riskLevel });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        processed: patients.length,
        updated: results.length,
        results: patientId ? results : undefined, // Only include details for single patient
      },
    });
  },
  { permissions: ['booking:write'] }
);
