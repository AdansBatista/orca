import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
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

// Validation schema for creating measurements
const createMeasurementSchema = z.object({
  type: z.enum(['LINEAR', 'ANGLE', 'AREA', 'PERIMETER']),
  points: z.array(pointSchema).min(2),
  value: z.number(),
  unit: z.string(),
  label: z.string().optional(),
  calibration: z.number().optional(),
});

const bulkCreateMeasurementsSchema = z.object({
  measurements: z.array(createMeasurementSchema),
  clearExisting: z.boolean().optional(),
});

/**
 * GET /api/images/[id]/measurements
 * Get all measurements for an image
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: imageId } = await context.params;

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

    const measurements = await db.imageMeasurement.findMany({
      where: {
        imageId,
        clinicId: session.user.clinicId,
      },
      orderBy: { createdAt: 'asc' },
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

    return NextResponse.json({
      success: true,
      data: measurements,
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * POST /api/images/[id]/measurements
 * Create measurement(s) for an image
 * Supports single measurement or bulk creation
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: imageId } = await context.params;
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

    // Get staff profile for the current user
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

    // Check if bulk create
    if (body.measurements) {
      const bulkResult = bulkCreateMeasurementsSchema.safeParse(body);

      if (!bulkResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid measurement data',
              details: bulkResult.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      // Clear existing measurements if requested
      if (bulkResult.data.clearExisting) {
        await db.imageMeasurement.deleteMany({
          where: {
            imageId,
            clinicId: session.user.clinicId,
          },
        });
      }

      // Create all measurements
      const measurements = await Promise.all(
        bulkResult.data.measurements.map((measurement) =>
          db.imageMeasurement.create({
            data: {
              clinicId: session.user.clinicId,
              imageId,
              type: measurement.type,
              points: measurement.points as Prisma.InputJsonValue,
              value: measurement.value,
              unit: measurement.unit,
              label: measurement.label,
              calibration: measurement.calibration,
              createdById: staffProfile.id,
            },
          })
        )
      );

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'CREATE',
        entity: 'ImageMeasurement',
        entityId: imageId,
        details: {
          patientId: image.patientId,
          count: measurements.length,
          clearExisting: bulkResult.data.clearExisting || false,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        data: measurements,
      });
    }

    // Single measurement create
    const result = createMeasurementSchema.safeParse(body);

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

    const measurement = await db.imageMeasurement.create({
      data: {
        clinicId: session.user.clinicId,
        imageId,
        type: result.data.type,
        points: result.data.points as Prisma.InputJsonValue,
        value: result.data.value,
        unit: result.data.unit,
        label: result.data.label,
        calibration: result.data.calibration,
        createdById: staffProfile.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ImageMeasurement',
      entityId: measurement.id,
      details: {
        imageId,
        patientId: image.patientId,
        type: result.data.type,
        value: result.data.value,
        unit: result.data.unit,
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
 * DELETE /api/images/[id]/measurements
 * Delete all measurements for an image
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: imageId } = await context.params;

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

    const deleteResult = await db.imageMeasurement.deleteMany({
      where: {
        imageId,
        clinicId: session.user.clinicId,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ImageMeasurement',
      entityId: imageId,
      details: {
        patientId: image.patientId,
        count: deleteResult.count,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: deleteResult.count },
    });
  },
  { permissions: ['imaging:annotate'] }
);
