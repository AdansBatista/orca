import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateApplianceActivationSchema } from '@/lib/validations/treatment';

/**
 * GET /api/appliance-activations/[id]
 * Get a single appliance activation
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const activation = await db.applianceActivation.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
      include: {
        applianceRecord: {
          select: {
            id: true,
            applianceType: true,
            arch: true,
            status: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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

    if (!activation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Appliance activation not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: activation,
    });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/appliance-activations/[id]
 * Update an appliance activation
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Verify activation exists and belongs to clinic
    const existing = await db.applianceActivation.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Appliance activation not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input
    const result = updateApplianceActivationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid activation data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Update activation
    const activation = await db.applianceActivation.update({
      where: { id },
      data: {
        activationDate: data.activationDate,
        activationType: data.activationType,
        turns: data.turns ?? null,
        millimeters: data.millimeters ?? null,
        instructions: data.instructions ?? null,
        nextActivationDate: data.nextActivationDate ?? null,
        isPatientReported: data.isPatientReported,
        reportedWearHours: data.reportedWearHours ?? null,
        notes: data.notes ?? null,
      },
      include: {
        applianceRecord: {
          select: {
            id: true,
            applianceType: true,
            arch: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
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

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ApplianceActivation',
      entityId: activation.id,
      details: {
        activationType: data.activationType,
        turns: data.turns,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: activation,
    });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/appliance-activations/[id]
 * Delete an appliance activation
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Verify activation exists and belongs to clinic
    const existing = await db.applianceActivation.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Appliance activation not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete activation
    await db.applianceActivation.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ApplianceActivation',
      entityId: id,
      details: {
        applianceRecordId: existing.applianceRecordId,
        activationType: existing.activationType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['treatment:delete'] }
);
