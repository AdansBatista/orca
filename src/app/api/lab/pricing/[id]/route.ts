import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateLabFeeScheduleSchema } from '@/lib/validations/lab';

/**
 * GET /api/lab/pricing/[id]
 * Get a specific fee schedule
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const feeSchedule = await db.labFeeSchedule.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
        product: {
          select: { id: true, name: true, category: true, sku: true },
        },
      },
    });

    if (!feeSchedule) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FEE_SCHEDULE_NOT_FOUND',
            message: 'Fee schedule not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: feeSchedule });
  },
  { permissions: ['lab:view'] }
);

/**
 * PUT /api/lab/pricing/[id]
 * Update a fee schedule
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    const result = updateLabFeeScheduleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid fee schedule data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const existing = await db.labFeeSchedule.findFirst({
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
            code: 'FEE_SCHEDULE_NOT_FOUND',
            message: 'Fee schedule not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // If activating, deactivate others for same vendor/product
    if (data.isActive === true && !existing.isActive) {
      await db.labFeeSchedule.updateMany({
        where: {
          clinicId: session.user.clinicId,
          vendorId: existing.vendorId,
          productId: existing.productId,
          isActive: true,
          id: { not: id },
        },
        data: {
          isActive: false,
          endDate: new Date(),
        },
      });
    }

    const feeSchedule = await db.labFeeSchedule.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
        product: {
          select: { id: true, name: true, category: true },
        },
      },
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'LabFeeSchedule',
      entityId: feeSchedule.id,
      details: { changes: Object.keys(data) },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: feeSchedule });
  },
  { permissions: ['lab:manage_vendors'] }
);

/**
 * DELETE /api/lab/pricing/[id]
 * Delete a fee schedule
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const existing = await db.labFeeSchedule.findFirst({
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
            code: 'FEE_SCHEDULE_NOT_FOUND',
            message: 'Fee schedule not found',
          },
        },
        { status: 404 }
      );
    }

    await db.labFeeSchedule.delete({
      where: { id },
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'LabFeeSchedule',
      entityId: id,
      details: { vendorId: existing.vendorId, productId: existing.productId },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['lab:manage_vendors'] }
);
