import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createStaffDocumentSchema, documentQuerySchema } from '@/lib/validations/staff';

/**
 * GET /api/staff/[id]/documents
 * List all documents for a staff member
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id: staffProfileId } = await context.params;
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      category: searchParams.get('category') ?? undefined,
      expirationStatus: searchParams.get('expirationStatus') ?? undefined,
      expiringWithinDays: searchParams.get('expiringWithinDays') ?? undefined,
      includeVersionHistory: searchParams.get('includeVersionHistory') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = documentQuerySchema.safeParse(rawParams);

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

    const { category, expirationStatus, expiringWithinDays, includeVersionHistory, page, pageSize } = queryResult.data;

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

    // Build where clause
    const where: Record<string, unknown> = {
      staffProfileId,
      ...getClinicFilter(session),
    };

    // Only show current versions unless version history is requested
    if (!includeVersionHistory) {
      where.isCurrentVersion = true;
    }

    if (category) {
      where.category = category;
    }

    if (expirationStatus) {
      where.expirationStatus = expirationStatus;
    }

    // Filter by expiring within N days
    if (expiringWithinDays) {
      const now = new Date();
      const threshold = new Date();
      threshold.setDate(threshold.getDate() + expiringWithinDays);
      where.expirationDate = {
        gte: now,
        lte: threshold,
      };
    }

    // Get total count
    const total = await db.staffDocument.count({ where });

    // Get paginated results
    const documents = await db.staffDocument.findMany({
      where,
      orderBy: [
        { isCurrentVersion: 'desc' },
        { uploadedAt: 'desc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Add calculated fields for expiration
    const now = new Date();
    const documentsWithExpiration = documents.map((doc) => {
      let calculatedStatus = doc.expirationStatus;
      let daysUntilExpiration: number | null = null;

      if (doc.expirationDate) {
        const expDate = new Date(doc.expirationDate);
        daysUntilExpiration = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiration < 0) {
          calculatedStatus = 'EXPIRED';
        } else if (daysUntilExpiration <= 30) {
          calculatedStatus = 'EXPIRING_SOON';
        } else {
          calculatedStatus = 'ACTIVE';
        }
      }

      return {
        ...doc,
        calculatedExpirationStatus: calculatedStatus,
        daysUntilExpiration,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: documentsWithExpiration,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
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
