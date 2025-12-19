import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { getCampaignExecutionService } from '@/lib/services/campaigns';
import { z } from 'zod';

const triggerSchema = z.object({
  patientIds: z.array(z.string()).optional(),
  all: z.boolean().optional(),
});

/**
 * POST /api/campaigns/[id]/trigger
 *
 * Manually trigger a campaign for specific patients or all matching audience.
 * Only works for campaigns in ACTIVE status.
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = triggerSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid trigger data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { patientIds, all } = result.data;

    // Get campaign
    const campaign = await db.campaign.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      include: {
        steps: {
          orderBy: { stepOrder: 'asc' },
        },
      },
    });

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CAMPAIGN_NOT_FOUND',
            message: 'Campaign not found',
          },
        },
        { status: 404 }
      );
    }

    // Check campaign status
    if (campaign.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CAMPAIGN_NOT_ACTIVE',
            message: 'Campaign must be active to trigger manually',
          },
        },
        { status: 400 }
      );
    }

    // Check steps exist
    if (campaign.steps.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_STEPS',
            message: 'Campaign has no steps configured',
          },
        },
        { status: 400 }
      );
    }

    const service = getCampaignExecutionService();
    let results;

    if (all) {
      // Trigger for entire audience
      // We need to re-fetch with the full type
      const fullCampaign = await db.campaign.findUnique({
        where: { id },
        include: {
          steps: {
            orderBy: { stepOrder: 'asc' },
          },
        },
      });

      if (!fullCampaign) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Campaign not found' } },
          { status: 404 }
        );
      }

      // Use the execution service's internal method pattern
      // For now, we'll emit events for each patient
      const patients = await getAudiencePatients(
        campaign.clinicId,
        campaign.audience as Record<string, unknown> | null,
        campaign.excludeCriteria as Record<string, unknown> | null
      );

      let processed = 0;
      let sent = 0;
      let failed = 0;

      for (const patient of patients) {
        try {
          await service.processEvent({
            event: 'custom',
            clinicId: campaign.clinicId,
            patientId: patient.id,
            timestamp: new Date(),
            data: { manual: true, campaignId: id },
          });
          sent++;
        } catch {
          failed++;
        }
        processed++;
      }

      results = { processed, sent, failed };
    } else if (patientIds && patientIds.length > 0) {
      // Trigger for specific patients
      let processed = 0;
      let sent = 0;
      let failed = 0;

      for (const patientId of patientIds) {
        try {
          await service.processEvent({
            event: 'custom',
            clinicId: campaign.clinicId,
            patientId,
            timestamp: new Date(),
            data: { manual: true, campaignId: id },
          });
          sent++;
        } catch {
          failed++;
        }
        processed++;
      }

      results = { processed, sent, failed };
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_TARGETS',
            message: 'Must specify patientIds or set all=true',
          },
        },
        { status: 400 }
      );
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'CampaignSend',
      entityId: id,
      details: {
        action: 'manual_trigger',
        results,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: results,
    });
  },
  { permissions: ['comms:manage_campaigns'] }
);

/**
 * Get patients matching audience criteria
 */
async function getAudiencePatients(
  clinicId: string,
  audience: Record<string, unknown> | null,
  exclude: Record<string, unknown> | null
): Promise<Array<{ id: string }>> {
  const where: Record<string, unknown> = {
    clinicId,
    deletedAt: null,
  };

  if (audience) {
    const patientStatus = audience.patientStatus as string[] | undefined;
    if (patientStatus?.length) {
      where.status = { in: patientStatus };
    }
    if (audience.hasEmail) {
      where.email = { not: null };
    }
    if (audience.hasPhone) {
      where.phone = { not: null };
    }
  }

  if (exclude) {
    const excludeStatus = exclude.patientStatus as string[] | undefined;
    if (excludeStatus?.length) {
      where.status = { ...((where.status as object) || {}), notIn: excludeStatus };
    }
  }

  return db.patient.findMany({
    where,
    select: { id: true },
    take: 1000,
  });
}
