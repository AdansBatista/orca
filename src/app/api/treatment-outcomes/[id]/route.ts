import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateTreatmentOutcomeSchema } from '@/lib/validations/treatment';

/**
 * GET /api/treatment-outcomes/[id]
 * Get a single treatment outcome
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const treatmentOutcome = await db.treatmentOutcome.findFirst({
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
            planName: true,
            status: true,
            startDate: true,
            actualEndDate: true,
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
      },
    });

    if (!treatmentOutcome) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Treatment outcome not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: treatmentOutcome });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PATCH /api/treatment-outcomes/[id]
 * Update a treatment outcome
 */
export const PATCH = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateTreatmentOutcomeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid treatment outcome data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Find existing record
    const existing = await db.treatmentOutcome.findFirst({
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
            message: 'Treatment outcome not found',
          },
        },
        { status: 404 }
      );
    }

    // Update the outcome
    const treatmentOutcome = await db.treatmentOutcome.update({
      where: { id },
      data,
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
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'TreatmentOutcome',
      entityId: treatmentOutcome.id,
      details: {
        patientId: treatmentOutcome.patientId,
        treatmentPlanId: treatmentOutcome.treatmentPlanId,
        changes: data,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: treatmentOutcome });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/treatment-outcomes/[id]
 * Delete a treatment outcome
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Find existing record
    const existing = await db.treatmentOutcome.findFirst({
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
            message: 'Treatment outcome not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the record
    await db.treatmentOutcome.delete({ where: { id } });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'TreatmentOutcome',
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
