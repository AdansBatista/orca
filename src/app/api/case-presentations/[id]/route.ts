import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateCasePresentationSchema } from '@/lib/validations/treatment';

/**
 * GET /api/case-presentations/[id]
 * Get a single case presentation
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const presentation = await db.casePresentation.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            planName: true,
            status: true,
            treatmentOptions: {
              where: { deletedAt: null },
              orderBy: { optionNumber: 'asc' },
            },
          },
        },
        presentedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    if (!presentation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CASE_PRESENTATION_NOT_FOUND',
            message: 'Case presentation not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: presentation });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/case-presentations/[id]
 * Update a case presentation
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateCasePresentationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid case presentation data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify presentation exists
    const existingPresentation = await db.casePresentation.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existingPresentation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CASE_PRESENTATION_NOT_FOUND',
            message: 'Case presentation not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Update presentation
    const presentation = await db.casePresentation.update({
      where: { id },
      data: {
        ...(data.presentationDate !== undefined && { presentationDate: data.presentationDate }),
        ...(data.presentedById !== undefined && { presentedById: data.presentedById }),
        ...(data.presentationType !== undefined && { presentationType: data.presentationType }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.attendees !== undefined && { attendees: data.attendees }),
        ...(data.guardianPresent !== undefined && { guardianPresent: data.guardianPresent }),
        ...(data.guardianName !== undefined && { guardianName: data.guardianName }),
        ...(data.treatmentOptionsPresented !== undefined && { treatmentOptionsPresented: data.treatmentOptionsPresented }),
        ...(data.visualsUsed !== undefined && { visualsUsed: data.visualsUsed }),
        ...(data.materialsProvided !== undefined && { materialsProvided: data.materialsProvided }),
        ...(data.outcome !== undefined && { outcome: data.outcome }),
        ...(data.outcomeNotes !== undefined && { outcomeNotes: data.outcomeNotes }),
        ...(data.patientQuestions !== undefined && { patientQuestions: data.patientQuestions }),
        ...(data.patientConcerns !== undefined && { patientConcerns: data.patientConcerns }),
        ...(data.followUpRequired !== undefined && { followUpRequired: data.followUpRequired }),
        ...(data.followUpDate !== undefined && { followUpDate: data.followUpDate }),
        ...(data.followUpNotes !== undefined && { followUpNotes: data.followUpNotes }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        presentedBy: {
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
      entity: 'CasePresentation',
      entityId: id,
      details: {
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: presentation });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/case-presentations/[id]
 * Soft delete a case presentation
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Verify presentation exists
    const existingPresentation = await db.casePresentation.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existingPresentation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CASE_PRESENTATION_NOT_FOUND',
            message: 'Case presentation not found',
          },
        },
        { status: 404 }
      );
    }

    // Soft delete
    await db.casePresentation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'CasePresentation',
      entityId: id,
      details: {
        treatmentPlanId: existingPresentation.treatmentPlanId,
        patientId: existingPresentation.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['treatment:delete'] }
);
