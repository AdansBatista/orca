import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

/**
 * POST /api/communications/messages/[id]/read
 * Mark a message as read
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    // Verify message exists and belongs to clinic
    const message = await db.message.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MESSAGE_NOT_FOUND',
            message: 'Message not found',
          },
        },
        { status: 404 }
      );
    }

    // Only mark inbound messages as read
    if (message.direction !== 'INBOUND') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_OPERATION',
            message: 'Only inbound messages can be marked as read',
          },
        },
        { status: 400 }
      );
    }

    // Already read
    if (message.readAt) {
      return NextResponse.json({
        success: true,
        data: message,
      });
    }

    // Mark as read
    const updatedMessage = await db.message.update({
      where: { id },
      data: {
        readAt: new Date(),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Message',
      entityId: id,
      details: { action: 'marked_as_read' },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: updatedMessage,
    });
  },
  { permissions: ['comms:view_inbox'] }
);
