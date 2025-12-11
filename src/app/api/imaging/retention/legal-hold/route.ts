import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { setLegalHoldSchema, removeLegalHoldSchema } from '@/lib/validations/imaging';

/**
 * GET /api/imaging/retention/legal-hold
 * List images with legal holds
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1');
      const pageSize = parseInt(searchParams.get('pageSize') || '50');
      const skip = (page - 1) * pageSize;

      // Get images with legal hold
      const where = withSoftDelete({
        ...getClinicFilter(session),
        legalHold: true,
      });

      const total = await db.patientImage.count({ where });

      const images = await db.patientImage.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { legalHoldSetAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          category: true,
          legalHold: true,
          legalHoldSetAt: true,
          legalHoldReason: true,
          isArchived: true,
          createdAt: true,
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          legalHoldSetBy: {
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
        data: {
          items: images,
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
        },
      });
    } catch (error) {
      console.error('[Legal Hold API] GET Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch legal holds',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:admin'] }
);

/**
 * POST /api/imaging/retention/legal-hold
 * Set legal hold on an image
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    try {
      const body = await req.json();
      const validation = setLegalHoldSchema.safeParse(body);

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

      if (image.legalHold) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ALREADY_ON_HOLD',
              message: 'Image already has a legal hold',
            },
          },
          { status: 400 }
        );
      }

      // Update image with legal hold
      const updatedImage = await db.patientImage.update({
        where: { id: imageId },
        data: {
          legalHold: true,
          legalHoldSetAt: new Date(),
          legalHoldSetById: staffProfile.id,
          legalHoldReason: reason,
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          legalHoldSetBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Create archive record for audit trail
      await db.imageArchiveRecord.create({
        data: {
          clinicId: session.user.clinicId,
          imageId,
          action: 'LEGAL_HOLD_SET',
          reason,
          originalStorageKey: image.fileUrl,
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
          action: 'LEGAL_HOLD_SET',
          reason,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        data: updatedImage,
      });
    } catch (error) {
      console.error('[Legal Hold API] POST Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LEGAL_HOLD_ERROR',
            message: 'Failed to set legal hold',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:admin'] }
);

/**
 * DELETE /api/imaging/retention/legal-hold
 * Remove legal hold from an image
 */
export const DELETE = withAuth(
  async (req: NextRequest, session: Session) => {
    try {
      const { searchParams } = new URL(req.url);
      const imageId = searchParams.get('imageId');
      const reason = searchParams.get('reason');

      const validation = removeLegalHoldSchema.safeParse({ imageId, reason });

      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request parameters',
              details: validation.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

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
          id: validation.data.imageId,
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

      if (!image.legalHold) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_LEGAL_HOLD',
              message: 'Image does not have a legal hold',
            },
          },
          { status: 400 }
        );
      }

      // Remove legal hold
      const updatedImage = await db.patientImage.update({
        where: { id: validation.data.imageId },
        data: {
          legalHold: false,
          legalHoldSetAt: null,
          legalHoldSetById: null,
          legalHoldReason: null,
        },
      });

      // Create archive record for audit trail
      await db.imageArchiveRecord.create({
        data: {
          clinicId: session.user.clinicId,
          imageId: validation.data.imageId,
          action: 'LEGAL_HOLD_REMOVED',
          reason: validation.data.reason,
          originalStorageKey: image.fileUrl,
          performedById: staffProfile.id,
          metadata: {
            previousReason: image.legalHoldReason,
            previousSetBy: image.legalHoldSetById,
            previousSetAt: image.legalHoldSetAt,
          },
        },
      });

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'UPDATE',
        entity: 'PatientImage',
        entityId: validation.data.imageId,
        details: {
          action: 'LEGAL_HOLD_REMOVED',
          reason: validation.data.reason,
          previousReason: image.legalHoldReason,
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        data: updatedImage,
      });
    } catch (error) {
      console.error('[Legal Hold API] DELETE Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LEGAL_HOLD_ERROR',
            message: 'Failed to remove legal hold',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:admin'] }
);
