import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateTreatmentPlanSchema } from '@/lib/validations/treatment';

/**
 * GET /api/treatment-plans/[id]
 * Get a single treatment plan by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const treatmentPlan = await db.treatmentPlan.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            email: true,
            phone: true,
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
        supervisingProvider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        phases: {
          where: { deletedAt: null },
          orderBy: { phaseNumber: 'asc' },
        },
        milestones: {
          orderBy: { targetDate: 'asc' },
        },
        treatmentOptions: {
          where: { deletedAt: null },
          orderBy: { optionNumber: 'asc' },
          select: {
            id: true,
            optionNumber: true,
            optionName: true,
            description: true,
            applianceSystem: true,
            estimatedDuration: true,
            estimatedVisits: true,
            estimatedCost: true,
            isRecommended: true,
            status: true,
            advantages: true,
            disadvantages: true,
          },
        },
        casePresentations: {
          where: { deletedAt: null },
          orderBy: { presentationDate: 'desc' },
          select: {
            id: true,
            presentationDate: true,
            outcome: true,
            presentedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                title: true,
              },
            },
          },
        },
        caseAcceptances: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            acceptedDate: true,
            selectedOption: {
              select: {
                id: true,
                optionName: true,
              },
            },
          },
        },
        progressNotes: {
          where: { deletedAt: null },
          orderBy: { noteDate: 'desc' },
          take: 10,
          select: {
            id: true,
            noteDate: true,
            noteType: true,
            status: true,
            chiefComplaint: true,
            provider: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            phases: true,
            milestones: true,
            progressNotes: true,
            progressPhotos: true,
          },
        },
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

    return NextResponse.json({ success: true, data: treatmentPlan });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/treatment-plans/[id]
 * Update a treatment plan
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateTreatmentPlanSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid treatment plan data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check treatment plan exists
    const existing = await db.treatmentPlan.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
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

    // Check if plan can be modified (completed/discontinued plans may have restrictions)
    if (['COMPLETED', 'DISCONTINUED', 'TRANSFERRED'].includes(existing.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PLAN_LOCKED',
            message: `Cannot modify a ${existing.status.toLowerCase()} treatment plan`,
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify primary provider if being changed
    if (data.primaryProviderId && data.primaryProviderId !== existing.primaryProviderId) {
      const provider = await db.staffProfile.findFirst({
        where: withSoftDelete({
          id: data.primaryProviderId,
          isProvider: true,
        }),
      });

      if (!provider) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'PROVIDER_NOT_FOUND',
              message: 'Primary provider not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Update treatment plan
    const treatmentPlan = await db.treatmentPlan.update({
      where: { id },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
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
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'TreatmentPlan',
      entityId: treatmentPlan.id,
      details: {
        planNumber: treatmentPlan.planNumber,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: treatmentPlan });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/treatment-plans/[id]
 * Soft delete a treatment plan
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Check treatment plan exists
    const existing = await db.treatmentPlan.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
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

    // Only allow deletion of DRAFT plans
    if (existing.status !== 'DRAFT') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CANNOT_DELETE',
            message: 'Only draft treatment plans can be deleted. Consider discontinuing instead.',
          },
        },
        { status: 400 }
      );
    }

    // Soft delete
    await db.treatmentPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'TreatmentPlan',
      entityId: id,
      details: {
        planNumber: existing.planNumber,
        planName: existing.planName,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['treatment:delete'] }
);
