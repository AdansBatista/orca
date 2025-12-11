import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createApplianceActivationSchema,
  applianceActivationQuerySchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/appliance-activations
 * List appliance activations with filtering
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query params
    const queryResult = applianceActivationQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

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

    const query = queryResult.data;

    // Build filter
    const where: Record<string, unknown> = {
      clinicId: session.user.clinicId,
    };

    if (query.applianceRecordId) {
      where.applianceRecordId = query.applianceRecordId;
    }

    if (query.activationType) {
      where.activationType = query.activationType;
    }

    if (query.isPatientReported !== undefined) {
      where.isPatientReported = query.isPatientReported;
    }

    if (query.fromDate || query.toDate) {
      where.activationDate = {};
      if (query.fromDate) {
        (where.activationDate as Record<string, Date>).gte = query.fromDate;
      }
      if (query.toDate) {
        (where.activationDate as Record<string, Date>).lte = query.toDate;
      }
    }

    // Get total count
    const total = await db.applianceActivation.count({ where });

    // Get activations
    const activations = await db.applianceActivation.findMany({
      where,
      include: {
        applianceRecord: {
          select: {
            id: true,
            applianceType: true,
            arch: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: activations,
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
      },
    });
  },
  { permissions: ['treatment:read'] }
);

/**
 * POST /api/appliance-activations
 * Create a new appliance activation
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createApplianceActivationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid activation data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Get staff profile for performedBy
    const staffProfile = await db.staffProfile.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STAFF_NOT_FOUND',
            message: 'Staff profile not found for current user',
          },
        },
        { status: 400 }
      );
    }

    // Verify appliance record exists and belongs to clinic
    const applianceRecord = await db.applianceRecord.findFirst({
      where: {
        id: data.applianceRecordId,
        clinicId: session.user.clinicId,
      },
    });

    if (!applianceRecord) {
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

    // Create activation
    const activation = await db.applianceActivation.create({
      data: {
        clinicId: session.user.clinicId,
        applianceRecordId: data.applianceRecordId,
        activationDate: data.activationDate,
        activationType: data.activationType,
        turns: data.turns ?? null,
        millimeters: data.millimeters ?? null,
        instructions: data.instructions ?? null,
        nextActivationDate: data.nextActivationDate ?? null,
        isPatientReported: data.isPatientReported,
        reportedWearHours: data.reportedWearHours ?? null,
        notes: data.notes ?? null,
        performedById: staffProfile.id,
      },
      include: {
        applianceRecord: {
          select: {
            id: true,
            applianceType: true,
            arch: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ApplianceActivation',
      entityId: activation.id,
      details: {
        applianceRecordId: data.applianceRecordId,
        activationType: data.activationType,
        turns: data.turns,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: activation,
    });
  },
  { permissions: ['treatment:create'] }
);
