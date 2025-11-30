import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createCredentialSchema } from '@/lib/validations/staff';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/staff/[id]/credentials
 * List all credentials for a staff member
 */
export const GET = withAuth(
  async (req, session, context) => {
    const { id: staffProfileId } = await (context as RouteContext).params;

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

    const credentials = await db.credential.findMany({
      where: {
        staffProfileId,
        ...getClinicFilter(session),
      },
      orderBy: [
        { status: 'asc' },
        { expirationDate: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: credentials });
  },
  { permissions: ['staff:view', 'staff:edit', 'staff:full'] }
);

/**
 * POST /api/staff/[id]/credentials
 * Add a new credential to a staff member
 */
export const POST = withAuth(
  async (req, session, context) => {
    const { id: staffProfileId } = await (context as RouteContext).params;
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
    const result = createCredentialSchema.safeParse({
      ...body,
      staffProfileId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid credential data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if credential of same type already exists
    const existing = await db.credential.findFirst({
      where: {
        staffProfileId,
        type: result.data.type,
        status: { in: ['ACTIVE', 'RENEWAL_PENDING'] },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CREDENTIAL',
            message: `An active ${result.data.type} credential already exists`,
          },
        },
        { status: 409 }
      );
    }

    // Create the credential
    const credential = await db.credential.create({
      data: {
        ...result.data,
        clinicId: session.user.clinicId,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Credential',
      entityId: credential.id,
      details: {
        staffProfileId,
        type: credential.type,
        name: credential.name,
        number: credential.number,
        expirationDate: credential.expirationDate,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: credential },
      { status: 201 }
    );
  },
  { permissions: ['staff:edit', 'staff:full'] }
);
