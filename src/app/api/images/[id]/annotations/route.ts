import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

// Validation schema for creating annotations
const createAnnotationSchema = z.object({
  type: z.enum([
    'FREEHAND',
    'LINE',
    'ARROW',
    'CIRCLE',
    'RECTANGLE',
    'TEXT',
    'POLYGON',
  ]),
  geometry: z.record(z.string(), z.unknown()),
  style: z.object({
    strokeColor: z.string(),
    strokeWidth: z.number(),
    fillColor: z.string(),
    fillOpacity: z.number(),
  }).optional(),
  text: z.string().optional(),
  label: z.string().optional(),
});

const bulkCreateAnnotationsSchema = z.object({
  annotations: z.array(createAnnotationSchema),
  clearExisting: z.boolean().optional(),
});

/**
 * GET /api/images/[id]/annotations
 * Get all annotations for an image
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

    const annotations = await db.imageAnnotation.findMany({
      where: { imageId },
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
      data: annotations,
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * POST /api/images/[id]/annotations
 * Create annotation(s) for an image
 * Supports single annotation or bulk creation
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
    if (body.annotations) {
      const bulkResult = bulkCreateAnnotationsSchema.safeParse(body);

      if (!bulkResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid annotation data',
              details: bulkResult.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      // Clear existing annotations if requested
      if (bulkResult.data.clearExisting) {
        await db.imageAnnotation.deleteMany({
          where: { imageId },
        });
      }

      // Create all annotations
      const annotations = await Promise.all(
        bulkResult.data.annotations.map((annotation) =>
          db.imageAnnotation.create({
            data: {
              imageId,
              type: annotation.type,
              geometry: annotation.geometry as Prisma.InputJsonValue,
              style: (annotation.style || null) as Prisma.InputJsonValue,
              text: annotation.text,
              label: annotation.label,
              createdById: staffProfile.id,
            },
          })
        )
      );

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'CREATE',
        entity: 'ImageAnnotation',
        entityId: imageId,
        details: {
          patientId: image.patientId,
          count: annotations.length,
          clearExisting: bulkResult.data.clearExisting || false,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        data: annotations,
      });
    }

    // Single annotation create
    const result = createAnnotationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid annotation data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const annotation = await db.imageAnnotation.create({
      data: {
        imageId,
        type: result.data.type,
        geometry: result.data.geometry as Prisma.InputJsonValue,
        style: (result.data.style || null) as Prisma.InputJsonValue,
        text: result.data.text,
        label: result.data.label,
        createdById: staffProfile.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ImageAnnotation',
      entityId: annotation.id,
      details: {
        imageId,
        patientId: image.patientId,
        type: result.data.type,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: annotation,
    });
  },
  { permissions: ['imaging:annotate'] }
);

/**
 * DELETE /api/images/[id]/annotations
 * Delete all annotations for an image
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

    const deleteResult = await db.imageAnnotation.deleteMany({
      where: { imageId },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ImageAnnotation',
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
