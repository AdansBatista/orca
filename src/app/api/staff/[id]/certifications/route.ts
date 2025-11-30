import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createCertificationSchema } from '@/lib/validations/staff';

/**
 * GET /api/staff/[id]/certifications
 * List all certifications for a staff member
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

    const certifications = await db.certification.findMany({
      where: {
        staffProfileId,
        ...getClinicFilter(session),
      },
      orderBy: [
        { status: 'asc' },
        { expirationDate: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: certifications });
  },
  { permissions: ['staff:view', 'staff:edit', 'staff:full'] }
);

/**
 * POST /api/staff/[id]/certifications
 * Add a new certification to a staff member
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
    const result = createCertificationSchema.safeParse({
      ...body,
      staffProfileId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid certification data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Create the certification
    const certification = await db.certification.create({
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
      entity: 'Certification',
      entityId: certification.id,
      details: {
        staffProfileId,
        type: certification.type,
        name: certification.name,
        expirationDate: certification.expirationDate,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: certification },
      { status: 201 }
    );
  },
  { permissions: ['staff:edit', 'staff:full'] }
);
