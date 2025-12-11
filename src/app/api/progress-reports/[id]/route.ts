import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
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

// Validation schema for updating reports
const updateReportSchema = z.object({
  title: z.string().min(1).optional(),
  reportType: z.enum(['INITIAL', 'PROGRESS', 'FINAL', 'COMPARISON']).optional(),
  reportDate: z.string().optional(),
  sections: z.array(sectionSchema).optional(),
  summary: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  treatmentPlanId: z.string().optional().nullable(),
  appointmentId: z.string().optional().nullable(),
  visibleToPatient: z.boolean().optional(),
});

/**
 * GET /api/progress-reports/[id]
 * Get a single progress report
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const report = await db.progressReport.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
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
        treatmentPlan: {
          select: {
            id: true,
            planName: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Progress report not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: report,
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * PUT /api/progress-reports/[id]
 * Update a progress report
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Verify report exists
    const existingReport = await db.progressReport.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    });

    if (!existingReport) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Progress report not found',
          },
        },
        { status: 404 }
      );
    }

    const result = updateReportSchema.safeParse(body);

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

    const updateData: Prisma.ProgressReportUpdateInput = {};

    if (result.data.title !== undefined) updateData.title = result.data.title;
    if (result.data.reportType !== undefined)
      updateData.reportType = result.data.reportType;
    if (result.data.reportDate !== undefined)
      updateData.reportDate = new Date(result.data.reportDate);
    if (result.data.sections !== undefined)
      updateData.sections = result.data.sections as Prisma.InputJsonValue;
    if (result.data.summary !== undefined)
      updateData.summary = result.data.summary;
    if (result.data.notes !== undefined) updateData.notes = result.data.notes;
    if (result.data.treatmentPlanId !== undefined) {
      if (result.data.treatmentPlanId === null) {
        updateData.treatmentPlan = { disconnect: true };
      } else {
        updateData.treatmentPlan = { connect: { id: result.data.treatmentPlanId } };
      }
    }
    if (result.data.appointmentId !== undefined) {
      if (result.data.appointmentId === null) {
        updateData.appointment = { disconnect: true };
      } else {
        updateData.appointment = { connect: { id: result.data.appointmentId } };
      }
    }
    if (result.data.visibleToPatient !== undefined)
      updateData.visibleToPatient = result.data.visibleToPatient;

    const report = await db.progressReport.update({
      where: { id },
      data: updateData,
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
      action: 'UPDATE',
      entity: 'ProgressReport',
      entityId: id,
      details: {
        patientId: existingReport.patientId,
        updates: Object.keys(result.data),
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

/**
 * DELETE /api/progress-reports/[id]
 * Delete a progress report
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Verify report exists
    const report = await db.progressReport.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    });

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Progress report not found',
          },
        },
        { status: 404 }
      );
    }

    await db.progressReport.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ProgressReport',
      entityId: id,
      details: {
        patientId: report.patientId,
        title: report.title,
        reportType: report.reportType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['imaging:manage'] }
);
