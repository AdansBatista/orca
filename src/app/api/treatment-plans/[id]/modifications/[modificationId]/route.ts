import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

/**
 * GET /api/treatment-plans/[id]/modifications/[modificationId]
 * Get a single plan modification
 */
export const GET = withAuth<{ id: string; modificationId: string }>(
  async (req, session, context) => {
    const { id, modificationId } = await context.params;

    // Verify treatment plan exists
    const treatmentPlan = await db.treatmentPlan.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!treatmentPlan) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Treatment plan not found',
          },
        },
        { status: 404 }
      );
    }

    // Get modification
    const modification = await db.planModification.findFirst({
      where: {
        id: modificationId,
        treatmentPlanId: id,
        clinicId: session.user.clinicId,
      },
      include: {
        modifiedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        acknowledgedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            planNumber: true,
            planName: true,
            version: true,
            status: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!modification) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Plan modification not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: modification });
  },
  { permissions: ['treatment:read'] }
);
