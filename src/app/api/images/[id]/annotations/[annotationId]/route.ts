import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

// Validation schema for updating annotations
const updateAnnotationSchema = z.object({
  geometry: z.object({
    type: z.string(),
    data: z.unknown(),
  }).optional(),
  style: z.object({
    strokeColor: z.string(),
    strokeWidth: z.number(),
    fillColor: z.string(),
    fillOpacity: z.number(),
  }).optional(),
  text: z.string().optional(),
  label: z.string().optional(),
});

/**
 * GET /api/images/[id]/annotations/[annotationId]
 * Get a single annotation
 */
export const GET = withAuth<{ id: string; annotationId: string }>(
  async (req, session, context) => {
    const { id: imageId, annotationId } = await context.params;

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

    const annotation = await db.imageAnnotation.findFirst({
      where: {
        id: annotationId,
        imageId,
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

    if (!annotation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Annotation not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: annotation,
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * PUT /api/images/[id]/annotations/[annotationId]
 * Update an annotation
 */
export const PUT = withAuth<{ id: string; annotationId: string }>(
  async (req, session, context) => {
    const { id: imageId, annotationId } = await context.params;
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

    const existingAnnotation = await db.imageAnnotation.findFirst({
      where: {
        id: annotationId,
        imageId,
      },
    });

    if (!existingAnnotation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Annotation not found',
          },
        },
        { status: 404 }
      );
    }

    const result = updateAnnotationSchema.safeParse(body);

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

    const updateData: Record<string, unknown> = {};
    if (result.data.geometry !== undefined) updateData.geometry = result.data.geometry;
    if (result.data.style !== undefined) updateData.style = result.data.style;
    if (result.data.text !== undefined) updateData.text = result.data.text;
    if (result.data.label !== undefined) updateData.label = result.data.label;

    const annotation = await db.imageAnnotation.update({
      where: { id: annotationId },
      data: updateData,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ImageAnnotation',
      entityId: annotationId,
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
      data: annotation,
    });
  },
  { permissions: ['imaging:annotate'] }
);

/**
 * DELETE /api/images/[id]/annotations/[annotationId]
 * Delete a single annotation
 */
export const DELETE = withAuth<{ id: string; annotationId: string }>(
  async (req, session, context) => {
    const { id: imageId, annotationId } = await context.params;

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

    const annotation = await db.imageAnnotation.findFirst({
      where: {
        id: annotationId,
        imageId,
      },
    });

    if (!annotation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Annotation not found',
          },
        },
        { status: 404 }
      );
    }

    await db.imageAnnotation.delete({
      where: { id: annotationId },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ImageAnnotation',
      entityId: annotationId,
      details: {
        imageId,
        patientId: image.patientId,
        type: annotation.type,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['imaging:annotate'] }
);
