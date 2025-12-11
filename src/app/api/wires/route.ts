import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createWireRecordSchema,
  wireRecordQuerySchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/wires
 * List wire records with filtering
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      applianceRecordId: searchParams.get('applianceRecordId') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      wireType: searchParams.get('wireType') ?? undefined,
      wireMaterial: searchParams.get('wireMaterial') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      arch: searchParams.get('arch') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = wireRecordQuerySchema.safeParse(rawParams);

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
      applianceRecordId,
      patientId,
      wireType,
      wireMaterial,
      status,
      arch,
      fromDate,
      toDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause (no soft delete on this model)
    const where: Record<string, unknown> = getClinicFilter(session);

    if (applianceRecordId) where.applianceRecordId = applianceRecordId;
    if (wireType) where.wireType = wireType;
    if (wireMaterial) where.wireMaterial = wireMaterial;
    if (status) where.status = status;
    if (arch) where.arch = arch;

    // Filter by patient through appliance record
    if (patientId) {
      where.applianceRecord = {
        patientId,
      };
    }

    if (fromDate) {
      where.placedDate = { ...((where.placedDate as object) || {}), gte: fromDate };
    }
    if (toDate) {
      where.placedDate = { ...((where.placedDate as object) || {}), lte: toDate };
    }

    const total = await db.wireRecord.count({ where });

    const items = await db.wireRecord.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        applianceRecord: {
          select: {
            id: true,
            applianceType: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
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
  { permissions: ['treatment:read'] }
);

/**
 * POST /api/wires
 * Create a new wire record
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createWireRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid wire data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify appliance record exists and belongs to clinic
    const applianceRecord = await db.applianceRecord.findFirst({
      where: {
        id: data.applianceRecordId,
        ...getClinicFilter(session),
      },
    });

    if (!applianceRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPLIANCE_RECORD_NOT_FOUND',
            message: 'Appliance record not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify provider exists
    const provider = await db.staffProfile.findFirst({
      where: withSoftDelete({
        id: data.placedById,
      }),
    });

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROVIDER_NOT_FOUND',
            message: 'Provider not found',
          },
        },
        { status: 404 }
      );
    }

    // Get next sequence number
    const lastWire = await db.wireRecord.findFirst({
      where: {
        applianceRecordId: data.applianceRecordId,
        arch: data.arch,
      },
      orderBy: { sequenceNumber: 'desc' },
    });

    const sequenceNumber = data.sequenceNumber ?? (lastWire ? lastWire.sequenceNumber + 1 : 1);

    // Create the wire record
    const wire = await db.wireRecord.create({
      data: {
        clinicId: session.user.clinicId,
        applianceRecordId: data.applianceRecordId,
        wireType: data.wireType,
        wireSize: data.wireSize,
        wireMaterial: data.wireMaterial,
        manufacturer: data.manufacturer,
        arch: data.arch,
        placedDate: data.placedDate,
        removedDate: data.removedDate,
        status: data.status,
        placedById: data.placedById,
        removedById: data.removedById,
        sequenceNumber,
        notes: data.notes,
        bends: data.bends,
      },
      include: {
        applianceRecord: {
          select: {
            id: true,
            applianceType: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        placedBy: {
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
      action: 'CREATE',
      entity: 'WireRecord',
      entityId: wire.id,
      details: {
        applianceRecordId: wire.applianceRecordId,
        wireType: wire.wireType,
        wireSize: wire.wireSize,
        wireMaterial: wire.wireMaterial,
        arch: wire.arch,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: wire }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
