import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { flowQuerySchema } from '@/lib/validations/ops';

/**
 * GET /api/ops/flow
 * Get patient flow states for today (or specified date)
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse and validate query params
    const result = flowQuerySchema.safeParse({
      date: searchParams.get('date') || undefined,
      stage: searchParams.get('stage') || undefined,
      providerId: searchParams.get('providerId') || undefined,
      chairId: searchParams.get('chairId') || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { date, stage, providerId, chairId } = result.data;

    // Default to today
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
      scheduledAt: {
        gte: targetDate,
        lt: nextDay,
      },
    };

    if (stage) {
      where.stage = stage;
    }

    if (providerId) {
      where.providerId = providerId;
    }

    if (chairId) {
      where.chairId = chairId;
    }

    // Fetch flow states with related data
    const flowStates = await db.patientFlowState.findMany({
      where,
      include: {
        appointment: {
          include: {
            appointmentType: {
              select: {
                id: true,
                name: true,
                code: true,
                color: true,
                defaultDuration: true,
              },
            },
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            providerType: true,
          },
        },
        chair: {
          select: {
            id: true,
            name: true,
            chairNumber: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledAt: 'asc' },
      ],
    });

    // Calculate current wait time for waiting patients
    const now = new Date();
    const flowStatesWithWait = flowStates.map((flow) => {
      let currentWaitMinutes = 0;
      if (flow.currentWaitStartedAt) {
        currentWaitMinutes = Math.floor(
          (now.getTime() - flow.currentWaitStartedAt.getTime()) / 60000
        );
      }

      return {
        ...flow,
        currentWaitMinutes,
      };
    });

    return NextResponse.json({
      success: true,
      data: flowStatesWithWait,
    });
  },
  { permissions: ['ops:read'] }
);
