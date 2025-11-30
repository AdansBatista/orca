import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createEmergencyContactSchema } from '@/lib/validations/staff';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/staff/[id]/emergency-contacts
 * List all emergency contacts for a staff member
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

    const emergencyContacts = await db.emergencyContact.findMany({
      where: {
        staffProfileId,
        ...getClinicFilter(session),
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: emergencyContacts });
  },
  { permissions: ['staff:view', 'staff:edit', 'staff:full'] }
);

/**
 * POST /api/staff/[id]/emergency-contacts
 * Add a new emergency contact to a staff member
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
    const result = createEmergencyContactSchema.safeParse({
      ...body,
      staffProfileId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid emergency contact data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // If setting as primary, unset any existing primary
    if (result.data.isPrimary) {
      await db.emergencyContact.updateMany({
        where: {
          staffProfileId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Create the emergency contact
    const emergencyContact = await db.emergencyContact.create({
      data: {
        ...result.data,
        clinicId: session.user.clinicId,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'EmergencyContact',
      entityId: emergencyContact.id,
      details: {
        staffProfileId,
        name: emergencyContact.name,
        relationship: emergencyContact.relationship,
        isPrimary: emergencyContact.isPrimary,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: emergencyContact },
      { status: 201 }
    );
  },
  { permissions: ['staff:edit', 'staff:full'] }
);
