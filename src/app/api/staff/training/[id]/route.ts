import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateTrainingRecordSchema } from '@/lib/validations/performance';

/**
 * GET /api/staff/training/[id]
 * Get a single training record
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    const training = await db.trainingRecord.findFirst({
      where: {
        id,
        ...clinicFilter,
      },
      include: {
        staffProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    if (!training) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Training record not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: training });
  },
  { permissions: ['staff:read', 'staff:write', 'staff:admin'] }
);

/**
 * PUT /api/staff/training/[id]
 * Update a training record
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);

    // Validate input
    const result = updateTrainingRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid training data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if training record exists
    const existing = await db.trainingRecord.findFirst({
      where: {
        id,
        ...clinicFilter,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Training record not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Update the training record
    const training = await db.trainingRecord.update({
      where: { id },
      data,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'TrainingRecord',
      entityId: training.id,
      details: {
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: training });
  },
  { permissions: ['staff:write', 'staff:admin'] }
);

/**
 * DELETE /api/staff/training/[id]
 * Delete a training record
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    // Check if training record exists
    const existing = await db.trainingRecord.findFirst({
      where: {
        id,
        ...clinicFilter,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Training record not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the training record
    await db.trainingRecord.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'TrainingRecord',
      entityId: id,
      details: {
        staffProfileId: existing.staffProfileId,
        name: existing.name,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['staff:admin'] }
);
