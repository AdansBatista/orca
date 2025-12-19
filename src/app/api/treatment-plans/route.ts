import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createTreatmentPlanSchema,
  treatmentPlanQuerySchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/treatment-plans
 * List treatment plans with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse and validate query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      primaryProviderId: searchParams.get('primaryProviderId') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = treatmentPlanQuerySchema.safeParse(rawParams);

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
      patientId,
      status,
      primaryProviderId,
      fromDate,
      toDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with clinic filter
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    // Apply filters
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (primaryProviderId) where.primaryProviderId = primaryProviderId;

    if (search) {
      where.OR = [
        { planName: { contains: search, mode: 'insensitive' } },
        { planNumber: { contains: search, mode: 'insensitive' } },
        { chiefComplaint: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (fromDate) {
      where.createdAt = { ...((where.createdAt as object) || {}), gte: fromDate };
    }
    if (toDate) {
      where.createdAt = { ...((where.createdAt as object) || {}), lte: toDate };
    }

    // Get total count
    const total = await db.treatmentPlan.count({ where });

    // Get paginated results
    const items = await db.treatmentPlan.findMany({
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
            dateOfBirth: true,
          },
        },
        primaryProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        phases: {
          select: {
            id: true,
            phaseName: true,
            status: true,
            progressPercent: true,
          },
          orderBy: { phaseNumber: 'asc' },
        },
        _count: {
          select: {
            milestones: true,
            progressNotes: true,
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
 * POST /api/treatment-plans
 * Create a new treatment plan
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createTreatmentPlanSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid treatment plan data',
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

    // Verify primary provider exists if provided
    if (data.primaryProviderId) {
      const provider = await db.staffProfile.findFirst({
        where: withSoftDelete({
          id: data.primaryProviderId,
          isProvider: true,
        }),
      });

      if (!provider) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PROVIDER_NOT_FOUND',
              message: 'Primary provider not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Generate plan number
    const year = new Date().getFullYear();
    const lastPlan = await db.treatmentPlan.findFirst({
      where: {
        clinicId: session.user.clinicId,
        planNumber: { startsWith: `TP-${year}-` },
      },
      orderBy: { planNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastPlan?.planNumber) {
      const match = lastPlan.planNumber.match(/TP-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    const planNumber = `TP-${year}-${String(nextNumber).padStart(4, '0')}`;

    // Create the treatment plan
    const treatmentPlan = await db.treatmentPlan.create({
      data: {
        clinicId: session.user.clinicId,
        planNumber,
        planName: data.planName,
        planType: data.planType,
        status: data.status,
        patientId: data.patientId,
        chiefComplaint: data.chiefComplaint,
        diagnosis: data.diagnosis,
        treatmentGoals: data.treatmentGoals,
        treatmentDescription: data.treatmentDescription,
        primaryProviderId: data.primaryProviderId,
        supervisingProviderId: data.supervisingProviderId,
        estimatedDuration: data.estimatedDuration,
        estimatedVisits: data.estimatedVisits,
        totalFee: data.totalFee,
        startDate: data.startDate,
        estimatedEndDate: data.estimatedEndDate,
        createdBy: session.user.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        primaryProvider: {
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
      entity: 'TreatmentPlan',
      entityId: treatmentPlan.id,
      details: {
        planNumber: treatmentPlan.planNumber,
        planName: treatmentPlan.planName,
        patientId: treatmentPlan.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: treatmentPlan }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
