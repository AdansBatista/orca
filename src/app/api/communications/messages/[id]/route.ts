import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';

/**
 * GET /api/communications/messages/[id]
 * Get a single message with full details
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    const message = await db.message.findFirst({
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
            email: true,
            phone: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        deliveries: {
          orderBy: { createdAt: 'desc' },
        },
        replyTo: {
          select: {
            id: true,
            body: true,
            createdAt: true,
          },
        },
        replies: {
          select: {
            id: true,
            body: true,
            direction: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!message) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Message not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: message,
    });
  },
  { permissions: ['comms:view_inbox'] }
);
