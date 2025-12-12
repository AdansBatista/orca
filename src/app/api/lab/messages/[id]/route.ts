import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

/**
 * GET /api/lab/messages/[id]
 * Get a specific message
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const message = await db.labMessage.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
        order: {
          select: { id: true, orderNumber: true },
        },
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

    return NextResponse.json({ success: true, data: message });
  },
  { permissions: ['lab:view'] }
);

/**
 * PUT /api/lab/messages/[id]
 * Mark message as read
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const existing = await db.labMessage.findFirst({
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
            code: 'MESSAGE_NOT_FOUND',
            message: 'Message not found',
          },
        },
        { status: 404 }
      );
    }

    const message = await db.labMessage.update({
      where: { id },
      data: {
        readAt: existing.readAt || new Date(),
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
        order: {
          select: { id: true, orderNumber: true },
        },
      },
    });

    return NextResponse.json({ success: true, data: message });
  },
  { permissions: ['lab:view'] }
);

/**
 * DELETE /api/lab/messages/[id]
 * Delete a message
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const existing = await db.labMessage.findFirst({
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
            code: 'MESSAGE_NOT_FOUND',
            message: 'Message not found',
          },
        },
        { status: 404 }
      );
    }

    await db.labMessage.delete({
      where: { id },
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'LabMessage',
      entityId: id,
      details: { subject: existing.subject },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['lab:create_order'] }
);
