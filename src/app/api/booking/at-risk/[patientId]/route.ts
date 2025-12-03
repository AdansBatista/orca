import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { reviewRiskScoreSchema, logInterventionSchema } from '@/lib/validations/waitlist';

/**
 * GET /api/booking/at-risk/:patientId
 * Get risk score details for a specific patient
 */
export const GET = withAuth<{ patientId: string }>(
  async (req, session, { params }) => {
    const { patientId } = await params;

    const riskScore = await db.patientRiskScore.findFirst({
      where: {
        patientId,
        ...getClinicFilter(session),
      },
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
    });

    if (!riskScore) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No risk score found for this patient',
          },
        },
        { status: 404 }
      );
    }

    // Get recent appointment history for context
    const recentAppointments = await db.appointment.findMany({
      where: {
        patientId,
        ...getClinicFilter(session),
      },
      orderBy: { startTime: 'desc' },
      take: 10,
      select: {
        id: true,
        startTime: true,
        status: true,
        appointmentType: {
          select: {
            name: true,
            color: true,
          },
        },
      },
    });

    // Get recent cancellations
    const recentCancellations = await db.appointmentCancellation.findMany({
      where: {
        patientId,
        ...getClinicFilter(session),
      },
      orderBy: { cancelledAt: 'desc' },
      take: 5,
      select: {
        id: true,
        cancelledAt: true,
        cancellationType: true,
        reason: true,
        recoveryStatus: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...riskScore,
        recentAppointments,
        recentCancellations,
      },
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/at-risk/:patientId/review
 * Mark a risk score as reviewed
 */
export const PUT = withAuth<{ patientId: string }>(
  async (req, session, { params }) => {
    const { patientId } = await params;
    const body = await req.json();

    const validationResult = reviewRiskScoreSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid review data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { reviewNotes, status } = validationResult.data;

    // Find the risk score
    const existing = await db.patientRiskScore.findFirst({
      where: {
        patientId,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No risk score found for this patient',
          },
        },
        { status: 404 }
      );
    }

    const riskScore = await db.patientRiskScore.update({
      where: { id: existing.id },
      data: {
        status: status || 'REVIEWED',
        reviewedAt: new Date(),
        reviewedBy: session.user.id,
        reviewNotes,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: riskScore,
    });
  },
  { permissions: ['booking:write'] }
);

/**
 * POST /api/booking/at-risk/:patientId/intervene
 * Log an intervention for an at-risk patient
 */
export const POST = withAuth<{ patientId: string }>(
  async (req, session, { params }) => {
    const { patientId } = await params;
    const body = await req.json();

    const validationResult = logInterventionSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid intervention data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { interventionStatus, interventionNotes } = validationResult.data;

    // Find the risk score
    const existing = await db.patientRiskScore.findFirst({
      where: {
        patientId,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'No risk score found for this patient',
          },
        },
        { status: 404 }
      );
    }

    // Determine new status based on intervention result
    let newStatus = existing.status;
    if (interventionStatus === 'SUCCESSFUL') {
      newStatus = 'RESOLVED';
    } else if (interventionStatus === 'UNSUCCESSFUL') {
      newStatus = 'DROPPED_OUT';
    }

    const riskScore = await db.patientRiskScore.update({
      where: { id: existing.id },
      data: {
        interventionStatus,
        interventionAt: new Date(),
        interventionBy: session.user.id,
        interventionNotes,
        status: newStatus,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: riskScore,
    });
  },
  { permissions: ['booking:write'] }
);
