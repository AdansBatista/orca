import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { updateCephAnalysisSchema } from '@/lib/validations/imaging';

/**
 * GET /api/imaging/ceph-analyses/[id]
 * Get a specific cephalometric analysis
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const analysis = await db.cephAnalysis.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        image: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            thumbnailUrl: true,
            category: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!analysis) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Cephalometric analysis not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * PATCH /api/imaging/ceph-analyses/[id]
 * Update a cephalometric analysis
 */
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    const validationResult = updateCephAnalysisSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if analysis exists and belongs to clinic
    const existing = await db.cephAnalysis.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Cephalometric analysis not found',
          },
        },
        { status: 404 }
      );
    }

    const updateData = validationResult.data;

    // Update the analysis
    const analysis = await db.cephAnalysis.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        image: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            thumbnailUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  },
  { permissions: ['imaging:cephalometric'] }
);

/**
 * DELETE /api/imaging/ceph-analyses/[id]
 * Delete a cephalometric analysis
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Check if analysis exists and belongs to clinic
    const existing = await db.cephAnalysis.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Cephalometric analysis not found',
          },
        },
        { status: 404 }
      );
    }

    // Hard delete (ceph analyses don't need soft delete)
    await db.cephAnalysis.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['imaging:cephalometric'] }
);
