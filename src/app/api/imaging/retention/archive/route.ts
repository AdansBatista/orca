import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { createHash } from 'crypto';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { getStorage } from '@/lib/storage';
import {
  archiveImageSchema,
  restoreImageSchema,
  bulkArchiveSchema,
  archiveHistoryQuerySchema,
} from '@/lib/validations/imaging';

/**
 * GET /api/imaging/retention/archive
 * Get archive history records
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    try {
      const { searchParams } = new URL(req.url);
      const queryResult = archiveHistoryQuerySchema.safeParse(
        Object.fromEntries(searchParams.entries())
      );

      if (!queryResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid query parameters',
              details: queryResult.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const query = queryResult.data;
      const skip = (query.page - 1) * query.pageSize;

      // Build where clause
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = getClinicFilter(session);

      if (query.imageId) {
        where.imageId = query.imageId;
      }
      if (query.action) {
        where.action = query.action;
      }
      if (query.startDate || query.endDate) {
        where.actionAt = {};
        if (query.startDate) where.actionAt.gte = new Date(query.startDate);
        if (query.endDate) where.actionAt.lte = new Date(query.endDate);
      }

      // Get total count
      const total = await db.imageArchiveRecord.count({ where });

      // Get records
      const records = await db.imageArchiveRecord.findMany({
        where,
        skip,
        take: query.pageSize,
        orderBy: { actionAt: 'desc' },
        include: {
          image: {
            select: {
              id: true,
              fileName: true,
              category: true,
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          performedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          policy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          items: records,
          total,
          page: query.page,
          pageSize: query.pageSize,
          totalPages: Math.ceil(total / query.pageSize),
        },
      });
    } catch (error) {
      console.error('[Archive History API] GET Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch archive history',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:admin'] }
);

/**
 * POST /api/imaging/retention/archive
 * Archive an image or multiple images
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    try {
      const body = await req.json();

      // Try bulk archive first, then single archive
      const bulkValidation = bulkArchiveSchema.safeParse(body);
      const singleValidation = archiveImageSchema.safeParse(body);

      if (!bulkValidation.success && !singleValidation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request body',
              details: singleValidation.error?.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const imageIds = bulkValidation.success
        ? bulkValidation.data.imageIds
        : [singleValidation.data!.imageId];
      const reason = bulkValidation.success
        ? bulkValidation.data.reason
        : singleValidation.data!.reason;

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

      // Verify images exist and belong to clinic
      const images = await db.patientImage.findMany({
        where: withSoftDelete({
          id: { in: imageIds },
          ...getClinicFilter(session),
        }),
      });

      if (images.length !== imageIds.length) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'IMAGES_NOT_FOUND',
              message: 'One or more images not found',
            },
          },
          { status: 404 }
        );
      }

      // Check for legal holds
      const imagesWithLegalHold = images.filter((img) => img.legalHold);
      if (imagesWithLegalHold.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'LEGAL_HOLD_ACTIVE',
              message: `Cannot archive ${imagesWithLegalHold.length} image(s) with active legal hold`,
              details: {
                imageIds: imagesWithLegalHold.map((img) => img.id),
              },
            },
          },
          { status: 400 }
        );
      }

      // Check for already archived images
      const alreadyArchived = images.filter((img) => img.isArchived);
      if (alreadyArchived.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ALREADY_ARCHIVED',
              message: `${alreadyArchived.length} image(s) are already archived`,
            },
          },
          { status: 400 }
        );
      }

      const storage = getStorage();
      const archivedImages = [];
      const archiveRecords = [];

      for (const image of images) {
        try {
          // Calculate file checksum for integrity verification
          // In production, this would read the actual file and compute SHA256
          const checksum = createHash('sha256')
            .update(image.fileUrl)
            .digest('hex');

          // Archive to cold storage
          // In production, this would move the file to a different storage tier
          const archiveKey = `archive/${session.user.clinicId}/${image.patientId}/${image.id}`;

          // For now, we'll just mark it as archived without actually moving the file
          // In production: await storage.archive(image.fileUrl, archiveKey);

          // Update image record
          await db.patientImage.update({
            where: { id: image.id },
            data: {
              isArchived: true,
              archivedAt: new Date(),
              archiveStorageKey: archiveKey,
            },
          });

          // Create archive record
          const record = await db.imageArchiveRecord.create({
            data: {
              clinicId: session.user.clinicId,
              imageId: image.id,
              action: 'ARCHIVED',
              reason,
              policyId: image.retentionPolicyId,
              originalStorageKey: image.fileUrl,
              archiveStorageKey: archiveKey,
              fileChecksum: checksum,
              performedById: staffProfile.id,
              expiresAt: image.retentionExpiresAt,
            },
          });

          archivedImages.push(image.id);
          archiveRecords.push(record);
        } catch (err) {
          console.error(`Failed to archive image ${image.id}:`, err);
        }
      }

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'UPDATE',
        entity: 'PatientImage',
        entityId: archivedImages.join(','),
        details: {
          action: 'ARCHIVED',
          count: archivedImages.length,
          reason,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        data: {
          archived: archivedImages.length,
          records: archiveRecords,
        },
      });
    } catch (error) {
      console.error('[Archive API] POST Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ARCHIVE_ERROR',
            message: 'Failed to archive images',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:admin'] }
);
