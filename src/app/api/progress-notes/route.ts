import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createProgressNoteSchema,
  progressNoteQuerySchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/progress-notes
 * List progress notes with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse and validate query parameters
    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      treatmentPlanId: searchParams.get('treatmentPlanId') ?? undefined,
      providerId: searchParams.get('providerId') ?? undefined,
      noteType: searchParams.get('noteType') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = progressNoteQuerySchema.safeParse(rawParams);

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
      treatmentPlanId,
      providerId,
      noteType,
      status,
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
    if (treatmentPlanId) where.treatmentPlanId = treatmentPlanId;
    if (providerId) where.providerId = providerId;
    if (noteType) where.noteType = noteType;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { chiefComplaint: { contains: search, mode: 'insensitive' } },
        { subjective: { contains: search, mode: 'insensitive' } },
        { objective: { contains: search, mode: 'insensitive' } },
        { assessment: { contains: search, mode: 'insensitive' } },
        { plan: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (fromDate) {
      where.noteDate = { ...((where.noteDate as object) || {}), gte: fromDate };
    }
    if (toDate) {
      where.noteDate = { ...((where.noteDate as object) || {}), lte: toDate };
    }

    // Get total count
    const total = await db.progressNote.count({ where });

    // Get paginated results
    const items = await db.progressNote.findMany({
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
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            planNumber: true,
            planName: true,
          },
        },
        _count: {
          select: {
            procedures: true,
            findings: true,
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
 * POST /api/progress-notes
 * Create a new progress note
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createProgressNoteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid progress note data',
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

    // Verify provider exists
    const provider = await db.staffProfile.findFirst({
      where: withSoftDelete({
        id: data.providerId,
        isProvider: true,
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

    // Verify treatment plan if provided
    if (data.treatmentPlanId) {
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
    }

    // Create the progress note
    const progressNote = await db.progressNote.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        treatmentPlanId: data.treatmentPlanId,
        appointmentId: data.appointmentId,
        noteDate: data.noteDate ?? new Date(),
        noteType: data.noteType,
        chiefComplaint: data.chiefComplaint,
        subjective: data.subjective,
        objective: data.objective,
        assessment: data.assessment,
        plan: data.plan,
        proceduresSummary: data.proceduresSummary,
        providerId: data.providerId,
        supervisingProviderId: data.supervisingProviderId,
        status: data.status,
        imageIds: data.imageIds,
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
        provider: {
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
      entity: 'ProgressNote',
      entityId: progressNote.id,
      details: {
        patientId: progressNote.patientId,
        noteType: progressNote.noteType,
        treatmentPlanId: progressNote.treatmentPlanId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: progressNote }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
