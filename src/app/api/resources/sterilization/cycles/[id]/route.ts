import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  updateSterilizationCycleSchema,
  completeSterilizationCycleSchema,
} from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/cycles/[id]
 * Get a single sterilization cycle by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const cycle = await db.sterilizationCycle.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        loads: true,
        biologicalIndicators: true,
        chemicalIndicators: true,
      },
    });

    if (!cycle) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CYCLE_NOT_FOUND',
            message: 'Sterilization cycle not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: cycle });
  },
  { permissions: ['sterilization:read'] }
);

/**
 * PUT /api/resources/sterilization/cycles/[id]
 * Update a sterilization cycle
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Check if cycle exists
    const existingCycle = await db.sterilizationCycle.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingCycle) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CYCLE_NOT_FOUND',
            message: 'Sterilization cycle not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input
    const result = updateSterilizationCycleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid sterilization cycle data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // If equipmentId is being changed, verify new equipment exists
    if (data.equipmentId && data.equipmentId !== existingCycle.equipmentId) {
      const equipment = await db.equipment.findFirst({
        where: {
          id: data.equipmentId,
          clinicId: session.user.clinicId,
          deletedAt: null,
        },
      });

      if (!equipment) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EQUIPMENT_NOT_FOUND',
              message: 'Equipment not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Update the cycle
    const cycle = await db.sterilizationCycle.update({
      where: { id },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
      include: {
        _count: {
          select: {
            loads: true,
            biologicalIndicators: true,
            chemicalIndicators: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'SterilizationCycle',
      entityId: cycle.id,
      details: {
        cycleNumber: cycle.cycleNumber,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: cycle });
  },
  { permissions: ['sterilization:update'] }
);

/**
 * DELETE /api/resources/sterilization/cycles/[id]
 * Void a sterilization cycle (soft delete by marking as VOID)
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const existingCycle = await db.sterilizationCycle.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingCycle) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CYCLE_NOT_FOUND',
            message: 'Sterilization cycle not found',
          },
        },
        { status: 404 }
      );
    }

    // Mark as VOID instead of deleting (for audit trail)
    const cycle = await db.sterilizationCycle.update({
      where: { id },
      data: {
        status: 'VOID',
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'SterilizationCycle',
      entityId: cycle.id,
      details: {
        cycleNumber: cycle.cycleNumber,
        action: 'Voided',
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: cycle });
  },
  { permissions: ['sterilization:delete'] }
);
