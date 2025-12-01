import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createEquipmentTypeSchema,
  equipmentTypeQuerySchema,
} from '@/lib/validations/equipment';

/**
 * GET /api/resources/equipment/types
 * List equipment types (both system and clinic-specific)
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      includeSystem: searchParams.get('includeSystem') ?? 'true',
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = equipmentTypeQuerySchema.safeParse(rawParams);

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

    const { search, category, isActive, includeSystem, page, pageSize } = queryResult.data;

    // Build where clause - include both clinic-specific and system types
    const whereConditions: Record<string, unknown>[] = [
      { clinicId: session.user.clinicId },
    ];

    if (includeSystem) {
      whereConditions.push({ clinicId: null, isSystem: true });
    }

    const where: Record<string, unknown> = {
      OR: whereConditions,
    };

    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive;

    // Search by name or code
    if (search) {
      where.AND = [
        {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { code: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    // Get total count
    const total = await db.equipmentType.count({ where });

    // Get paginated results
    const items = await db.equipmentType.findMany({
      where,
      orderBy: [
        { isSystem: 'desc' }, // System types first
        { name: 'asc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        _count: {
          select: { equipment: true },
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
 * POST /api/resources/equipment/types
 * Create a new clinic-specific equipment type
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createEquipmentTypeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid equipment type data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate code in this clinic (or system types)
    const existingByCode = await db.equipmentType.findFirst({
      where: {
        code: data.code,
        OR: [
          { clinicId: session.user.clinicId },
          { clinicId: null }, // System types
        ],
      },
    });

    if (existingByCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CODE',
            message: 'An equipment type with this code already exists',
          },
        },
        { status: 409 }
      );
    }

    // Create the equipment type (clinic-specific, not system)
    const equipmentType = await db.equipmentType.create({
      data: {
        clinicId: session.user.clinicId,
        name: data.name,
        code: data.code,
        category: data.category,
        description: data.description,
        defaultMaintenanceIntervalDays: data.defaultMaintenanceIntervalDays,
        maintenanceChecklist: data.maintenanceChecklist,
        defaultUsefulLifeMonths: data.defaultUsefulLifeMonths,
        defaultDepreciationMethod: data.defaultDepreciationMethod,
        isSystem: false, // Clinic types are never system types
        isActive: data.isActive,
        createdBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'EquipmentType',
      entityId: equipmentType.id,
      details: {
        code: equipmentType.code,
        name: equipmentType.name,
        category: equipmentType.category,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: equipmentType },
      { status: 201 }
    );
  },
  { permissions: ['equipment:create'] }
);
