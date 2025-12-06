import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createEquipmentSchema,
  equipmentQuerySchema,
} from '@/lib/validations/equipment';

/**
 * GET /api/resources/equipment
 * List equipment with pagination, search, and filters
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      condition: searchParams.get('condition') ?? undefined,
      typeId: searchParams.get('typeId') ?? undefined,
      roomId: searchParams.get('roomId') ?? undefined,
      vendorId: searchParams.get('vendorId') ?? undefined,
      maintenanceDue: searchParams.get('maintenanceDue') ?? undefined,
      warrantyExpiring: searchParams.get('warrantyExpiring') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = equipmentQuerySchema.safeParse(rawParams);

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
      search,
      category,
      status,
      condition,
      typeId,
      roomId,
      vendorId,
      maintenanceDue,
      warrantyExpiring,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with standardized soft delete filter
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (category) where.category = category;
    if (status) where.status = status;
    if (condition) where.condition = condition;
    if (typeId) where.typeId = typeId;
    if (roomId) where.roomId = roomId;
    if (vendorId) where.vendorId = vendorId;

    // Search across name, equipment number, serial number, and barcode
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { equipmentNumber: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter for equipment with maintenance due soon (within 30 days)
    if (maintenanceDue) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.nextMaintenanceDate = {
        lte: thirtyDaysFromNow,
        not: null,
      };
    }

    // Filter for equipment with warranty expiring soon (within 90 days)
    if (warrantyExpiring) {
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
      where.warrantyExpiry = {
        lte: ninetyDaysFromNow,
        gte: new Date(), // Not already expired
      };
    }

    // Get total count
    const total = await db.equipment.count({ where });

    // Get paginated results
    const items = await db.equipment.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        type: {
          select: { id: true, name: true, code: true, category: true },
        },
        vendor: {
          select: { id: true, name: true, code: true },
        },
        _count: {
          select: {
            maintenanceRecords: true,
            repairRecords: true,
          },
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
 * POST /api/resources/equipment
 * Create a new equipment record
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createEquipmentSchema.safeParse(body);
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

    // Check for duplicate equipment number in this clinic
    const existingByNumber = await db.equipment.findFirst({
      where: withSoftDelete({
        clinicId: session.user.clinicId,
        equipmentNumber: data.equipmentNumber,
      }),
    });

    if (existingByNumber) {
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

    // Verify the equipment type exists
    const equipmentType = await db.equipmentType.findFirst({
      where: {
        id: data.typeId,
        OR: [
          { clinicId: session.user.clinicId },
          { clinicId: null }, // System types
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

    // Apply defaults from equipment type if not provided
    const maintenanceIntervalDays =
      data.maintenanceIntervalDays ?? equipmentType.defaultMaintenanceIntervalDays;
    const usefulLifeMonths =
      data.usefulLifeMonths ?? equipmentType.defaultUsefulLifeMonths;
    const depreciationMethod =
      data.depreciationMethod ?? equipmentType.defaultDepreciationMethod ?? 'STRAIGHT_LINE';

    // Calculate next maintenance date if interval is set
    let nextMaintenanceDate = data.nextMaintenanceDate;
    if (!nextMaintenanceDate && maintenanceIntervalDays) {
      nextMaintenanceDate = new Date();
      nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + maintenanceIntervalDays);
    }

    // Calculate initial book value and monthly depreciation
    let currentBookValue = data.purchasePrice ?? null;
    let monthlyDepreciation: number | null = null;
    if (data.purchasePrice && usefulLifeMonths && depreciationMethod !== 'NONE') {
      const salvageValue = data.salvageValue ?? 0;
      if (depreciationMethod === 'STRAIGHT_LINE') {
        monthlyDepreciation = (data.purchasePrice - salvageValue) / usefulLifeMonths;
      }
    }

    // Create the equipment record
    const equipment = await db.equipment.create({
      data: {
        clinicId: session.user.clinicId,
        name: data.name,
        equipmentNumber: data.equipmentNumber,
        serialNumber: data.serialNumber,
        modelNumber: data.modelNumber,
        barcode: data.barcode,
        typeId: data.typeId,
        category: data.category,
        manufacturer: data.manufacturer,
        roomId: data.roomId,
        locationNotes: data.locationNotes,
        status: data.status,
        condition: data.condition,
        purchaseDate: data.purchaseDate,
        purchasePrice: data.purchasePrice,
        vendorId: data.vendorId,
        purchaseOrderNumber: data.purchaseOrderNumber,
        warrantyStartDate: data.warrantyStartDate,
        warrantyExpiry: data.warrantyExpiry,
        warrantyTerms: data.warrantyTerms,
        warrantyNotes: data.warrantyNotes,
        hasExtendedWarranty: data.hasExtendedWarranty,
        extendedWarrantyExpiry: data.extendedWarrantyExpiry,
        usefulLifeMonths,
        salvageValue: data.salvageValue,
        depreciationMethod,
        currentBookValue,
        monthlyDepreciation,
        maintenanceIntervalDays,
        nextMaintenanceDate,
        manualUrl: data.manualUrl,
        photos: data.photos,
        specifications: data.specifications,
        notes: data.notes,
        createdBy: session.user.id,
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
      action: 'CREATE',
      entity: 'Equipment',
      entityId: equipment.id,
      details: {
        equipmentNumber: equipment.equipmentNumber,
        name: equipment.name,
        category: equipment.category,
        type: equipmentType.name,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: equipment },
      { status: 201 }
    );
  },
  { permissions: ['equipment:create'] }
);
