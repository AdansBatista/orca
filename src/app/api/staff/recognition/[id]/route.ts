import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

/**
 * GET /api/staff/recognition/[id]
 * Get a single recognition
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    const recognition = await db.recognition.findFirst({
      where: {
        id,
        ...clinicFilter,
      },
      include: {
        staffProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    if (!recognition) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Recognition not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: recognition });
  },
  { permissions: ['staff:read', 'staff:write', 'staff:admin'] }
);

/**
 * DELETE /api/staff/recognition/[id]
 * Delete a recognition
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    // Check if recognition exists
    const existing = await db.recognition.findFirst({
      where: {
        id,
        ...clinicFilter,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Recognition not found',
          },
        },
        { status: 404 }
      );
    }

    // Only allow deletion by the person who gave it or admins
    if (existing.givenById !== session.user.id && !['super_admin', 'clinic_admin'].includes(session.user.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'You can only delete recognitions you gave',
          },
        },
        { status: 403 }
      );
    }

    // Delete the recognition
    await db.recognition.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'Recognition',
      entityId: id,
      details: {
        staffProfileId: existing.staffProfileId,
        title: existing.title,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['staff:read', 'staff:write', 'staff:admin'] }
);
