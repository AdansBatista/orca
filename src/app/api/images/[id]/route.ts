import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { getStorage } from '@/lib/storage';
import { updatePatientImageSchema, tagAssignmentSchema } from '@/lib/validations/imaging';

/**
 * GET /api/images/[id]
 * Get a single image with all details
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const image = await db.patientImage.findFirst({
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
          },
        },
        capturedBy: {
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
        protocol: {
          select: {
            id: true,
            name: true,
          },
        },
        protocolSlot: {
          select: {
            id: true,
            name: true,
          },
        },
        appointment: {
          select: {
            id: true,
            startTime: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            planType: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
        annotations: {
          orderBy: { createdAt: 'asc' },
        },
      },
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

    // Flatten tags for easier consumption
    const imageWithTags = {
      ...image,
      tags: image.tags.map((ta: { tag: unknown }) => ta.tag),
    };

    return NextResponse.json({
      success: true,
      data: imageWithTags,
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * PUT /api/images/[id]
 * Update image metadata
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Find the image
    const existingImage = await db.patientImage.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existingImage) {
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

    // Check if this is a tag assignment update
    if (body.tagIds !== undefined) {
      const tagResult = tagAssignmentSchema.safeParse({ tagIds: body.tagIds });

      if (!tagResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid tag data',
              details: tagResult.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      // Update tags - delete existing and create new
      await db.imageTagAssignment.deleteMany({
        where: { imageId: id },
      });

      if (tagResult.data.tagIds.length > 0) {
        await db.imageTagAssignment.createMany({
          data: tagResult.data.tagIds.map((tagId) => ({
            imageId: id,
            tagId,
          })),
        });
      }
    }

    // Validate metadata update
    const metadataResult = updatePatientImageSchema.safeParse(body);

    if (!metadataResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid image data',
            details: metadataResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Update the image
    const updateData: Record<string, unknown> = {};
    const validData = metadataResult.data;

    // Only include fields that were provided
    if (validData.category !== undefined) updateData.category = validData.category;
    if (validData.subcategory !== undefined) updateData.subcategory = validData.subcategory;
    if (validData.captureDate !== undefined) {
      updateData.captureDate = validData.captureDate ? new Date(validData.captureDate) : null;
    }
    if (validData.capturedById !== undefined) updateData.capturedById = validData.capturedById;
    if (validData.appointmentId !== undefined) updateData.appointmentId = validData.appointmentId;
    if (validData.treatmentPlanId !== undefined) updateData.treatmentPlanId = validData.treatmentPlanId;
    if (validData.protocolId !== undefined) updateData.protocolId = validData.protocolId;
    if (validData.protocolSlotId !== undefined) updateData.protocolSlotId = validData.protocolSlotId;
    if (validData.qualityScore !== undefined) updateData.qualityScore = validData.qualityScore;
    if (validData.visibleToPatient !== undefined) updateData.visibleToPatient = validData.visibleToPatient;
    if (validData.description !== undefined) updateData.description = validData.description;
    if (validData.notes !== undefined) updateData.notes = validData.notes;

    const image = await db.patientImage.update({
      where: { id },
      data: updateData,
      include: {
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PatientImage',
      entityId: id,
      details: {
        patientId: existingImage.patientId,
        updates: Object.keys(updateData),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...image,
        tags: image.tags.map((ta) => ta.tag),
      },
    });
  },
  { permissions: ['imaging:edit'] }
);

/**
 * DELETE /api/images/[id]
 * Soft delete an image
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Find the image
    const image = await db.patientImage.findFirst({
      where: withSoftDelete({
        id,
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

    // Soft delete the image
    await db.patientImage.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    // Note: We don't delete the actual file from storage for recovery purposes
    // A separate cleanup job can handle permanent deletion after retention period

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'PatientImage',
      entityId: id,
      details: {
        patientId: image.patientId,
        fileName: image.fileName,
        category: image.category,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['imaging:delete'] }
);
