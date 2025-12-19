import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createElasticPrescriptionSchema,
  elasticPrescriptionQuerySchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/elastic-prescriptions
 * List elastic prescriptions with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query params
    const queryResult = elasticPrescriptionQuerySchema.safeParse(
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

    if (query.patientId) {
      where.patientId = query.patientId;
    }

    if (query.treatmentPlanId) {
      where.treatmentPlanId = query.treatmentPlanId;
    }

    if (query.applianceRecordId) {
      where.applianceRecordId = query.applianceRecordId;
    }

    if (query.elasticType) {
      where.elasticType = query.elasticType;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    // Get total count
    const total = await db.elasticPrescription.count({ where });

    // Get prescriptions
    const prescriptions = await db.elasticPrescription.findMany({
      where,
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
          },
        },
        prescribedBy: {
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
        items: prescriptions,
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
 * POST /api/elastic-prescriptions
 * Create a new elastic prescription
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createElasticPrescriptionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid prescription data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Get staff profile for prescribedBy
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

    // Verify patient belongs to clinic
    const patient = await db.patient.findFirst({
      where: {
        id: data.patientId,
        ...getClinicFilter(session),
      },
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

    // Create prescription
    const prescription = await db.elasticPrescription.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        treatmentPlanId: data.treatmentPlanId || null,
        applianceRecordId: data.applianceRecordId || null,
        elasticType: data.elasticType,
        elasticSize: data.elasticSize,
        elasticForce: data.elasticForce || null,
        manufacturer: data.manufacturer || null,
        fromTooth: data.fromTooth,
        toTooth: data.toTooth,
        configuration: data.configuration || null,
        wearSchedule: data.wearSchedule,
        hoursPerDay: data.hoursPerDay,
        startDate: data.startDate || new Date(),
        endDate: data.endDate || null,
        complianceNotes: data.complianceNotes || null,
        prescribedById: staffProfile.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        prescribedBy: {
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
      entity: 'ElasticPrescription',
      entityId: prescription.id,
      details: {
        patientId: data.patientId,
        elasticType: data.elasticType,
        elasticSize: data.elasticSize,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: prescription,
    });
  },
  { permissions: ['treatment:create'] }
);
