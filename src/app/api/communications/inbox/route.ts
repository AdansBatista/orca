import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { inboxQuerySchema } from '@/lib/validations/communications';

/**
 * GET /api/communications/inbox
 * Get recent conversations (inbox view)
 * Groups messages by patient and shows most recent
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query params
    const result = inboxQuerySchema.safeParse({
      channel: searchParams.get('channel') || undefined,
      unreadOnly: searchParams.get('unreadOnly') || undefined,
      page: searchParams.get('page') || 1,
      pageSize: searchParams.get('pageSize') || 20,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { channel, unreadOnly, page, pageSize } = result.data;
    const skip = (page - 1) * pageSize;

    // Build where clause for messages
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (channel) {
      where.channel = channel;
    }

    if (unreadOnly) {
      where.readAt = null;
      where.direction = 'INBOUND';
    }

    // Get distinct patients with messages, ordered by most recent message
    // First, get all messages grouped by patient
    const recentMessages = await db.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
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
      },
    });

    // Group by patient and get the most recent message for each
    const patientConversations = new Map<
      string,
      {
        patient: {
          id: string;
          firstName: string;
          lastName: string;
          email: string | null;
          phone: string | null;
        };
        lastMessage: {
          id: string;
          channel: string;
          body: string;
          direction: string;
          status: string;
          createdAt: Date;
          readAt: Date | null;
        };
        unreadCount: number;
      }
    >();

    for (const message of recentMessages) {
      if (!patientConversations.has(message.patientId)) {
        // Count unread messages for this patient
        const unreadCount = recentMessages.filter(
          (m) =>
            m.patientId === message.patientId &&
            m.direction === 'INBOUND' &&
            m.readAt === null
        ).length;

        patientConversations.set(message.patientId, {
          patient: message.patient,
          lastMessage: {
            id: message.id,
            channel: message.channel,
            body: message.body,
            direction: message.direction,
            status: message.status,
            createdAt: message.createdAt,
            readAt: message.readAt,
          },
          unreadCount,
        });
      }
    }

    // Convert to array and paginate
    const allConversations = Array.from(patientConversations.values());
    const total = allConversations.length;
    const conversations = allConversations.slice(skip, skip + pageSize);

    // Get total unread count across all patients
    const totalUnread = await db.message.count({
      where: {
        ...getClinicFilter(session),
        direction: 'INBOUND',
        readAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: conversations,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        totalUnread,
      },
    });
  },
  { permissions: ['comms:view_inbox'] }
);
