import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  updateBiologicalIndicatorSchema,
  recordBiologicalResultSchema,
} from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/biological-indicators/[id]
 * Get a single biological indicator by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const indicator = await db.biologicalIndicator.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        cycle: {
          select: {
            cycleNumber: true,
            cycleType: true,
            status: true,
            startTime: true,
          },
        },
      },
    });

    if (!indicator) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INDICATOR_NOT_FOUND',
            message: 'Biological indicator not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: indicator });
  },
  { permissions: ['sterilization:read'] }
);

/**
 * PUT /api/resources/sterilization/biological-indicators/[id]
 * Update a biological indicator record
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Check if indicator exists
    const existingIndicator = await db.biologicalIndicator.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingIndicator) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INDICATOR_NOT_FOUND',
            message: 'Biological indicator not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input
    const result = updateBiologicalIndicatorSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid biological indicator data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Update the indicator
    const indicator = await db.biologicalIndicator.update({
      where: { id },
      data: {
        ...data,
        readById: data.readDate ? session.user.id : existingIndicator.readById,
      },
      include: {
        cycle: {
          select: {
            cycleNumber: true,
            cycleType: true,
            status: true,
          },
        },
      },
    });

    // If result changed and has a cycle, update the cycle's biological pass
    if (data.result && data.result !== 'PENDING' && indicator.cycleId) {
      await db.sterilizationCycle.update({
        where: { id: indicator.cycleId },
        data: {
          biologicalPass: data.result === 'PASSED',
          updatedBy: session.user.id,
        },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'BiologicalIndicator',
      entityId: indicator.id,
      details: {
        lotNumber: indicator.lotNumber,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: indicator });
  },
  { permissions: ['sterilization:update'] }
);

/**
 * PATCH /api/resources/sterilization/biological-indicators/[id]
 * Record the result of a biological indicator test
 */
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Check if indicator exists
    const existingIndicator = await db.biologicalIndicator.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingIndicator) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INDICATOR_NOT_FOUND',
            message: 'Biological indicator not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input
    const result = recordBiologicalResultSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid result data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Update the indicator with the result
    const indicator = await db.biologicalIndicator.update({
      where: { id },
      data: {
        readDate: data.readDate,
        result: data.result,
        controlPassed: data.controlPassed,
        notes: data.notes ?? existingIndicator.notes,
        readById: session.user.id,
      },
      include: {
        cycle: {
          select: {
            cycleNumber: true,
            cycleType: true,
            status: true,
          },
        },
      },
    });

    // Update the cycle's biological pass if linked
    if (indicator.cycleId) {
      await db.sterilizationCycle.update({
        where: { id: indicator.cycleId },
        data: {
          biologicalPass: data.result === 'PASSED',
          updatedBy: session.user.id,
        },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'BiologicalIndicator',
      entityId: indicator.id,
      details: {
        lotNumber: indicator.lotNumber,
        result: indicator.result,
        action: 'RecordResult',
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: indicator });
  },
  { permissions: ['sterilization:update'] }
);

/**
 * DELETE /api/resources/sterilization/biological-indicators/[id]
 * Delete a biological indicator record
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const existingIndicator = await db.biologicalIndicator.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingIndicator) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INDICATOR_NOT_FOUND',
            message: 'Biological indicator not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the indicator
    await db.biologicalIndicator.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'BiologicalIndicator',
      entityId: id,
      details: {
        lotNumber: existingIndicator.lotNumber,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['sterilization:delete'] }
);
