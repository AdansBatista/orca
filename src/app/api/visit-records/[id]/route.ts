import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateVisitRecordSchema } from '@/lib/validations/treatment';

/**
 * GET /api/visit-records/[id]
 * Get a single visit record with all related documentation
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const visitRecord = await db.visitRecord.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
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
            title: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            planNumber: true,
            planName: true,
            status: true,
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

    if (!visitRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Visit record not found',
          },
        },
        { status: 404 }
      );
    }

    // Fetch linked documentation
    const [progressNote, procedures, findings, measurements] = await Promise.all([
      visitRecord.progressNoteId
        ? db.progressNote.findFirst({
            where: { id: visitRecord.progressNoteId },
            select: {
              id: true,
              noteDate: true,
              noteType: true,
              status: true,
              subjective: true,
              objective: true,
              assessment: true,
              plan: true,
            },
          })
        : null,
      visitRecord.procedureIds.length > 0
        ? db.procedureRecord.findMany({
            where: { id: { in: visitRecord.procedureIds } },
            include: {
              performedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          })
        : [],
      visitRecord.findingIds.length > 0
        ? db.clinicalFinding.findMany({
            where: { id: { in: visitRecord.findingIds } },
          })
        : [],
      visitRecord.measurementIds.length > 0
        ? db.clinicalMeasurement.findMany({
            where: { id: { in: visitRecord.measurementIds } },
            include: {
              recordedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          })
        : [],
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...visitRecord,
        progressNote,
        procedures,
        findings,
        measurements,
      },
    });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/visit-records/[id]
 * Update a visit record
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateVisitRecordSchema.safeParse(body);
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

    // Verify visit record exists
    const existingRecord = await db.visitRecord.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existingRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Visit record not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot update completed or cancelled visits
    if (existingRecord.status === 'COMPLETE' || existingRecord.status === 'CANCELLED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VISIT_LOCKED',
            message: `Cannot update a ${existingRecord.status.toLowerCase()} visit record`,
          },
        },
        { status: 400 }
      );
    }

    // Update visit record
    const visitRecord = await db.visitRecord.update({
      where: { id },
      data: {
        ...data,
        updatedBy: session.user.id,
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
      action: 'UPDATE',
      entity: 'VisitRecord',
      entityId: visitRecord.id,
      details: {
        patientId: visitRecord.patientId,
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: visitRecord });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/visit-records/[id]
 * Soft delete a visit record (only if in progress)
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const existingRecord = await db.visitRecord.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existingRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Visit record not found',
          },
        },
        { status: 404 }
      );
    }

    // Can only delete in-progress visits
    if (existingRecord.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VISIT_LOCKED',
            message: 'Can only delete in-progress visit records',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete
    await db.visitRecord.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'VisitRecord',
      entityId: id,
      details: {
        patientId: existingRecord.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['treatment:delete'] }
);
