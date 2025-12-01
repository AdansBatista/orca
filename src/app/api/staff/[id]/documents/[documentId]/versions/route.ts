import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/staff/[id]/documents/[documentId]/versions
 * Get version history for a document
 */
export const GET = withAuth<{ id: string; documentId: string }>(
  async (req, session, context) => {
    const { id: staffProfileId, documentId } = await context.params;

    // Verify staff profile exists and belongs to clinic
    const staffProfile = await db.staffProfile.findFirst({
      where: {
        id: staffProfileId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
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

    // Find the specified document
    const document = await db.staffDocument.findFirst({
      where: {
        id: documentId,
        staffProfileId,
        ...getClinicFilter(session),
      },
    });

    if (!document) {
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

    // Find the root document by following previousVersionId chain backwards
    let rootDocId = document.previousVersionId || documentId;
    let currentDoc = document;

    // If this is not the first version, trace back to find root
    while (currentDoc.previousVersionId) {
      const prevDoc = await db.staffDocument.findFirst({
        where: {
          id: currentDoc.previousVersionId,
          staffProfileId,
        },
      });

      if (prevDoc) {
        currentDoc = prevDoc;
        if (!prevDoc.previousVersionId) {
          rootDocId = prevDoc.id;
        }
      } else {
        break;
      }
    }

    // Now get all documents in this version chain
    // Find all documents where this one is the root OR linked to this chain
    const allVersions = await db.staffDocument.findMany({
      where: {
        staffProfileId,
        ...getClinicFilter(session),
        OR: [
          { id: rootDocId },
          { previousVersionId: rootDocId },
          // This is a simplified approach - for deep chains we'd need recursion
          // For now, we get the direct lineage
        ],
      },
      orderBy: { version: 'asc' },
    });

    // If we didn't get all versions, try a different approach
    // Get all documents with the same name (version chain typically shares the same name)
    const versionsByName = await db.staffDocument.findMany({
      where: {
        staffProfileId,
        ...getClinicFilter(session),
        name: document.name,
        category: document.category,
      },
      orderBy: { version: 'asc' },
    });

    // Use the result with more versions
    const versions = versionsByName.length > allVersions.length ? versionsByName : allVersions;

    return NextResponse.json({
      success: true,
      data: {
        currentVersion: document.version,
        currentDocumentId: document.isCurrentVersion ? document.id :
          versions.find(v => v.isCurrentVersion)?.id || document.id,
        versions: versions.map((v) => ({
          id: v.id,
          version: v.version,
          isCurrentVersion: v.isCurrentVersion,
          fileName: v.fileName,
          fileUrl: v.fileUrl,
          fileSize: v.fileSize,
          uploadedAt: v.uploadedAt,
          effectiveDate: v.effectiveDate,
          expirationDate: v.expirationDate,
          expirationStatus: v.expirationStatus,
          description: v.description,
        })),
        total: versions.length,
      },
    });
  },
  { permissions: ['staff:view', 'staff:edit', 'staff:full'] }
);
