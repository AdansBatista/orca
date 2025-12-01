import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth/with-auth';
import { getPTOUsageSummaryForClinic } from '@/lib/services/pto-tracking';
import { z } from 'zod';

const querySchema = z.object({
  year: z.coerce.number().min(2020).max(2100).default(new Date().getFullYear()),
});

/**
 * GET /api/staff/pto-usage
 * Get PTO usage summary for all staff members in the clinic
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    const queryResult = querySchema.safeParse({
      year: searchParams.get('year') ?? undefined,
    });

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

    const { year } = queryResult.data;

    const summary = await getPTOUsageSummaryForClinic(session.user.clinicId, year);

    return NextResponse.json({
      success: true,
      data: {
        year,
        summary,
      },
    });
  },
  { permissions: ['schedule:view', 'schedule:edit', 'schedule:full', 'staff:view', 'staff:full'] }
);
