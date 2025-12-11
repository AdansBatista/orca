import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  linkImageToPhaseSchema,
  bulkLinkImagesToPhaseSchema,
} from '@/lib/validations/imaging';

/**
 * POST /api/images/phase-link
 * Link an image to a treatment phase
 */
export const POST = withAuth(
  async (req, session) => {
    try {
      const body = await req.json();

      // Check if it's a bulk operation
      const isBulk = Array.isArray(body.imageIds);

      if (isBulk) {
        // Bulk link operation
        const validation = bulkLinkImagesToPhaseSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request',
                details: validation.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        const { imageIds, treatmentPhaseId, treatmentPlanId } = validation.data;

        // Verify the phase exists and belongs to the clinic
        const phase = await db.treatmentPhase.findFirst({
          where: {
            id: treatmentPhaseId,
            ...getClinicFilter(session),
          },
          include: {
            treatmentPlan: {
              select: {
                id: true,
                patientId: true,
              },
            },
          },
        });

        if (!phase) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'PHASE_NOT_FOUND',
                message: 'Treatment phase not found',
              },
            },
            { status: 404 }
          );
        }

        // Update all images
        const result = await db.patientImage.updateMany({
          where: {
            id: { in: imageIds },
            ...getClinicFilter(session),
            deletedAt: null,
          },
          data: {
            treatmentPhaseId,
            treatmentPlanId: treatmentPlanId || phase.treatmentPlanId,
          },
        });

        // Audit log
        const { ipAddress, userAgent } = getRequestMeta(req);
        await logAudit(session, {
          action: 'UPDATE',
          entity: 'PatientImage',
          entityId: imageIds.join(','),
          details: {
            operation: 'bulk_link_to_phase',
            treatmentPhaseId,
            treatmentPlanId: treatmentPlanId || phase.treatmentPlanId,
            imageCount: result.count,
          },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: {
            linked: result.count,
            phaseId: treatmentPhaseId,
            planId: treatmentPlanId || phase.treatmentPlanId,
          },
        });
      } else {
        // Single image link operation
        const validation = linkImageToPhaseSchema.safeParse(body);
        if (!validation.success) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request',
                details: validation.error.flatten(),
              },
            },
            { status: 400 }
          );
        }

        const { imageId, treatmentPhaseId, treatmentPlanId } = validation.data;

        // Verify the phase exists
        const phase = await db.treatmentPhase.findFirst({
          where: {
            id: treatmentPhaseId,
            ...getClinicFilter(session),
          },
          include: {
            treatmentPlan: {
              select: {
                id: true,
                patientId: true,
              },
            },
          },
        });

        if (!phase) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: 'PHASE_NOT_FOUND',
                message: 'Treatment phase not found',
              },
            },
            { status: 404 }
          );
        }

        // Verify image exists
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
                code: 'IMAGE_NOT_FOUND',
                message: 'Image not found',
              },
            },
            { status: 404 }
          );
        }

        // Update the image
        const updatedImage = await db.patientImage.update({
          where: { id: imageId },
          data: {
            treatmentPhaseId,
            treatmentPlanId: treatmentPlanId || phase.treatmentPlanId,
          },
          include: {
            treatmentPhase: {
              select: {
                id: true,
                phaseName: true,
                phaseNumber: true,
                phaseType: true,
              },
            },
            treatmentPlan: {
              select: {
                id: true,
                planName: true,
              },
            },
          },
        });

        // Audit log
        const { ipAddress, userAgent } = getRequestMeta(req);
        await logAudit(session, {
          action: 'UPDATE',
          entity: 'PatientImage',
          entityId: imageId,
          details: {
            operation: 'link_to_phase',
            treatmentPhaseId,
            treatmentPlanId: treatmentPlanId || phase.treatmentPlanId,
          },
          ipAddress,
          userAgent,
        });

        return NextResponse.json({
          success: true,
          data: updatedImage,
        });
      }
    } catch (error) {
      console.error('[Phase Link API] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LINK_ERROR',
            message: 'Failed to link image to phase',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:upload'] }
);

/**
 * DELETE /api/images/phase-link
 * Unlink an image from a treatment phase
 */
export const DELETE = withAuth(
  async (req, session) => {
    try {
      const { searchParams } = new URL(req.url);
      const imageId = searchParams.get('imageId');

      if (!imageId) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'MISSING_IMAGE_ID',
              message: 'Image ID is required',
            },
          },
          { status: 400 }
        );
      }

      // Verify image exists
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
              code: 'IMAGE_NOT_FOUND',
              message: 'Image not found',
            },
          },
          { status: 404 }
        );
      }

      // Unlink the image from phase (keep treatment plan link if desired)
      const keepPlanLink = searchParams.get('keepPlanLink') === 'true';

      const updatedImage = await db.patientImage.update({
        where: { id: imageId },
        data: {
          treatmentPhaseId: null,
          ...(keepPlanLink ? {} : { treatmentPlanId: null }),
        },
      });

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'UPDATE',
        entity: 'PatientImage',
        entityId: imageId,
        details: {
          operation: 'unlink_from_phase',
          previousPhaseId: image.treatmentPhaseId,
          previousPlanId: image.treatmentPlanId,
          keepPlanLink,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        data: updatedImage,
      });
    } catch (error) {
      console.error('[Phase Unlink API] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UNLINK_ERROR',
            message: 'Failed to unlink image from phase',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:upload'] }
);
