import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateRetainerRecordSchema } from '@/lib/validations/treatment';

/**
 * GET /api/retainers/[id]
 * Get a single retainer record
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const retainer = await db.retainerRecord.findFirst({
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
            planName: true,
            status: true,
          },
        },
        deliveredBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    if (!retainer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RETAINER_NOT_FOUND',
            message: 'Retainer record not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: retainer });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/retainers/[id]
 * Update a retainer record
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateRetainerRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid retainer data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify retainer exists
    const existingRetainer = await db.retainerRecord.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingRetainer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RETAINER_NOT_FOUND',
            message: 'Retainer record not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Update retainer
    const retainer = await db.retainerRecord.update({
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
            planName: true,
          },
        },
        deliveredBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'RetainerRecord',
      entityId: id,
      details: {
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: retainer });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/retainers/[id]
 * Delete a retainer record
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Verify retainer exists
    const existingRetainer = await db.retainerRecord.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingRetainer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RETAINER_NOT_FOUND',
            message: 'Retainer record not found',
          },
        },
        { status: 404 }
      );
    }

    // Hard delete (no soft delete field on this model)
    await db.retainerRecord.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'RetainerRecord',
      entityId: id,
      details: {
        retainerType: existingRetainer.retainerType,
        arch: existingRetainer.arch,
        patientId: existingRetainer.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['treatment:delete'] }
);
