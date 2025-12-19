import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateClinicalMeasurementSchema } from '@/lib/validations/treatment';

/**
 * GET /api/clinical-measurements/[id]
 * Get a single clinical measurement
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const measurement = await db.clinicalMeasurement.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
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
            title: true,
          },
        },
        progressNote: {
          select: {
            id: true,
            noteDate: true,
            noteType: true,
          },
        },
      },
    });

    if (!measurement) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEASUREMENT_NOT_FOUND',
            message: 'Clinical measurement not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: measurement });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/clinical-measurements/[id]
 * Update a clinical measurement
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateClinicalMeasurementSchema.safeParse(body);
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

    // Verify measurement exists
    const existingMeasurement = await db.clinicalMeasurement.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingMeasurement) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEASUREMENT_NOT_FOUND',
            message: 'Clinical measurement not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Update measurement
    const measurement = await db.clinicalMeasurement.update({
      where: { id },
      data,
      include: {
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
      action: 'UPDATE',
      entity: 'ClinicalMeasurement',
      entityId: id,
      details: {
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: measurement });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/clinical-measurements/[id]
 * Delete a clinical measurement
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Verify measurement exists
    const existingMeasurement = await db.clinicalMeasurement.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingMeasurement) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MEASUREMENT_NOT_FOUND',
            message: 'Clinical measurement not found',
          },
        },
        { status: 404 }
      );
    }

    // Hard delete (no soft delete field on this model)
    await db.clinicalMeasurement.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ClinicalMeasurement',
      entityId: id,
      details: {
        measurementType: existingMeasurement.measurementType,
        patientId: existingMeasurement.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['treatment:delete'] }
);
