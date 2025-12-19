import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateCECreditSchema } from '@/lib/validations/performance';

/**
 * GET /api/staff/ce-credits/[id]
 * Get a single CE credit
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    const ceCredit = await db.cECredit.findFirst({
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

    if (!ceCredit) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'CE credit not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: ceCredit });
  },
  { permissions: ['staff:read', 'staff:write', 'staff:admin'] }
);

/**
 * PUT /api/staff/ce-credits/[id]
 * Update a CE credit
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);

    // Validate input
    const result = updateCECreditSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid CE credit data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if CE credit exists
    const existing = await db.cECredit.findFirst({
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
            message: 'CE credit not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Track verification changes
    const updateData: Record<string, unknown> = { ...data };
    if (data.isVerified === true && !existing.isVerified) {
      updateData.verifiedAt = new Date();
      updateData.verifiedBy = session.user.id;
    }

    // Update the CE credit
    const ceCredit = await db.cECredit.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'CECredit',
      entityId: ceCredit.id,
      details: {
        changes: Object.keys(data),
        verified: data.isVerified,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: ceCredit });
  },
  { permissions: ['staff:write', 'staff:admin'] }
);

/**
 * DELETE /api/staff/ce-credits/[id]
 * Delete a CE credit
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    // Check if CE credit exists
    const existing = await db.cECredit.findFirst({
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
            message: 'CE credit not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the CE credit
    await db.cECredit.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'CECredit',
      entityId: id,
      details: {
        staffProfileId: existing.staffProfileId,
        courseName: existing.courseName,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['staff:admin'] }
);
