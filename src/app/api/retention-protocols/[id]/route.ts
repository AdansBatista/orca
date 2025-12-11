import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateRetentionProtocolSchema } from '@/lib/validations/treatment';

/**
 * GET /api/retention-protocols/[id]
 * Get a single retention protocol with checks history
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const retentionProtocol = await db.retentionProtocol.findFirst({
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
        managingProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        retentionChecks: {
          orderBy: { checkDate: 'desc' },
          take: 10,
          include: {
            performedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                title: true,
              },
            },
          },
        },
      },
    });

    if (!retentionProtocol) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Retention protocol not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: retentionProtocol });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PATCH /api/retention-protocols/[id]
 * Update a retention protocol
 */
export const PATCH = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateRetentionProtocolSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid retention protocol data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Find existing record
    const existing = await db.retentionProtocol.findFirst({
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
            message: 'Retention protocol not found',
          },
        },
        { status: 404 }
      );
    }

    // Update the protocol
    const retentionProtocol = await db.retentionProtocol.update({
      where: { id },
      data: {
        ...data,
        lastComplianceUpdate: data.complianceStatus ? new Date() : undefined,
        lastStabilityAssessment: data.stabilityStatus ? new Date() : undefined,
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
        managingProvider: {
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
      entity: 'RetentionProtocol',
      entityId: retentionProtocol.id,
      details: {
        patientId: retentionProtocol.patientId,
        treatmentPlanId: retentionProtocol.treatmentPlanId,
        changes: data,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: retentionProtocol });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/retention-protocols/[id]
 * Deactivate a retention protocol (soft close)
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Find existing record
    const existing = await db.retentionProtocol.findFirst({
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
            message: 'Retention protocol not found',
          },
        },
        { status: 404 }
      );
    }

    // Deactivate the protocol (soft close)
    const retentionProtocol = await db.retentionProtocol.update({
      where: { id },
      data: {
        isActive: false,
        endDate: new Date(),
        endReason: 'Protocol closed',
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'RetentionProtocol',
      entityId: id,
      details: {
        action: 'CLOSED',
        patientId: existing.patientId,
        treatmentPlanId: existing.treatmentPlanId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: retentionProtocol });
  },
  { permissions: ['treatment:delete'] }
);
