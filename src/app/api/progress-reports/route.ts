import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

// Section schema
const sectionSchema = z.object({
  id: z.string(),
  type: z.enum([
    'HEADER',
    'SUMMARY',
    'IMAGES',
    'COLLAGE',
    'COMPARISON',
    'MEASUREMENTS',
    'NOTES',
    'TIMELINE',
  ]),
  title: z.string().optional(),
  content: z.string().optional(),
  imageIds: z.array(z.string()).optional(),
  collageId: z.string().optional(),
  beforeImageId: z.string().optional(),
  afterImageId: z.string().optional(),
  measurementIds: z.array(z.string()).optional(),
  layout: z.enum(['full', 'half', 'third', 'quarter']).optional(),
  order: z.number(),
});

// Validation schema for creating reports
const createReportSchema = z.object({
  patientId: z.string(),
  title: z.string().min(1, 'Title is required'),
  reportType: z.enum(['INITIAL', 'PROGRESS', 'FINAL', 'COMPARISON']),
  reportDate: z.string().optional(),
  sections: z.array(sectionSchema),
  summary: z.string().optional(),
  notes: z.string().optional(),
  treatmentPlanId: z.string().optional(),
  appointmentId: z.string().optional(),
  visibleToPatient: z.boolean().optional(),
});

/**
 * GET /api/progress-reports
 * List progress reports with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const reportType = searchParams.get('reportType');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where: Prisma.ProgressReportWhereInput = {
      clinicId: session.user.clinicId,
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (reportType) {
      where.reportType = reportType;
    }

    const [reports, total] = await Promise.all([
      db.progressReport.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.progressReport.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: reports,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * POST /api/progress-reports
 * Create a new progress report
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const result = createReportSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid report data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify patient exists and belongs to clinic
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        id: result.data.patientId,
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

    // Get staff profile
    const staffProfile = await db.staffProfile.findFirst({
      where: {
        userId: session.user.id,
        ...getClinicFilter(session),
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

    // Create the report
    const report = await db.progressReport.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: result.data.patientId,
        title: result.data.title,
        reportType: result.data.reportType,
        reportDate: result.data.reportDate
          ? new Date(result.data.reportDate)
          : new Date(),
        sections: result.data.sections as Prisma.InputJsonValue,
        summary: result.data.summary,
        notes: result.data.notes,
        treatmentPlanId: result.data.treatmentPlanId,
        appointmentId: result.data.appointmentId,
        visibleToPatient: result.data.visibleToPatient || false,
        createdById: staffProfile.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
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
      entity: 'ProgressReport',
      entityId: report.id,
      details: {
        patientId: result.data.patientId,
        reportType: result.data.reportType,
        title: result.data.title,
        sectionsCount: result.data.sections.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: report,
    });
  },
  { permissions: ['imaging:manage'] }
);
