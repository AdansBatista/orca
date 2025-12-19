import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

/**
 * POST /api/communications/messages/patient/[patientId]/read-all
 * Mark all messages from a patient as read
 */
export const POST = withAuth<{ patientId: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { patientId } = await params;

    // Verify patient exists
    const patient = await db.patient.findFirst({
      where: {
        id: patientId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: 'Patient not found',
          },
        },
        { status: 404 }
      );
    }

    // Mark all unread inbound messages as read
    const result = await db.message.updateMany({
      where: {
        patientId,
        ...getClinicFilter(session),
        direction: 'INBOUND',
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Message',
      entityId: patientId,
      details: {
        action: 'marked_all_as_read',
        patientId,
        count: result.count,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        markedAsRead: result.count,
      },
    });
  },
  { permissions: ['comms:view_inbox'] }
);
