import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateReferringProviderSchema } from '@/lib/validations/referrers';

/**
 * GET /api/referrers/[id]
 * Get a single referring provider with referral history
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const provider = await db.referringProvider.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        leads: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
            stage: true,
            createdAt: true,
            convertedAt: true,
          },
        },
        referralLetters: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            type: true,
            subject: true,
            sentAt: true,
            sentVia: true,
            createdAt: true,
          },
        },
        _count: {
          select: { leads: true, referralLetters: true },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Referring provider not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: provider });
  },
  { permissions: ['leads:view', 'leads:edit', 'leads:full'] }
);

/**
 * PUT /api/referrers/[id]
 * Update a referring provider
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateReferringProviderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid provider data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check provider exists
    const existing = await db.referringProvider.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Referring provider not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Update the provider
    const provider = await db.referringProvider.update({
      where: { id },
      data,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ReferringProvider',
      entityId: provider.id,
      details: {
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: provider });
  },
  { permissions: ['leads:edit', 'leads:full'] }
);

/**
 * DELETE /api/referrers/[id]
 * Soft delete a referring provider
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Check provider exists
    const existing = await db.referringProvider.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Referring provider not found',
          },
        },
        { status: 404 }
      );
    }

    // Soft delete
    await db.referringProvider.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ReferringProvider',
      entityId: id,
      details: {
        practiceName: existing.practiceName,
        name: `${existing.firstName} ${existing.lastName}`,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['leads:full'] }
);
