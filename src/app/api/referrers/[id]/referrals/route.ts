import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/referrers/[id]/referrals
 * Get all leads referred by this provider
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Verify provider exists and belongs to clinic
    const provider = await db.referringProvider.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
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

    // Get all leads referred by this provider
    const leads = await db.lead.findMany({
      where: withSoftDelete({
        ...getClinicFilter(session),
        referringDentistId: id,
      }),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        status: true,
        stage: true,
        createdAt: true,
        convertedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: leads,
    });
  },
  { permissions: ['leads:view', 'leads:edit', 'leads:full'] }
);
