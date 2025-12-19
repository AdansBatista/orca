import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { conversationQuerySchema, replyMessageSchema } from '@/lib/validations/communications';

/**
 * GET /api/communications/messages/patient/[patientId]
 * Get conversation history with a patient
 */
export const GET = withAuth<{ patientId: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { patientId } = await params;
    const { searchParams } = new URL(req.url);

    // Parse query params
    const result = conversationQuerySchema.safeParse({
      patientId,
      limit: searchParams.get('limit') || 50,
      before: searchParams.get('before') || undefined,
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

    const { limit, before } = result.data;

    // Verify patient exists
    const patient = await db.patient.findFirst({
      where: {
        id: patientId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
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

    // Build where clause
    const where: Record<string, unknown> = {
      patientId,
      ...getClinicFilter(session),
    };

    if (before) {
      where.createdAt = { lt: new Date(before) };
    }

    // Fetch messages
    const messages = await db.message.findMany({
      where,
      include: {
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Get notification preferences
    const preferences = await db.notificationPreference.findFirst({
      where: {
        patientId,
        ...getClinicFilter(session),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        patient,
        messages: messages.reverse(), // Return in chronological order
        preferences,
        hasMore: messages.length === limit,
      },
    });
  },
  { permissions: ['comms:view_inbox'] }
);

/**
 * POST /api/communications/messages/patient/[patientId]
 * Reply to a patient (quick send)
 */
export const POST = withAuth<{ patientId: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { patientId } = await params;
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = replyMessageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid message data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const clinicId = session.user.clinicId;

    // Verify patient exists and get contact info
    const patient = await db.patient.findFirst({
      where: {
        id: patientId,
        clinicId,
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
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

    // Get the last message to determine reply channel
    const lastMessage = await db.message.findFirst({
      where: {
        patientId,
        clinicId,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Default to SMS if no previous messages, otherwise use same channel
    const channel = lastMessage?.channel || 'SMS';

    // Determine recipient address
    let toAddress: string | null = null;
    if (channel === 'SMS') {
      toAddress = patient.phone || null;
      if (!toAddress) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_PHONE',
              message: 'Patient does not have a phone number',
            },
          },
          { status: 400 }
        );
      }
    } else if (channel === 'EMAIL') {
      toAddress = patient.email || null;
      if (!toAddress) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_EMAIL',
              message: 'Patient does not have an email address',
            },
          },
          { status: 400 }
        );
      }
    }

    // Create message
    const message = await db.message.create({
      data: {
        clinicId,
        patientId,
        channel,
        body: data.body,
        htmlBody: data.htmlBody,
        direction: 'OUTBOUND',
        toAddress,
        status: 'PENDING',
        replyToId: lastMessage?.id,
        conversationId: lastMessage?.conversationId || lastMessage?.id,
        createdBy: session.user.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create delivery record
    await db.messageDelivery.create({
      data: {
        messageId: message.id,
        provider: channel === 'SMS' ? 'twilio' : channel === 'EMAIL' ? 'sendgrid' : 'internal',
        status: 'PENDING',
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Message',
      entityId: message.id,
      details: {
        channel: message.channel,
        patientId: message.patientId,
        type: 'reply',
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: message,
    });
  },
  { permissions: ['comms:send_message'] }
);
