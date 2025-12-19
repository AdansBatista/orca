import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateAlignerRecordSchema } from '@/lib/validations/treatment';

/**
 * GET /api/aligners/[id]
 * Get a single aligner record with deliveries
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const aligner = await db.alignerRecord.findFirst({
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
        deliveries: {
          orderBy: { deliveryDate: 'desc' },
          include: {
            deliveredBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!aligner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALIGNER_NOT_FOUND',
            message: 'Aligner record not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: aligner });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/aligners/[id]
 * Update an aligner record
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateAlignerRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid aligner data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify aligner exists
    const existingAligner = await db.alignerRecord.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingAligner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALIGNER_NOT_FOUND',
            message: 'Aligner record not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Update aligner
    const aligner = await db.alignerRecord.update({
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
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'AlignerRecord',
      entityId: id,
      details: {
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: aligner });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/aligners/[id]
 * Delete an aligner record
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Verify aligner exists
    const existingAligner = await db.alignerRecord.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        _count: {
          select: {
            deliveries: true,
          },
        },
      },
    });

    if (!existingAligner) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALIGNER_NOT_FOUND',
            message: 'Aligner record not found',
          },
        },
        { status: 404 }
      );
    }

    // Prevent deletion if there are deliveries
    if (existingAligner._count.deliveries > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_DEPENDENCIES',
            message: 'Cannot delete aligner record with deliveries. Remove deliveries first.',
          },
        },
        { status: 400 }
      );
    }

    // Hard delete (no soft delete field on this model)
    await db.alignerRecord.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'AlignerRecord',
      entityId: id,
      details: {
        alignerSystem: existingAligner.alignerSystem,
        patientId: existingAligner.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['treatment:delete'] }
);
