import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { calculatePTOUsage, recalculatePTOUsage } from '@/lib/services/pto-tracking';
import { ptoUsageQuerySchema } from '@/lib/validations/scheduling';
import { withSoftDelete } from '@/lib/db/soft-delete';

/**
 * GET /api/staff/:id/pto-usage
 * Get PTO usage for a specific staff member
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id: staffProfileId } = await context.params;
    const { searchParams } = new URL(req.url);

    const queryResult = ptoUsageQuerySchema.safeParse({
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

    const { year = new Date().getFullYear() } = queryResult.data;

    // Verify staff profile exists
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

    const usage = await calculatePTOUsage(staffProfileId, session.user.clinicId, year);

    return NextResponse.json({
      success: true,
      data: usage,
    });
  },
  { permissions: ['schedule:view', 'schedule:edit', 'schedule:full'] }
);

/**
 * POST /api/staff/:id/pto-usage
 * Recalculate PTO usage for a staff member (admin action)
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id: staffProfileId } = await context.params;
    const body = await req.json();

    const year = body.year || new Date().getFullYear();

    // Verify staff profile exists
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

    // Recalculate PTO usage
    await recalculatePTOUsage(staffProfileId, session.user.clinicId, year);

    // Get updated usage
    const usage = await calculatePTOUsage(staffProfileId, session.user.clinicId, year);

    return NextResponse.json({
      success: true,
      data: {
        message: 'PTO usage recalculated successfully',
        usage,
      },
    });
  },
  { permissions: ['schedule:full', 'staff:full'] }
);
