import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

// Point schema for coordinates
const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// Validation schema for updating measurements
const updateMeasurementSchema = z.object({
  points: z.array(pointSchema).min(2).optional(),
  value: z.number().optional(),
  unit: z.string().optional(),
  label: z.string().optional(),
  calibration: z.number().optional(),
});

/**
 * GET /api/images/[id]/measurements/[measurementId]
 * Get a single measurement
 */
export const GET = withAuth<{ id: string; measurementId: string }>(
  async (req, session, context) => {
    const { id: imageId, measurementId } = await context.params;

    // Verify image exists and user has access
    const image = await db.patientImage.findFirst({
      where: withSoftDelete({
        id: imageId,
        ...getClinicFilter(session),
      }),
    });

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Image not found',
          },
        },
        { status: 404 }
      );
    }

    const measurement = await db.imageMeasurement.findFirst({
      where: {
        id: measurementId,
        imageId,
        clinicId: session.user.clinicId,
      },
      include: {
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!measurement) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Measurement not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: measurement,
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * PUT /api/images/[id]/measurements/[measurementId]
 * Update a measurement
 */
export const PUT = withAuth<{ id: string; measurementId: string }>(
  async (req, session, context) => {
    const { id: imageId, measurementId } = await context.params;
    const body = await req.json();

    // Verify image exists and user has access
    const image = await db.patientImage.findFirst({
      where: withSoftDelete({
        id: imageId,
        ...getClinicFilter(session),
      }),
    });

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Image not found',
          },
        },
        { status: 404 }
      );
    }

    const existingMeasurement = await db.imageMeasurement.findFirst({
      where: {
        id: measurementId,
        imageId,
        clinicId: session.user.clinicId,
      },
    });

    if (!existingMeasurement) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Measurement not found',
          },
        },
        { status: 404 }
      );
    }

    const result = updateMeasurementSchema.safeParse(body);

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

    const updateData: Record<string, unknown> = {};
    if (result.data.points !== undefined)
      updateData.points = result.data.points as Prisma.InputJsonValue;
    if (result.data.value !== undefined) updateData.value = result.data.value;
    if (result.data.unit !== undefined) updateData.unit = result.data.unit;
    if (result.data.label !== undefined) updateData.label = result.data.label;
    if (result.data.calibration !== undefined)
      updateData.calibration = result.data.calibration;

    const measurement = await db.imageMeasurement.update({
      where: { id: measurementId },
      data: updateData,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ImageMeasurement',
      entityId: measurementId,
      details: {
        imageId,
        patientId: image.patientId,
        updates: Object.keys(updateData),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: measurement,
    });
  },
  { permissions: ['imaging:annotate'] }
);

/**
 * DELETE /api/images/[id]/measurements/[measurementId]
 * Delete a single measurement
 */
export const DELETE = withAuth<{ id: string; measurementId: string }>(
  async (req, session, context) => {
    const { id: imageId, measurementId } = await context.params;

    // Verify image exists and user has access
    const image = await db.patientImage.findFirst({
      where: withSoftDelete({
        id: imageId,
        ...getClinicFilter(session),
      }),
    });

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Image not found',
          },
        },
        { status: 404 }
      );
    }

    const measurement = await db.imageMeasurement.findFirst({
      where: {
        id: measurementId,
        imageId,
        clinicId: session.user.clinicId,
      },
    });

    if (!measurement) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Measurement not found',
          },
        },
        { status: 404 }
      );
    }

    await db.imageMeasurement.delete({
      where: { id: measurementId },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ImageMeasurement',
      entityId: measurementId,
      details: {
        imageId,
        patientId: image.patientId,
        type: measurement.type,
        value: measurement.value,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['imaging:annotate'] }
);
