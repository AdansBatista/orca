import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateApplianceRecordSchema } from '@/lib/validations/treatment';
import type { Prisma } from '@prisma/client';

/**
 * GET /api/appliances/[id]
 * Get a single appliance record
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const appliance = await db.applianceRecord.findFirst({
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
        placedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        removedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        wireRecords: {
          orderBy: { sequenceNumber: 'desc' },
          take: 10,
          include: {
            placedBy: {
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

    if (!appliance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPLIANCE_NOT_FOUND',
            message: 'Appliance record not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: appliance });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/appliances/[id]
 * Update an appliance record
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateApplianceRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid appliance data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify appliance exists
    const existingAppliance = await db.applianceRecord.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingAppliance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPLIANCE_NOT_FOUND',
            message: 'Appliance record not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Build update data with proper types
    const updateData: Prisma.ApplianceRecordUpdateInput = {
      ...(data.treatmentPlanId !== undefined && { treatmentPlan: data.treatmentPlanId ? { connect: { id: data.treatmentPlanId } } : { disconnect: true } }),
      ...(data.applianceType !== undefined && { applianceType: data.applianceType }),
      ...(data.applianceSystem !== undefined && { applianceSystem: data.applianceSystem }),
      ...(data.manufacturer !== undefined && { manufacturer: data.manufacturer }),
      ...(data.specification !== undefined && { specification: data.specification as Prisma.InputJsonValue }),
      ...(data.arch !== undefined && { arch: data.arch }),
      ...(data.toothNumbers !== undefined && { toothNumbers: data.toothNumbers }),
      ...(data.placedDate !== undefined && { placedDate: data.placedDate }),
      ...(data.removedDate !== undefined && { removedDate: data.removedDate }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.placedById !== undefined && { placedBy: data.placedById ? { connect: { id: data.placedById } } : { disconnect: true } }),
      ...(data.removedById !== undefined && { removedBy: data.removedById ? { connect: { id: data.removedById } } : { disconnect: true } }),
      ...(data.notes !== undefined && { notes: data.notes }),
    };

    // Update appliance
    const appliance = await db.applianceRecord.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        placedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        removedBy: {
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
      entity: 'ApplianceRecord',
      entityId: id,
      details: {
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: appliance });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/appliances/[id]
 * Delete an appliance record
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Verify appliance exists
    const existingAppliance = await db.applianceRecord.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        _count: {
          select: {
            wireRecords: true,
          },
        },
      },
    });

    if (!existingAppliance) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPLIANCE_NOT_FOUND',
            message: 'Appliance record not found',
          },
        },
        { status: 404 }
      );
    }

    // Prevent deletion if there are wire records
    if (existingAppliance._count.wireRecords > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_DEPENDENCIES',
            message: 'Cannot delete appliance record with wire records. Remove wire records first.',
          },
        },
        { status: 400 }
      );
    }

    // Hard delete (no soft delete field on this model)
    await db.applianceRecord.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ApplianceRecord',
      entityId: id,
      details: {
        applianceType: existingAppliance.applianceType,
        patientId: existingAppliance.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['treatment:delete'] }
);
