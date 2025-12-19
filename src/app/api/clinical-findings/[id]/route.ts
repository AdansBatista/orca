import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateClinicalFindingSchema } from '@/lib/validations/treatment';

/**
 * GET /api/clinical-findings/[id]
 * Get a single clinical finding
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const finding = await db.clinicalFinding.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        progressNote: {
          select: {
            id: true,
            noteDate: true,
            noteType: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            provider: {
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

    if (!finding) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FINDING_NOT_FOUND',
            message: 'Clinical finding not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: finding });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/clinical-findings/[id]
 * Update a clinical finding
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateClinicalFindingSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid finding data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify finding exists
    const existingFinding = await db.clinicalFinding.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingFinding) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FINDING_NOT_FOUND',
            message: 'Clinical finding not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Update finding
    const finding = await db.clinicalFinding.update({
      where: { id },
      data,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ClinicalFinding',
      entityId: id,
      details: {
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: finding });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/clinical-findings/[id]
 * Delete a clinical finding
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Verify finding exists
    const existingFinding = await db.clinicalFinding.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingFinding) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FINDING_NOT_FOUND',
            message: 'Clinical finding not found',
          },
        },
        { status: 404 }
      );
    }

    // Hard delete (no soft delete field on this model)
    await db.clinicalFinding.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ClinicalFinding',
      entityId: id,
      details: {
        findingType: existingFinding.findingType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['treatment:delete'] }
);
