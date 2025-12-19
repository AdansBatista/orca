import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/treatment-plans/[id]/versions
 * Get version history for a treatment plan (modifications that created new versions)
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Verify treatment plan exists
    const treatmentPlan = await db.treatmentPlan.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      select: {
        id: true,
        planNumber: true,
        planName: true,
        version: true,
        status: true,
        createdAt: true,
      },
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

    // Get all version-creating modifications
    const versionModifications = await db.planModification.findMany({
      where: {
        treatmentPlanId: id,
        clinicId: session.user.clinicId,
        createsNewVersion: true,
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
      },
      orderBy: { newVersion: 'asc' },
    });

    // Build version timeline
    const versions = [
      {
        version: 1,
        createdAt: treatmentPlan.createdAt,
        isInitial: true,
        modificationType: null,
        changeDescription: 'Initial treatment plan created',
        modifiedBy: null,
        previousStateSnapshot: null,
      },
      ...versionModifications.map((mod) => ({
        version: mod.newVersion,
        createdAt: mod.modificationDate,
        isInitial: false,
        modificationType: mod.modificationType,
        changeDescription: mod.changeDescription,
        reason: mod.reason,
        modifiedBy: mod.modifiedBy,
        previousStateSnapshot: mod.previousStateSnapshot,
        feeChange: mod.feeChangeAmount,
        requiresAcknowledgment: mod.requiresAcknowledgment,
        acknowledgedAt: mod.acknowledgedAt,
        acknowledgedBy: mod.acknowledgedBy,
      })),
    ];

    return NextResponse.json({
      success: true,
      data: {
        currentVersion: treatmentPlan.version,
        versions,
        totalVersions: versions.length,
      },
    });
  },
  { permissions: ['treatment:read'] }
);
