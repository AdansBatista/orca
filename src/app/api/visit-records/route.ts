import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createVisitRecordSchema,
  visitRecordQuerySchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/visit-records
 * List visit records with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      patientId: searchParams.get('patientId') ?? undefined,
      appointmentId: searchParams.get('appointmentId') ?? undefined,
      treatmentPlanId: searchParams.get('treatmentPlanId') ?? undefined,
      primaryProviderId: searchParams.get('primaryProviderId') ?? undefined,
      visitType: searchParams.get('visitType') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      incompleteOnly: searchParams.get('incompleteOnly') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = visitRecordQuerySchema.safeParse(rawParams);

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

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete(getClinicFilter(session));

    if (query.patientId) where.patientId = query.patientId;
    if (query.appointmentId) where.appointmentId = query.appointmentId;
    if (query.treatmentPlanId) where.treatmentPlanId = query.treatmentPlanId;
    if (query.primaryProviderId) where.primaryProviderId = query.primaryProviderId;
    if (query.visitType) where.visitType = query.visitType;
    if (query.status) where.status = query.status;

    if (query.incompleteOnly) {
      where.status = { in: ['IN_PROGRESS', 'INCOMPLETE'] };
    }

    if (query.fromDate || query.toDate) {
      where.visitDate = {};
      if (query.fromDate) {
        (where.visitDate as Record<string, Date>).gte = query.fromDate;
      }
      if (query.toDate) {
        (where.visitDate as Record<string, Date>).lte = query.toDate;
      }
    }

    const total = await db.visitRecord.count({ where });

    const items = await db.visitRecord.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
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
        completedBy: {
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
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
      },
    });
  },
  { permissions: ['treatment:read'] }
);

/**
 * POST /api/visit-records
 * Create a new visit record
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createVisitRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid visit record data',
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

    // Verify primary provider exists
    const provider = await db.staffProfile.findFirst({
      where: withSoftDelete({
        id: data.primaryProviderId,
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

    // Check if appointment already has a visit record
    if (data.appointmentId) {
      const existingVisit = await db.visitRecord.findFirst({
        where: withSoftDelete({
          appointmentId: data.appointmentId,
          ...getClinicFilter(session),
        }),
      });

      if (existingVisit) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VISIT_EXISTS',
              message: 'A visit record already exists for this appointment',
            },
          },
          { status: 400 }
        );
      }
    }

    // Create the visit record
    const visitRecord = await db.visitRecord.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        appointmentId: data.appointmentId,
        treatmentPlanId: data.treatmentPlanId,
        visitDate: data.visitDate ?? new Date(),
        visitType: data.visitType,
        primaryProviderId: data.primaryProviderId,
        assistingStaffIds: data.assistingStaffIds,
        chiefComplaint: data.chiefComplaint,
        status: 'IN_PROGRESS',
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
            title: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'VisitRecord',
      entityId: visitRecord.id,
      details: {
        patientId: visitRecord.patientId,
        visitType: visitRecord.visitType,
        appointmentId: visitRecord.appointmentId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: visitRecord }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
