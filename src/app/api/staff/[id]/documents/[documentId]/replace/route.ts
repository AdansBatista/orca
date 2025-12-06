import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { replaceDocumentSchema } from '@/lib/validations/staff';

/**
 * POST /api/staff/[id]/documents/[documentId]/replace
 * Replace a document with a new version
 */
export const POST = withAuth<{ id: string; documentId: string }>(
  async (req, session, context) => {
    const { id: staffProfileId, documentId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = replaceDocumentSchema.safeParse({
      ...body,
      originalDocumentId: documentId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid document replacement data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify staff profile exists and belongs to clinic
    const staffProfile = await db.staffProfile.findFirst({
      where: withSoftDelete({
        id: staffProfileId,
        ...getClinicFilter(session),
      }),
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Staff profile not found',
          },
        },
        { status: 404 }
      );
    }

    // Find the original document
    const originalDocument = await db.staffDocument.findFirst({
      where: {
        id: documentId,
        staffProfileId,
        ...getClinicFilter(session),
      },
    });

    if (!originalDocument) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Document not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Use a transaction to update old version and create new one
    const [updatedOldDoc, newDocument] = await db.$transaction([
      // Mark the old document as not current
      db.staffDocument.update({
        where: { id: documentId },
        data: {
          isCurrentVersion: false,
        },
      }),
      // Create the new version
      db.staffDocument.create({
        data: {
          staffProfileId,
          clinicId: session.user.clinicId,
          name: originalDocument.name,
          category: originalDocument.category,
          accessLevel: originalDocument.accessLevel,
          fileUrl: data.fileUrl,
          fileName: data.fileName,
          fileSize: data.fileSize ?? null,
          mimeType: data.mimeType ?? null,
          description: data.description ?? originalDocument.description,
          expirationDate: data.expirationDate ?? null,
          effectiveDate: data.effectiveDate ?? new Date(),
          version: originalDocument.version + 1,
          previousVersionId: documentId,
          isCurrentVersion: true,
          uploadedBy: session.user.id,
        },
      }),
    ]);

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'StaffDocument',
      entityId: newDocument.id,
      details: {
        action: 'REPLACE',
        staffProfileId,
        previousVersionId: documentId,
        previousVersion: originalDocument.version,
        newVersion: newDocument.version,
        name: newDocument.name,
        category: newDocument.category,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          newDocument,
          previousDocument: updatedOldDoc,
        },
      },
      { status: 201 }
    );
  },
  { permissions: ['staff:edit', 'staff:full'] }
);
