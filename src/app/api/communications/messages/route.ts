import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDeleteAnd } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { getMessagingService } from '@/lib/services/messaging';
import {
  sendMessageSchema,
  messageQuerySchema,
} from '@/lib/validations/communications';

/**
 * GET /api/communications/messages
 * List messages with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query params
    const result = messageQuerySchema.safeParse({
      patientId: searchParams.get('patientId') || undefined,
      channel: searchParams.get('channel') || undefined,
      status: searchParams.get('status') || undefined,
      direction: searchParams.get('direction') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      search: searchParams.get('search') || undefined,
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

    const { patientId, channel, status, direction, dateFrom, dateTo, search, page, pageSize } =
      result.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (channel) {
      where.channel = channel;
    }

    if (status) {
      where.status = status;
    }

    if (direction) {
      where.direction = direction;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        (where.createdAt as Record<string, Date>).gte = new Date(dateFrom);
      }
      if (dateTo) {
        (where.createdAt as Record<string, Date>).lte = new Date(dateTo);
      }
    }

    if (search) {
      where.OR = [
        { body: { contains: search, mode: 'insensitive' } },
        { subject: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Count total
    const total = await db.message.count({ where });

    // Fetch messages with patient info
    const messages = await db.message.findMany({
      where,
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
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: messages,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['comms:view_inbox'] }
);

/**
 * POST /api/communications/messages
 * Send a new message
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = sendMessageSchema.safeParse(body);
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

    // Verify patient exists (using soft delete helper)
    const patient = await db.patient.findFirst({
      where: withSoftDeleteAnd([{ id: data.patientId }, { clinicId }]),
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

    // If template specified, verify it exists (using soft delete helper)
    if (data.templateId) {
      const template = await db.messageTemplate.findFirst({
        where: withSoftDeleteAnd([
          { id: data.templateId },
          { clinicId },
          { isActive: true },
        ]),
      });

      if (!template) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'TEMPLATE_NOT_FOUND',
              message: 'Template not found or inactive',
            },
          },
          { status: 404 }
        );
      }
    }

    // Use messaging service to send
    const messagingService = getMessagingService();
    const sendResult = await messagingService.sendMessage({
      clinicId,
      patientId: data.patientId,
      channel: data.channel,
      templateId: data.templateId,
      subject: data.subject,
      body: data.body,
      htmlBody: data.htmlBody,
      variables: data.variables,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      relatedType: data.relatedType,
      relatedId: data.relatedId,
      tags: data.tags,
      createdBy: session.user.id,
    });

    if (!sendResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: sendResult.error,
        },
        { status: 400 }
      );
    }

    // Get the created message with relations for response
    const message = await db.message.findUnique({
      where: { id: sendResult.messageId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        deliveries: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Message',
      entityId: sendResult.messageId!,
      details: {
        channel: data.channel,
        patientId: data.patientId,
        status: message?.status,
        providerMessageId: sendResult.providerMessageId,
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
