import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

const STAGES = [
  'INQUIRY',
  'CONTACTED',
  'CONSULTATION_SCHEDULED',
  'CONSULTATION_COMPLETED',
  'PENDING_DECISION',
  'TREATMENT_ACCEPTED',
  'TREATMENT_STARTED',
  'LOST',
] as const;

/**
 * GET /api/leads/pipeline
 * Get leads grouped by stage for pipeline view
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    const assignedToId = searchParams.get('assignedToId') || undefined;
    const source = searchParams.get('source') || undefined;

    // Build base where clause
    const baseWhere = withSoftDelete({
      ...getClinicFilter(session),
      status: { not: 'CONVERTED' }, // Exclude converted leads
    }) as Record<string, unknown>;

    if (assignedToId) baseWhere.assignedToId = assignedToId;
    if (source) baseWhere.source = source;

    // Get counts by stage
    const stageCounts = await Promise.all(
      STAGES.map(async (stage) => {
        const count = await db.lead.count({
          where: { ...baseWhere, stage },
        });
        return { stage, count };
      })
    );

    // Get leads for each stage (limited for performance)
    const stageLeads = await Promise.all(
      STAGES.map(async (stage) => {
        const leads = await db.lead.findMany({
          where: { ...baseWhere, stage },
          orderBy: { updatedAt: 'desc' },
          take: 20, // Limit per stage for pipeline view
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            source: true,
            stage: true,
            status: true,
            primaryConcern: true,
            treatmentInterest: true,
            consultationDate: true,
            createdAt: true,
            updatedAt: true,
            assignedTo: {
              select: { id: true, firstName: true, lastName: true },
            },
            _count: {
              select: { tasks: { where: { status: 'PENDING' } } },
            },
          },
        });
        return { stage, leads };
      })
    );

    // Calculate summary stats
    const totalLeads = stageCounts.reduce((sum, s) => sum + s.count, 0);
    const lostCount = stageCounts.find((s) => s.stage === 'LOST')?.count || 0;
    const acceptedCount = stageCounts.find((s) => s.stage === 'TREATMENT_ACCEPTED')?.count || 0;
    const startedCount = stageCounts.find((s) => s.stage === 'TREATMENT_STARTED')?.count || 0;

    // Get recent conversions (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentConversions = await db.lead.count({
      where: {
        ...getClinicFilter(session),
        status: 'CONVERTED',
        convertedAt: { gte: thirtyDaysAgo },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        stages: stageLeads.map((sl) => ({
          ...sl,
          count: stageCounts.find((sc) => sc.stage === sl.stage)?.count || 0,
        })),
        summary: {
          total: totalLeads,
          byStage: Object.fromEntries(stageCounts.map((s) => [s.stage, s.count])),
          conversionRate: totalLeads > 0
            ? Math.round(((acceptedCount + startedCount) / (totalLeads - lostCount)) * 100)
            : 0,
          lostRate: totalLeads > 0 ? Math.round((lostCount / totalLeads) * 100) : 0,
          recentConversions,
        },
      },
    });
  },
  { permissions: ['leads:view', 'leads:edit', 'leads:full'] }
);
