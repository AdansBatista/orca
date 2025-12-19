import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createMaintenanceRecordSchema,
  maintenanceQuerySchema,
} from '@/lib/validations/equipment';

/**
 * GET /api/resources/equipment/:id/maintenance
 * Get maintenance history for a specific equipment
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id: equipmentId } = await params;
    const { searchParams } = new URL(req.url);

    // Verify equipment exists and belongs to clinic
    const equipment = await db.equipment.findFirst({
      where: withSoftDelete({
        id: equipmentId,
        ...getClinicFilter(session),
      }),
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

    // Parse query parameters
    const rawParams = {
      maintenanceType: searchParams.get('maintenanceType') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      vendorId: searchParams.get('vendorId') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = maintenanceQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      maintenanceType,
      status,
      vendorId,
      dateFrom,
      dateTo,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      equipmentId,
      clinicId: session.user.clinicId,
    };

    if (maintenanceType) where.maintenanceType = maintenanceType;
    if (status) where.status = status;
    if (vendorId) where.vendorId = vendorId;

    if (dateFrom || dateTo) {
      where.scheduledDate = {};
      if (dateFrom) (where.scheduledDate as Record<string, Date>).gte = dateFrom;
      if (dateTo) (where.scheduledDate as Record<string, Date>).lte = dateTo;
    }

    // Get total count
    const total = await db.maintenanceRecord.count({ where });

    // Get paginated results
    const items = await db.maintenanceRecord.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['equipment:read'] }
);

/**
 * POST /api/resources/equipment/:id/maintenance
 * Log a maintenance activity for equipment
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id: equipmentId } = await params;
    const body = await req.json();

    // Verify equipment exists and belongs to clinic
    const equipment = await db.equipment.findFirst({
      where: withSoftDelete({
        id: equipmentId,
        ...getClinicFilter(session),
      }),
      include: {
        type: true,
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

    // Validate input
    const result = createMaintenanceRecordSchema.safeParse(body);
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

    // If vendor is specified, verify it exists
    if (data.vendorId) {
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

    // Calculate total cost if parts and labor provided
    const calculatedCost = (data.laborCost ?? 0) + (data.partsCost ?? 0);
    const totalCost = data.totalCost ?? (calculatedCost > 0 ? calculatedCost : null);

    // Calculate next maintenance date based on interval
    let nextMaintenanceDate = data.nextMaintenanceDate;
    if (!nextMaintenanceDate && data.status === 'COMPLETED' && equipment.maintenanceIntervalDays) {
      const completedDate = data.completedDate ?? new Date();
      nextMaintenanceDate = new Date(completedDate);
      nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + equipment.maintenanceIntervalDays);
    }

    // Create the maintenance record
    const maintenanceRecord = await db.maintenanceRecord.create({
      data: {
        clinicId: session.user.clinicId,
        equipmentId,
        maintenanceType: data.maintenanceType,
        scheduledDate: data.scheduledDate,
        completedDate: data.completedDate,
        status: data.status,
        description: data.description,
        checklist: data.checklist,
        notes: data.notes,
        performedBy: data.performedBy,
        performedById: data.performedById,
        vendorId: data.vendorId,
        technicianName: data.technicianName,
        laborCost: data.laborCost,
        partsCost: data.partsCost,
        totalCost,
        nextMaintenanceDate,
        attachments: data.attachments,
        createdBy: session.user.id,
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

    // Update equipment's maintenance tracking if completed
    if (data.status === 'COMPLETED') {
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
      action: 'CREATE',
      entity: 'MaintenanceRecord',
      entityId: maintenanceRecord.id,
      details: {
        equipmentNumber: equipment.equipmentNumber,
        equipmentName: equipment.name,
        maintenanceType: maintenanceRecord.maintenanceType,
        status: maintenanceRecord.status,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: maintenanceRecord },
      { status: 201 }
    );
  },
  { permissions: ['equipment:maintenance'] }
);
