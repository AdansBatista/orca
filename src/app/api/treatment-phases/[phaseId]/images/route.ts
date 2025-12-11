import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { phaseImagesQuerySchema } from '@/lib/validations/imaging';

/**
 * GET /api/treatment-phases/[phaseId]/images
 * Get all images linked to a treatment phase
 */
export const GET = withAuth(
  async (
    req: NextRequest,
    session: Session,
    { params }: { params: Promise<{ phaseId: string }> }
  ) => {
    try {
      const { phaseId } = await params;
      const { searchParams } = new URL(req.url);

      // Build query params with phaseId
      const queryParams = Object.fromEntries(searchParams.entries());
      queryParams.treatmentPhaseId = phaseId;

      // Parse and validate query
      const validation = phaseImagesQuerySchema.safeParse(queryParams);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid query parameters',
              details: validation.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const { treatmentPhaseId, category, page, pageSize, sortBy, sortOrder } =
        validation.data;
      const skip = (page - 1) * pageSize;

      // Verify phase exists and belongs to clinic
      const phase = await db.treatmentPhase.findFirst({
        where: {
          id: treatmentPhaseId,
          ...getClinicFilter(session),
        },
        include: {
          treatmentPlan: {
            select: {
              id: true,
              planName: true,
              planNumber: true,
              patientId: true,
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

      if (!phase) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PHASE_NOT_FOUND',
              message: 'Treatment phase not found',
            },
          },
          { status: 404 }
        );
      }

      // Build where clause
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = withSoftDelete({
        treatmentPhaseId,
        ...getClinicFilter(session),
      });

      if (category) {
        where.category = category;
      }

      // Get total count
      const total = await db.patientImage.count({ where });

      // Get images
      const images = await db.patientImage.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          tags: {
            include: { tag: true },
          },
        },
      });

      // Transform results
      const items = images.map((img) => ({
        ...img,
        tags: img.tags.map((ta) => ta.tag),
      }));

      return NextResponse.json({
        success: true,
        data: {
          phase: {
            id: phase.id,
            phaseNumber: phase.phaseNumber,
            phaseName: phase.phaseName,
            phaseType: phase.phaseType,
            status: phase.status,
            treatmentPlan: phase.treatmentPlan,
          },
          images: {
            items,
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize),
          },
        },
      });
    } catch (error) {
      console.error('[Phase Images API] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_ERROR',
            message: 'Failed to fetch phase images',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:view'] }
);
