import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateEquipmentSchema } from '@/lib/validations/equipment';

/**
 * GET /api/resources/equipment/:id
 * Get a single equipment record by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    const equipment = await db.equipment.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        type: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
            description: true,
            maintenanceChecklist: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
            phone: true,
            email: true,
            website: true,
          },
        },
        maintenanceRecords: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          select: {
            id: true,
            maintenanceType: true,
            scheduledDate: true,
            completedDate: true,
            status: true,
            performedBy: true,
            totalCost: true,
          },
        },
        repairRecords: {
          orderBy: { reportedDate: 'desc' },
          take: 5,
          select: {
            id: true,
            issueDescription: true,
            severity: true,
            status: true,
            reportedDate: true,
            completedDate: true,
            totalCost: true,
            coveredByWarranty: true,
          },
        },
        _count: {
          select: {
            maintenanceRecords: true,
            repairRecords: true,
          },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Equipment not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: equipment,
    });
  },
  { permissions: ['equipment:read'] }
);

/**
 * PUT /api/resources/equipment/:id
 * Update an equipment record
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    // Find the existing equipment
    const existing = await db.equipment.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Equipment not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input
    const result = updateEquipmentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid equipment data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate equipment number if being changed
    if (data.equipmentNumber && data.equipmentNumber !== existing.equipmentNumber) {
      const duplicateNumber = await db.equipment.findFirst({
        where: withSoftDelete({
          clinicId: session.user.clinicId,
          equipmentNumber: data.equipmentNumber,
          id: { not: id },
        }),
      });

      if (duplicateNumber) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_EQUIPMENT_NUMBER',
              message: 'An equipment item with this equipment number already exists',
            },
          },
          { status: 409 }
        );
      }
    }

    // If equipment type is being changed, verify it exists
    if (data.typeId && data.typeId !== existing.typeId) {
      const equipmentType = await db.equipmentType.findFirst({
        where: {
          id: data.typeId,
          OR: [
            { clinicId: session.user.clinicId },
            { clinicId: null },
          ],
          isActive: true,
        },
      });

      if (!equipmentType) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INVALID_EQUIPMENT_TYPE',
              message: 'Equipment type not found or inactive',
            },
          },
          { status: 400 }
        );
      }
    }

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

    // Recalculate depreciation values if purchase price or depreciation settings change
    const purchasePrice = data.purchasePrice ?? existing.purchasePrice;
    const usefulLifeMonths = data.usefulLifeMonths ?? existing.usefulLifeMonths;
    const salvageValue = data.salvageValue ?? existing.salvageValue ?? 0;
    const depreciationMethod = data.depreciationMethod ?? existing.depreciationMethod;

    let monthlyDepreciation = existing.monthlyDepreciation;
    let currentBookValue = existing.currentBookValue;

    if (
      data.purchasePrice !== undefined ||
      data.usefulLifeMonths !== undefined ||
      data.salvageValue !== undefined ||
      data.depreciationMethod !== undefined
    ) {
      if (purchasePrice && usefulLifeMonths && depreciationMethod !== 'NONE') {
        if (depreciationMethod === 'STRAIGHT_LINE') {
          monthlyDepreciation = (purchasePrice - salvageValue) / usefulLifeMonths;
        }
        currentBookValue = purchasePrice - (existing.accumulatedDepreciation ?? 0);
      } else if (depreciationMethod === 'NONE') {
        monthlyDepreciation = null;
        currentBookValue = purchasePrice;
      }
    }

    // Update the equipment record
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { typeId, vendorId, roomId, ...updateData } = data;
    const equipment = await db.equipment.update({
      where: { id },
      data: {
        ...updateData,
        ...(data.typeId && { type: { connect: { id: data.typeId } } }),
        ...(data.vendorId !== undefined && (data.vendorId
          ? { vendor: { connect: { id: data.vendorId } } }
          : { vendor: { disconnect: true } })),
        ...(data.roomId !== undefined && { roomId: data.roomId }),
        monthlyDepreciation,
        currentBookValue,
        updatedBy: session.user.id,
      },
      include: {
        type: {
          select: { id: true, name: true, code: true, category: true },
        },
        vendor: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Equipment',
      entityId: equipment.id,
      details: {
        equipmentNumber: equipment.equipmentNumber,
        name: equipment.name,
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: equipment,
    });
  },
  { permissions: ['equipment:update'] }
);

/**
 * DELETE /api/resources/equipment/:id
 * Soft delete an equipment record
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    // Find the existing equipment
    const existing = await db.equipment.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Equipment not found',
          },
        },
        { status: 404 }
      );
    }

    // Check for active maintenance or repairs
    const activeRecords = await db.maintenanceRecord.count({
      where: {
        equipmentId: id,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
    });

    const activeRepairs = await db.repairRecord.count({
      where: {
        equipmentId: id,
        status: { in: ['REPORTED', 'DIAGNOSED', 'AWAITING_PARTS', 'SCHEDULED', 'IN_PROGRESS'] },
      },
    });

    if (activeRecords > 0 || activeRepairs > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_ACTIVE_RECORDS',
            message: 'Cannot delete equipment with active maintenance or repair records',
            details: {
              activeMaintenanceRecords: activeRecords,
              activeRepairRecords: activeRepairs,
            },
          },
        },
        { status: 400 }
      );
    }

    // Soft delete the equipment
    await db.equipment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'DISPOSED',
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'Equipment',
      entityId: existing.id,
      details: {
        equipmentNumber: existing.equipmentNumber,
        name: existing.name,
        reason: 'Soft deleted by user',
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['equipment:delete'] }
);
