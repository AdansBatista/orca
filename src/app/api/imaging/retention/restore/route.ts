import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { restoreImageSchema } from '@/lib/validations/imaging';

/**
 * POST /api/imaging/retention/restore
 * Restore an archived image
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    try {
      const body = await req.json();
      const validation = restoreImageSchema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body',
              details: validation.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const { imageId, reason } = validation.data;

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
              message: 'Staff profile not found',
            },
          },
          { status: 400 }
        );
      }

      // Verify image exists and belongs to clinic
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

      if (!image.isArchived) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_ARCHIVED',
              message: 'Image is not archived',
            },
          },
          { status: 400 }
        );
      }

      // Find the original archive record to get original storage key
      const archiveRecord = await db.imageArchiveRecord.findFirst({
        where: {
          imageId,
          action: 'ARCHIVED',
        },
        orderBy: { actionAt: 'desc' },
      });

      // In production, this would restore the file from cold storage
      // await storage.restore(image.archiveStorageKey, archiveRecord?.originalStorageKey);

      // Update image record
      const updatedImage = await db.patientImage.update({
        where: { id: imageId },
        data: {
          isArchived: false,
          archivedAt: null,
          archiveStorageKey: null,
        },
      });

      // Create restore record
      const record = await db.imageArchiveRecord.create({
        data: {
          clinicId: session.user.clinicId,
          imageId,
          action: 'RESTORED',
          reason,
          policyId: image.retentionPolicyId,
          originalStorageKey: image.archiveStorageKey || image.fileUrl,
          restoredAt: new Date(),
          performedById: staffProfile.id,
        },
      });

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'UPDATE',
        entity: 'PatientImage',
        entityId: imageId,
        details: {
          action: 'RESTORED',
          reason,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        data: {
          image: updatedImage,
          record,
        },
      });
    } catch (error) {
      console.error('[Restore API] POST Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RESTORE_ERROR',
            message: 'Failed to restore image',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:admin'] }
);
