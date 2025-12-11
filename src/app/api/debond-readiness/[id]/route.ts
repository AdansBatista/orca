import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateDebondReadinessSchema } from '@/lib/validations/treatment';

/**
 * GET /api/debond-readiness/[id]
 * Get a single debond readiness assessment
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const debondReadiness = await db.debondReadiness.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            planNumber: true,
            status: true,
          },
        },
        assessedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    if (!debondReadiness) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Debond readiness assessment not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: debondReadiness });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PATCH /api/debond-readiness/[id]
 * Update a debond readiness assessment
 */
export const PATCH = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateDebondReadinessSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid debond readiness data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Find existing record
    const existing = await db.debondReadiness.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Debond readiness assessment not found',
          },
        },
        { status: 404 }
      );
    }

    // Calculate new readiness score if criteria changed
    let readinessScore: number | undefined;
    const criteriaFields = [
      'alignmentComplete',
      'spaceClosure',
      'overbiteCorrection',
      'overjetCorrection',
      'midlineAlignment',
      'occlusionSatisfactory',
      'patientSatisfied',
      'rootParallelism',
      'marginalRidges',
      'interproximalContacts',
    ] as const;

    const hasAnyCriteriaChange = criteriaFields.some((field) => data[field] !== undefined);
    if (hasAnyCriteriaChange) {
      const criteria = criteriaFields.map((field) => data[field] ?? existing[field]);
      const criteriaCount = criteria.filter(Boolean).length;
      readinessScore = (criteriaCount / criteria.length) * 100;
    }

    // Update the assessment
    const debondReadiness = await db.debondReadiness.update({
      where: { id },
      data: {
        ...data,
        ...(readinessScore !== undefined ? { readinessScore } : {}),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            planNumber: true,
            status: true,
          },
        },
        assessedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'DebondReadiness',
      entityId: debondReadiness.id,
      details: {
        patientId: debondReadiness.patientId,
        treatmentPlanId: debondReadiness.treatmentPlanId,
        changes: data,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: debondReadiness });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/debond-readiness/[id]
 * Delete a debond readiness assessment
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Find existing record
    const existing = await db.debondReadiness.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Debond readiness assessment not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the record (hard delete since it's an assessment)
    await db.debondReadiness.delete({ where: { id } });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'DebondReadiness',
      entityId: id,
      details: {
        patientId: existing.patientId,
        treatmentPlanId: existing.treatmentPlanId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['treatment:delete'] }
);
