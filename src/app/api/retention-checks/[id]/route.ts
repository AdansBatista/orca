import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateRetentionCheckSchema } from '@/lib/validations/treatment';

/**
 * GET /api/retention-checks/[id]
 * Get a single retention check
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const retentionCheck = await db.retentionCheck.findFirst({
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
        retentionProtocol: {
          select: {
            id: true,
            currentPhase: true,
            wearSchedule: true,
            treatmentPlan: {
              select: {
                id: true,
                planNumber: true,
              },
            },
          },
        },
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    if (!retentionCheck) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Retention check not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: retentionCheck });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PATCH /api/retention-checks/[id]
 * Update a retention check
 */
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateRetentionCheckSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid retention check data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Find existing record
    const existing = await db.retentionCheck.findFirst({
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
            message: 'Retention check not found',
          },
        },
        { status: 404 }
      );
    }

    // Update the check
    const retentionCheck = await db.retentionCheck.update({
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
        retentionProtocol: {
          select: {
            id: true,
            currentPhase: true,
            wearSchedule: true,
          },
        },
        performedBy: {
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
      entity: 'RetentionCheck',
      entityId: retentionCheck.id,
      details: {
        retentionProtocolId: retentionCheck.retentionProtocolId,
        patientId: retentionCheck.patientId,
        changes: data,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: retentionCheck });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/retention-checks/[id]
 * Delete a retention check
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Find existing record
    const existing = await db.retentionCheck.findFirst({
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
            message: 'Retention check not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the record
    await db.retentionCheck.delete({ where: { id } });

    // Update the protocol's total check count
    await db.retentionProtocol.update({
      where: { id: existing.retentionProtocolId },
      data: { totalChecks: { decrement: 1 } },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'RetentionCheck',
      entityId: id,
      details: {
        retentionProtocolId: existing.retentionProtocolId,
        patientId: existing.patientId,
        checkNumber: existing.checkNumber,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['treatment:delete'] }
);
