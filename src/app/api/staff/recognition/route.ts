import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete } from '@/lib/db/soft-delete';
import {
  createRecognitionSchema,
  recognitionQuerySchema,
} from '@/lib/validations/performance';

/**
 * GET /api/staff/recognition
 * List recognitions with filtering
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);
    const clinicFilter = getClinicFilter(session);

    // Parse query parameters
    const rawParams = {
      staffProfileId: searchParams.get('staffProfileId') ?? undefined,
      type: searchParams.get('type') ?? undefined,
      isPublic: searchParams.get('isPublic') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = recognitionQuerySchema.safeParse(rawParams);

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

    const { staffProfileId, type, isPublic, startDate, endDate, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...clinicFilter,
    };

    if (staffProfileId) {
      where.staffProfileId = staffProfileId;
    }

    if (type) {
      where.type = type;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    if (startDate || endDate) {
      where.recognitionDate = {};
      if (startDate) {
        (where.recognitionDate as Record<string, Date>).gte = startDate;
      }
      if (endDate) {
        (where.recognitionDate as Record<string, Date>).lte = endDate;
      }
    }

    // Get total count
    const total = await db.recognition.count({ where });

    // Get paginated results
    const items = await db.recognition.findMany({
      where,
      orderBy: { recognitionDate: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        staffProfile: {
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
  { permissions: ['staff:read', 'staff:write', 'staff:admin'] }
);

/**
 * POST /api/staff/recognition
 * Create a new recognition
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);

    // Validate input
    const result = createRecognitionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid recognition data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify staff profile exists and belongs to clinic
    const staffProfile = await db.staffProfile.findFirst({
      where: withSoftDelete({
        id: data.staffProfileId,
        ...clinicFilter,
      }),
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Staff profile not found',
          },
        },
        { status: 404 }
      );
    }

    // Create the recognition
    const recognition = await db.recognition.create({
      data: {
        staffProfileId: data.staffProfileId,
        type: data.type,
        title: data.title,
        description: data.description,
        isAnonymous: data.isAnonymous,
        givenById: data.isAnonymous ? null : session.user.id,
        givenByName: data.isAnonymous ? null : `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || null,
        awardValue: data.awardValue,
        awardDescription: data.awardDescription,
        recognitionDate: data.recognitionDate ?? new Date(),
        isPublic: data.isPublic,
        clinicId: session.user.clinicId,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Recognition',
      entityId: recognition.id,
      details: {
        staffProfileId: data.staffProfileId,
        type: data.type,
        title: data.title,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: recognition }, { status: 201 });
  },
  { permissions: ['staff:read', 'staff:write', 'staff:admin'] } // Allow all staff to give recognition
);
