import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { completeVisitRecordSchema } from '@/lib/validations/treatment';

/**
 * POST /api/visit-records/[id]/complete
 * Complete a visit record
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = completeVisitRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid completion data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify visit record exists
    const existingRecord = await db.visitRecord.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existingRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Visit record not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot complete already completed or cancelled visits
    if (existingRecord.status === 'COMPLETE') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALREADY_COMPLETE',
            message: 'Visit record is already complete',
          },
        },
        { status: 400 }
      );
    }

    if (existingRecord.status === 'CANCELLED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VISIT_CANCELLED',
            message: 'Cannot complete a cancelled visit',
          },
        },
        { status: 400 }
      );
    }

    // Get staff profile for completedBy
    const staffProfile = await db.staffProfile.findFirst({
      where: {
        userId: session.user.id,
      },
    });

    // Calculate treatment duration if check-in/check-out times are available
    let treatmentDuration = existingRecord.treatmentDuration;
    if (existingRecord.checkInTime && !treatmentDuration) {
      const checkOut = existingRecord.checkOutTime ?? new Date();
      treatmentDuration = Math.round(
        (checkOut.getTime() - existingRecord.checkInTime.getTime()) / 60000
      );
    }

    // Complete the visit record
    const visitRecord = await db.visitRecord.update({
      where: { id },
      data: {
        status: 'COMPLETE',
        visitSummary: data.visitSummary,
        nextVisitRecommendation: data.nextVisitRecommendation,
        checkOutTime: existingRecord.checkOutTime ?? new Date(),
        treatmentDuration,
        completedAt: new Date(),
        completedById: staffProfile?.id,
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
            title: true,
          },
        },
        completedBy: {
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
      entity: 'VisitRecord',
      entityId: visitRecord.id,
      details: {
        patientId: visitRecord.patientId,
        action: 'COMPLETED',
        treatmentDuration,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: visitRecord });
  },
  { permissions: ['treatment:update'] }
);
