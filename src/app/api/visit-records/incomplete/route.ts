import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { z } from 'zod';

const incompleteQuerySchema = z.object({
  primaryProviderId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * GET /api/visit-records/incomplete
 * Get incomplete visit records for follow-up
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      primaryProviderId: searchParams.get('primaryProviderId') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = incompleteQuerySchema.safeParse(rawParams);

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

    const { primaryProviderId, page, pageSize } = queryResult.data;

    // Build where clause - only incomplete and in-progress visits
    const where: Record<string, unknown> = withSoftDelete({
      ...getClinicFilter(session),
      status: { in: ['IN_PROGRESS', 'INCOMPLETE'] },
    });

    if (primaryProviderId) {
      where.primaryProviderId = primaryProviderId;
    }

    const total = await db.visitRecord.count({ where });

    const items = await db.visitRecord.findMany({
      where,
      orderBy: [{ status: 'asc' }, { visitDate: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        primaryProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            planNumber: true,
            planName: true,
          },
        },
      },
    });

    // Add missing documentation info
    const itemsWithMissingInfo = items.map((item) => {
      const missingDocumentation: string[] = [];

      if (!item.progressNoteId) {
        missingDocumentation.push('Progress Note');
      }
      if (!item.visitSummary) {
        missingDocumentation.push('Visit Summary');
      }
      if (item.procedureIds.length === 0) {
        missingDocumentation.push('Procedures');
      }

      return {
        ...item,
        missingDocumentation,
        daysSinceVisit: Math.floor(
          (Date.now() - new Date(item.visitDate).getTime()) / (1000 * 60 * 60 * 24)
        ),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        items: itemsWithMissingInfo,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['treatment:read'] }
);
