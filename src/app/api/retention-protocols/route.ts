import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createRetentionProtocolSchema,
  retentionProtocolQuerySchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/retention-protocols
 * List retention protocols with filtering and pagination
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse and validate query parameters
    const rawParams = {
      treatmentPlanId: searchParams.get('treatmentPlanId') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      currentPhase: searchParams.get('currentPhase') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      checksDue: searchParams.get('checksDue') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = retentionProtocolQuerySchema.safeParse(rawParams);

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
      treatmentPlanId,
      patientId,
      currentPhase,
      isActive,
      checksDue,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with clinic filter
    const where: Record<string, unknown> = getClinicFilter(session);

    // Apply filters
    if (treatmentPlanId) where.treatmentPlanId = treatmentPlanId;
    if (patientId) where.patientId = patientId;
    if (currentPhase) where.currentPhase = currentPhase;
    if (isActive !== undefined) where.isActive = isActive;

    // Filter for checks due (next check date is in the past or within next 7 days)
    if (checksDue) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      where.nextCheckDate = { lte: nextWeek };
      where.isActive = true;
    }

    // Get total count
    const total = await db.retentionProtocol.count({ where });

    // Get paginated results
    const items = await db.retentionProtocol.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            planNumber: true,
            status: true,
          },
        },
        managingProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        _count: {
          select: {
            retentionChecks: true,
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
 * POST /api/retention-protocols
 * Create a new retention protocol
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createRetentionProtocolSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid retention protocol data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify patient exists and belongs to clinic
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        id: data.patientId,
        ...getClinicFilter(session),
      }),
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: 'Patient not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify treatment plan exists and belongs to patient
    const treatmentPlan = await db.treatmentPlan.findFirst({
      where: withSoftDelete({
        id: data.treatmentPlanId,
        patientId: data.patientId,
        ...getClinicFilter(session),
      }),
    });

    if (!treatmentPlan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TREATMENT_PLAN_NOT_FOUND',
            message: 'Treatment plan not found or does not belong to this patient',
          },
        },
        { status: 404 }
      );
    }

    // Check if an active retention protocol already exists for this treatment plan
    const existingProtocol = await db.retentionProtocol.findFirst({
      where: {
        treatmentPlanId: data.treatmentPlanId,
        isActive: true,
        ...getClinicFilter(session),
      },
    });

    if (existingProtocol) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROTOCOL_EXISTS',
            message: 'An active retention protocol already exists for this treatment plan',
          },
        },
        { status: 400 }
      );
    }

    // Get staff profile for managingProvider
    const staffProfile = await db.staffProfile.findFirst({
      where: { userId: session.user.id },
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

    // Calculate next check date if not provided
    const nextCheckDate = data.nextCheckDate || new Date(Date.now() + data.checkIntervalMonths * 30 * 24 * 60 * 60 * 1000);

    // Create the retention protocol
    const retentionProtocol = await db.retentionProtocol.create({
      data: {
        clinicId: session.user.clinicId,
        treatmentPlanId: data.treatmentPlanId,
        patientId: data.patientId,
        debondDate: data.debondDate,
        currentPhase: data.currentPhase,
        wearSchedule: data.wearSchedule,
        wearHoursPerDay: data.wearHoursPerDay,
        wearInstructions: data.wearInstructions,
        upperRetainerType: data.upperRetainerType,
        lowerRetainerType: data.lowerRetainerType,
        upperRetainerId: data.upperRetainerId,
        lowerRetainerId: data.lowerRetainerId,
        complianceStatus: data.complianceStatus,
        checkIntervalMonths: data.checkIntervalMonths,
        nextCheckDate,
        stabilityStatus: data.stabilityStatus,
        stabilityNotes: data.stabilityNotes,
        currentNotes: data.currentNotes,
        managingProviderId: staffProfile.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            planNumber: true,
            status: true,
          },
        },
        managingProvider: {
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
      entity: 'RetentionProtocol',
      entityId: retentionProtocol.id,
      details: {
        patientId: retentionProtocol.patientId,
        treatmentPlanId: retentionProtocol.treatmentPlanId,
        currentPhase: retentionProtocol.currentPhase,
        wearSchedule: retentionProtocol.wearSchedule,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: retentionProtocol }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
