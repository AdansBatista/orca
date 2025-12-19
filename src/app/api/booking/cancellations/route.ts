import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { cancellationQuerySchema } from '@/lib/validations/waitlist';

/**
 * GET /api/booking/cancellations
 * List appointment cancellations with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      patientId: searchParams.get('patientId') ?? undefined,
      appointmentTypeId: searchParams.get('appointmentTypeId') ?? undefined,
      providerId: searchParams.get('providerId') ?? undefined,
      cancellationType: searchParams.get('cancellationType') ?? undefined,
      reason: searchParams.get('reason') ?? undefined,
      recoveryStatus: searchParams.get('recoveryStatus') ?? undefined,
      isLateCancel: searchParams.get('isLateCancel') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = cancellationQuerySchema.safeParse(rawParams);

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
      patientId,
      appointmentTypeId,
      providerId,
      cancellationType,
      reason,
      recoveryStatus,
      isLateCancel,
      startDate,
      endDate,
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
    if (patientId) where.patientId = patientId;
    if (appointmentTypeId) where.appointmentTypeId = appointmentTypeId;
    if (providerId) where.originalProviderId = providerId;
    if (cancellationType) where.cancellationType = cancellationType;
    if (reason) where.reason = reason;
    if (recoveryStatus) where.recoveryStatus = recoveryStatus;
    if (isLateCancel !== undefined) where.isLateCancel = isLateCancel;

    // Date range filter
    if (startDate || endDate) {
      where.cancelledAt = {};
      if (startDate) (where.cancelledAt as Record<string, Date>).gte = startDate;
      if (endDate) (where.cancelledAt as Record<string, Date>).lte = endDate;
    }

    // Count total
    const total = await db.appointmentCancellation.count({ where });

    // Fetch cancellations
    const cancellations = await db.appointmentCancellation.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
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
        items: cancellations,
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
 * GET /api/booking/cancellations/analytics
 * Get cancellation analytics
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();
    const { startDate, endDate } = body;

    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (startDate || endDate) {
      where.cancelledAt = {};
      if (startDate) (where.cancelledAt as Record<string, Date>).gte = new Date(startDate);
      if (endDate) (where.cancelledAt as Record<string, Date>).lte = new Date(endDate);
    }

    // Get cancellations for analytics
    const cancellations = await db.appointmentCancellation.findMany({
      where,
      select: {
        cancellationType: true,
        reason: true,
        isLateCancel: true,
        noticeHours: true,
        recoveryStatus: true,
        lateCancelFee: true,
        feeWaived: true,
        originalStartTime: true,
      },
    });

    // Calculate analytics
    const totalCancellations = cancellations.length;
    const byType: Record<string, number> = {};
    const byReason: Record<string, number> = {};
    const byRecoveryStatus: Record<string, number> = {};
    const byDayOfWeek: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    let lateCancelCount = 0;
    let noShowCount = 0;
    let totalFees = 0;
    let waivedFees = 0;
    let totalNoticeHours = 0;

    cancellations.forEach((c) => {
      // By type
      byType[c.cancellationType] = (byType[c.cancellationType] || 0) + 1;

      // By reason
      byReason[c.reason] = (byReason[c.reason] || 0) + 1;

      // By recovery status
      byRecoveryStatus[c.recoveryStatus] = (byRecoveryStatus[c.recoveryStatus] || 0) + 1;

      // By day of week
      const dayOfWeek = new Date(c.originalStartTime).getDay();
      byDayOfWeek[dayOfWeek]++;

      // Late cancellations
      if (c.isLateCancel) lateCancelCount++;

      // No-shows
      if (c.cancellationType === 'NO_SHOW') noShowCount++;

      // Fees
      if (c.lateCancelFee) {
        totalFees += c.lateCancelFee;
        if (c.feeWaived) waivedFees += c.lateCancelFee;
      }

      // Notice hours
      totalNoticeHours += c.noticeHours;
    });

    const avgNoticeHours = totalCancellations > 0 ? totalNoticeHours / totalCancellations : 0;
    const lateCancelRate = totalCancellations > 0 ? (lateCancelCount / totalCancellations) * 100 : 0;
    const noShowRate = totalCancellations > 0 ? (noShowCount / totalCancellations) * 100 : 0;
    const recoveryRate = totalCancellations > 0
      ? ((byRecoveryStatus['RECOVERED'] || 0) / totalCancellations) * 100
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalCancellations,
        lateCancelCount,
        lateCancelRate: Math.round(lateCancelRate * 10) / 10,
        noShowCount,
        noShowRate: Math.round(noShowRate * 10) / 10,
        avgNoticeHours: Math.round(avgNoticeHours * 10) / 10,
        totalFees,
        waivedFees,
        collectedFees: totalFees - waivedFees,
        recoveryRate: Math.round(recoveryRate * 10) / 10,
        byType,
        byReason,
        byRecoveryStatus,
        byDayOfWeek,
      },
    });
  },
  { permissions: ['booking:read'] }
);
