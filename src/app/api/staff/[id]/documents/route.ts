import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createStaffDocumentSchema } from '@/lib/validations/staff';

/**
 * GET /api/staff/[id]/documents
 * List all documents for a staff member
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id: staffProfileId } = await context.params;

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

    const documents = await db.staffDocument.findMany({
      where: {
        staffProfileId,
        ...getClinicFilter(session),
      },
      orderBy: [
        { uploadedAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, data: documents });
  },
  { permissions: ['staff:view', 'staff:edit', 'staff:full'] }
);

/**
 * POST /api/staff/[id]/documents
 * Add a new document to a staff member
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id: staffProfileId } = await context.params;
    const body = await req.json();

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

    // Validate input
    const result = createStaffDocumentSchema.safeParse({
      ...body,
      staffProfileId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid document data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Create the document record
    const document = await db.staffDocument.create({
      data: {
        ...result.data,
        clinicId: session.user.clinicId,
        uploadedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'StaffDocument',
      entityId: document.id,
      details: {
        staffProfileId,
        name: document.name,
        category: document.category,
        fileName: document.fileName,
        accessLevel: document.accessLevel,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: document },
      { status: 201 }
    );
  },
  { permissions: ['staff:edit', 'staff:full'] }
);

/**
 * DELETE /api/staff/[id]/documents
 * Delete a document (requires documentId in query params)
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id: staffProfileId } = await context.params;
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');

    if (!documentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_PARAM',
            message: 'Document ID is required',
          },
        },
        { status: 400 }
      );
    }

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

    // Find the document
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

    // Delete the document record
    await db.staffDocument.delete({
      where: { id: documentId },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'StaffDocument',
      entityId: documentId,
      details: {
        staffProfileId,
        name: document.name,
        category: document.category,
        fileName: document.fileName,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['staff:edit', 'staff:full'] }
);
