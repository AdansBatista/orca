import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateMaintenanceRecordSchema } from '@/lib/validations/equipment';

/**
 * GET /api/resources/equipment/:id/maintenance/:maintenanceId
 * Get a specific maintenance record
 */
export const GET = withAuth<{ id: string; maintenanceId: string }>(
  async (req, session, { params }) => {
    const { id: equipmentId, maintenanceId } = await params;

    const maintenanceRecord = await db.maintenanceRecord.findFirst({
      where: {
        id: maintenanceId,
        equipmentId,
        clinicId: session.user.clinicId,
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true, phone: true, email: true },
        },
        equipment: {
          select: { id: true, name: true, equipmentNumber: true, status: true },
        },
      },
    });

    if (!maintenanceRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Maintenance record not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: maintenanceRecord,
    });
  },
  { permissions: ['equipment:read'] }
);

/**
 * PUT /api/resources/equipment/:id/maintenance/:maintenanceId
 * Update a maintenance record
 */
export const PUT = withAuth<{ id: string; maintenanceId: string }>(
  async (req, session, { params }) => {
    const { id: equipmentId, maintenanceId } = await params;
    const body = await req.json();

    // Find the existing maintenance record
    const existing = await db.maintenanceRecord.findFirst({
      where: {
        id: maintenanceId,
        equipmentId,
        clinicId: session.user.clinicId,
      },
      include: {
        equipment: true,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Maintenance record not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input
    const result = updateMaintenanceRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid maintenance data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // If vendor is being changed, verify it exists
    if (data.vendorId && data.vendorId !== existing.vendorId) {
      const vendor = await db.supplier.findFirst({
        where: withSoftDelete({
          id: data.vendorId,
          clinicId: session.user.clinicId,
        }),
      });

      if (!vendor) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_VENDOR',
              message: 'Vendor not found',
            },
          },
          { status: 400 }
        );
      }
    }

    // Calculate total cost
    const laborCost = data.laborCost ?? existing.laborCost;
    const partsCost = data.partsCost ?? existing.partsCost;
    const calculatedCost = (laborCost ?? 0) + (partsCost ?? 0);
    const totalCost = data.totalCost ?? (calculatedCost > 0 ? calculatedCost : existing.totalCost);

    // Calculate next maintenance date if completing
    const status = data.status ?? existing.status;
    let nextMaintenanceDate = data.nextMaintenanceDate ?? existing.nextMaintenanceDate;

    if (
      status === 'COMPLETED' &&
      existing.status !== 'COMPLETED' &&
      !nextMaintenanceDate &&
      existing.equipment.maintenanceIntervalDays
    ) {
      const completedDate = data.completedDate ?? new Date();
      nextMaintenanceDate = new Date(completedDate);
      nextMaintenanceDate.setDate(
        nextMaintenanceDate.getDate() + existing.equipment.maintenanceIntervalDays
      );
    }

    // Update the maintenance record
    const maintenanceRecord = await db.maintenanceRecord.update({
      where: { id: maintenanceId },
      data: {
        ...data,
        totalCost,
        nextMaintenanceDate,
        updatedBy: session.user.id,
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
        equipment: {
          select: { id: true, name: true, equipmentNumber: true },
        },
      },
    });

    // Update equipment's maintenance tracking if status changed to completed
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
      await db.equipment.update({
        where: { id: equipmentId },
        data: {
          lastMaintenanceDate: data.completedDate ?? new Date(),
          nextMaintenanceDate,
          updatedBy: session.user.id,
        },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'MaintenanceRecord',
      entityId: maintenanceRecord.id,
      details: {
        equipmentNumber: existing.equipment.equipmentNumber,
        maintenanceType: maintenanceRecord.maintenanceType,
        previousStatus: existing.status,
        newStatus: maintenanceRecord.status,
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: maintenanceRecord,
    });
  },
  { permissions: ['equipment:maintenance'] }
);

/**
 * DELETE /api/resources/equipment/:id/maintenance/:maintenanceId
 * Delete a maintenance record (only if not completed)
 */
export const DELETE = withAuth<{ id: string; maintenanceId: string }>(
  async (req, session, { params }) => {
    const { id: equipmentId, maintenanceId } = await params;

    // Find the existing maintenance record
    const existing = await db.maintenanceRecord.findFirst({
      where: {
        id: maintenanceId,
        equipmentId,
        clinicId: session.user.clinicId,
      },
      include: {
        equipment: {
          select: { equipmentNumber: true, name: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Maintenance record not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot delete completed maintenance records (audit trail)
    if (existing.status === 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CANNOT_DELETE_COMPLETED',
            message: 'Cannot delete completed maintenance records. They are retained for audit purposes.',
          },
        },
        { status: 400 }
      );
    }

    // Delete the maintenance record
    await db.maintenanceRecord.delete({
      where: { id: maintenanceId },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'MaintenanceRecord',
      entityId: existing.id,
      details: {
        equipmentNumber: existing.equipment.equipmentNumber,
        maintenanceType: existing.maintenanceType,
        status: existing.status,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id: maintenanceId },
    });
  },
  { permissions: ['equipment:maintenance'] }
);
