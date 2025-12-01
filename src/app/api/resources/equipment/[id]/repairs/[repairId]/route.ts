import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateRepairRecordSchema } from '@/lib/validations/equipment';
import { RepairStatus } from '@prisma/client';

/**
 * GET /api/resources/equipment/:id/repairs/:repairId
 * Get a specific repair record
 */
export const GET = withAuth<{ id: string; repairId: string }>(
  async (req, session, { params }) => {
    const { id: equipmentId, repairId } = await params;

    const repairRecord = await db.repairRecord.findFirst({
      where: {
        id: repairId,
        equipmentId,
        clinicId: session.user.clinicId,
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true, phone: true, email: true },
        },
        equipment: {
          select: {
            id: true,
            name: true,
            equipmentNumber: true,
            status: true,
            warrantyExpiry: true,
            extendedWarrantyExpiry: true,
          },
        },
      },
    });

    if (!repairRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Repair record not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: repairRecord,
    });
  },
  { permissions: ['equipment:read'] }
);

/**
 * PUT /api/resources/equipment/:id/repairs/:repairId
 * Update a repair record
 */
export const PUT = withAuth<{ id: string; repairId: string }>(
  async (req, session, { params }) => {
    const { id: equipmentId, repairId } = await params;
    const body = await req.json();

    // Find the existing repair record
    const existing = await db.repairRecord.findFirst({
      where: {
        id: repairId,
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
            message: 'Repair record not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input
    const result = updateRepairRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid repair data',
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
        where: {
          id: data.vendorId,
          clinicId: session.user.clinicId,
          deletedAt: null,
        },
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
    const travelCost = data.travelCost ?? existing.travelCost;
    const calculatedCost = (laborCost ?? 0) + (partsCost ?? 0) + (travelCost ?? 0);
    const totalCost = data.totalCost ?? (calculatedCost > 0 ? calculatedCost : existing.totalCost);

    // Set equipment down end if completing repair
    const status = data.status ?? existing.status;
    let equipmentDownEnd = data.equipmentDownEnd ?? existing.equipmentDownEnd;
    if (status === 'COMPLETED' && existing.status !== 'COMPLETED' && !equipmentDownEnd) {
      equipmentDownEnd = new Date();
    }

    // Update the repair record
    const repairRecord = await db.repairRecord.update({
      where: { id: repairId },
      data: {
        ...data,
        totalCost,
        equipmentDownEnd,
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

    // Update equipment status based on repair status
    const completedStatuses: RepairStatus[] = ['COMPLETED', 'CANNOT_REPAIR', 'CANCELLED'];
    const wasActive = !completedStatuses.includes(existing.status);
    const isNowCompleted = completedStatuses.includes(status as RepairStatus);

    if (wasActive && isNowCompleted) {
      // Check if there are other active repairs for this equipment
      const otherActiveRepairs = await db.repairRecord.count({
        where: {
          equipmentId,
          id: { not: repairId },
          status: { notIn: completedStatuses },
        },
      });

      // If no other active repairs, set equipment back to active (or previous status)
      if (otherActiveRepairs === 0) {
        const newEquipmentStatus = status === 'CANNOT_REPAIR' ? 'OUT_OF_SERVICE' : 'ACTIVE';
        await db.equipment.update({
          where: { id: equipmentId },
          data: {
            status: newEquipmentStatus,
            updatedBy: session.user.id,
          },
        });
      }
    } else if (!wasActive && !isNowCompleted && (data.severity === 'HIGH' || data.severity === 'CRITICAL')) {
      // If re-opening a high/critical repair, set equipment to IN_REPAIR
      await db.equipment.update({
        where: { id: equipmentId },
        data: {
          status: 'IN_REPAIR',
          updatedBy: session.user.id,
        },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'RepairRecord',
      entityId: repairRecord.id,
      details: {
        equipmentNumber: existing.equipment.equipmentNumber,
        previousStatus: existing.status,
        newStatus: repairRecord.status,
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: repairRecord,
    });
  },
  { permissions: ['equipment:maintenance'] }
);

/**
 * DELETE /api/resources/equipment/:id/repairs/:repairId
 * Delete a repair record (only if in REPORTED status)
 */
export const DELETE = withAuth<{ id: string; repairId: string }>(
  async (req, session, { params }) => {
    const { id: equipmentId, repairId } = await params;

    // Find the existing repair record
    const existing = await db.repairRecord.findFirst({
      where: {
        id: repairId,
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
            message: 'Repair record not found',
          },
        },
        { status: 404 }
      );
    }

    // Can only delete repairs that are still in REPORTED status
    if (existing.status !== 'REPORTED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CANNOT_DELETE',
            message: 'Can only delete repair records that are still in REPORTED status',
            details: { currentStatus: existing.status },
          },
        },
        { status: 400 }
      );
    }

    // Delete the repair record
    await db.repairRecord.delete({
      where: { id: repairId },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'RepairRecord',
      entityId: existing.id,
      details: {
        equipmentNumber: existing.equipment.equipmentNumber,
        severity: existing.severity,
        issueDescription: existing.issueDescription.substring(0, 100),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id: repairId },
    });
  },
  { permissions: ['equipment:maintenance'] }
);
