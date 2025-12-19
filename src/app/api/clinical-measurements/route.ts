import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createClinicalMeasurementSchema,
  measurementQuerySchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/clinical-measurements
 * List clinical measurements with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      patientId: searchParams.get('patientId') ?? undefined,
      measurementType: searchParams.get('measurementType') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = measurementQuerySchema.safeParse(rawParams);

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
      patientId,
      measurementType,
      fromDate,
      toDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause (no soft delete on this model)
    const where: Record<string, unknown> = getClinicFilter(session);

    if (patientId) where.patientId = patientId;
    if (measurementType) where.measurementType = measurementType;

    if (fromDate) {
      where.measurementDate = { ...((where.measurementDate as object) || {}), gte: fromDate };
    }
    if (toDate) {
      where.measurementDate = { ...((where.measurementDate as object) || {}), lte: toDate };
    }

    const total = await db.clinicalMeasurement.count({ where });

    const items = await db.clinicalMeasurement.findMany({
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
        recordedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        progressNote: {
          select: {
            id: true,
            noteDate: true,
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
 * POST /api/clinical-measurements
 * Create a new clinical measurement
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createClinicalMeasurementSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid measurement data',
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

    // Verify recorder exists
    const recorder = await db.staffProfile.findFirst({
      where: withSoftDelete({
        id: data.recordedById,
      }),
    });

    if (!recorder) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RECORDER_NOT_FOUND',
            message: 'Recorder not found',
          },
        },
        { status: 404 }
      );
    }

    // Create the measurement
    const measurement = await db.clinicalMeasurement.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        progressNoteId: data.progressNoteId,
        measurementDate: data.measurementDate ?? new Date(),
        measurementType: data.measurementType,
        value: data.value,
        unit: data.unit,
        method: data.method,
        recordedById: data.recordedById,
        notes: data.notes,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        recordedBy: {
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
      entity: 'ClinicalMeasurement',
      entityId: measurement.id,
      details: {
        patientId: measurement.patientId,
        measurementType: measurement.measurementType,
        value: measurement.value,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: measurement }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
