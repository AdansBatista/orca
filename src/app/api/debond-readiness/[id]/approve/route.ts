import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { approveDebondReadinessSchema } from '@/lib/validations/treatment';

/**
 * POST /api/debond-readiness/[id]/approve
 * Approve a debond readiness assessment
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = approveDebondReadinessSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid approval data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Find existing record
    const existing = await db.debondReadiness.findFirst({
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
            message: 'Debond readiness assessment not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if already approved
    if (existing.approvedById) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_APPROVED',
            message: 'This assessment has already been approved',
          },
        },
        { status: 400 }
      );
    }

    // Check if assessment indicates ready
    if (!existing.isReady) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_READY',
            message: 'Cannot approve an assessment that is not marked as ready',
          },
        },
        { status: 400 }
      );
    }

    // Get staff profile for approvedBy
    const staffProfile = await db.staffProfile.findFirst({
      where: { userId: session.user.id },
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'STAFF_NOT_FOUND',
            message: 'Staff profile not found for current user',
          },
        },
        { status: 400 }
      );
    }

    // Approve the assessment
    const debondReadiness = await db.debondReadiness.update({
      where: { id },
      data: {
        approvedById: staffProfile.id,
        approvedDate: new Date(),
        approvalNotes: data.approvalNotes,
        scheduledDebondDate: data.scheduledDebondDate ?? existing.scheduledDebondDate,
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
            planNumber: true,
            status: true,
          },
        },
        assessedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'DebondReadiness',
      entityId: debondReadiness.id,
      details: {
        action: 'APPROVED',
        patientId: debondReadiness.patientId,
        treatmentPlanId: debondReadiness.treatmentPlanId,
        scheduledDebondDate: debondReadiness.scheduledDebondDate,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: debondReadiness });
  },
  { permissions: ['treatment:update'] }
);
