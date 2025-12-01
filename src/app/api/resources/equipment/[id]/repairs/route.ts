import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createRepairRecordSchema,
  repairQuerySchema,
} from '@/lib/validations/equipment';

/**
 * GET /api/resources/equipment/:id/repairs
 * Get repair history for a specific equipment
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id: equipmentId } = await params;
    const { searchParams } = new URL(req.url);

    // Verify equipment exists and belongs to clinic
    const equipment = await db.equipment.findFirst({
      where: {
        id: equipmentId,
        ...getClinicFilter(session),
        deletedAt: null,
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

    // Parse query parameters
    const rawParams = {
      status: searchParams.get('status') ?? undefined,
      severity: searchParams.get('severity') ?? undefined,
      vendorId: searchParams.get('vendorId') ?? undefined,
      coveredByWarranty: searchParams.get('coveredByWarranty') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = repairQuerySchema.safeParse(rawParams);

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
      status,
      severity,
      vendorId,
      coveredByWarranty,
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

    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (vendorId) where.vendorId = vendorId;
    if (coveredByWarranty !== undefined) where.coveredByWarranty = coveredByWarranty;

    if (dateFrom || dateTo) {
      where.reportedDate = {};
      if (dateFrom) (where.reportedDate as Record<string, Date>).gte = dateFrom;
      if (dateTo) (where.reportedDate as Record<string, Date>).lte = dateTo;
    }

    // Get total count
    const total = await db.repairRecord.count({ where });

    // Get paginated results
    const items = await db.repairRecord.findMany({
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
 * POST /api/resources/equipment/:id/repairs
 * Report an equipment issue
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id: equipmentId } = await params;
    const body = await req.json();

    // Verify equipment exists and belongs to clinic
    const equipment = await db.equipment.findFirst({
      where: {
        id: equipmentId,
        ...getClinicFilter(session),
        deletedAt: null,
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

    // Cannot report issues on disposed equipment
    if (equipment.status === 'DISPOSED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'EQUIPMENT_DISPOSED',
            message: 'Cannot report issues on disposed equipment',
          },
        },
        { status: 400 }
      );
    }

    // Validate input
    const result = createRepairRecordSchema.safeParse(body);
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

    // If vendor is specified, verify it exists
    if (data.vendorId) {
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
    const calculatedCost = (data.laborCost ?? 0) + (data.partsCost ?? 0) + (data.travelCost ?? 0);
    const totalCost = data.totalCost ?? (calculatedCost > 0 ? calculatedCost : null);

    // Check if equipment is under warranty
    let coveredByWarranty = data.coveredByWarranty;
    if (!coveredByWarranty && equipment.warrantyExpiry) {
      const now = new Date();
      if (equipment.warrantyExpiry > now) {
        coveredByWarranty = true;
      } else if (equipment.hasExtendedWarranty && equipment.extendedWarrantyExpiry) {
        coveredByWarranty = equipment.extendedWarrantyExpiry > now;
      }
    }

    // Create the repair record
    const repairRecord = await db.repairRecord.create({
      data: {
        clinicId: session.user.clinicId,
        equipmentId,
        reportedById: session.user.id,
        issueDescription: data.issueDescription,
        severity: data.severity,
        status: data.status,
        scheduledDate: data.scheduledDate,
        diagnosis: data.diagnosis,
        workPerformed: data.workPerformed,
        partsReplaced: data.partsReplaced,
        resolutionNotes: data.resolutionNotes,
        vendorId: data.vendorId,
        technicianName: data.technicianName,
        serviceTicketNumber: data.serviceTicketNumber,
        laborCost: data.laborCost,
        partsCost: data.partsCost,
        travelCost: data.travelCost,
        totalCost,
        coveredByWarranty,
        warrantyClaimNumber: data.warrantyClaimNumber,
        equipmentDownStart: data.equipmentDownStart ?? (data.severity === 'CRITICAL' ? new Date() : null),
        equipmentDownEnd: data.equipmentDownEnd,
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

    // Update equipment status if severity is HIGH or CRITICAL
    if (data.severity === 'HIGH' || data.severity === 'CRITICAL') {
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
      action: 'CREATE',
      entity: 'RepairRecord',
      entityId: repairRecord.id,
      details: {
        equipmentNumber: equipment.equipmentNumber,
        equipmentName: equipment.name,
        severity: repairRecord.severity,
        issueDescription: repairRecord.issueDescription.substring(0, 100),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: repairRecord },
      { status: 201 }
    );
  },
  { permissions: ['equipment:update'] }
);
