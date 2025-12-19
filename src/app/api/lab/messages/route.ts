import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { z } from 'zod';
import { MessageDirection } from '@prisma/client';

const createLabMessageSchema = z.object({
  vendorId: z.string().min(1, 'Vendor ID is required'),
  orderId: z.string().optional().nullable(),
  subject: z.string().min(1, 'Subject is required').max(200),
  content: z.string().min(1, 'Content is required').max(5000),
});

/**
 * GET /api/lab/messages
 * List messages for the clinic
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId');
    const orderId = searchParams.get('orderId');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const where = {
      ...getClinicFilter(session),
      ...(vendorId && { vendorId }),
      ...(orderId && { orderId }),
      ...(unreadOnly && { readAt: null, direction: MessageDirection.INBOUND }),
    };

    const [messages, total] = await Promise.all([
      db.labMessage.findMany({
        where,
        include: {
          vendor: {
            select: { id: true, name: true, code: true },
          },
          order: {
            select: { id: true, orderNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.labMessage.count({ where }),
    ]);

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
  { permissions: ['lab:view'] }
);

/**
 * POST /api/lab/messages
 * Send a new message to a vendor
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const result = createLabMessageSchema.safeParse(body);
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

    // Verify vendor exists
    const vendor = await db.labVendor.findFirst({
      where: {
        id: data.vendorId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VENDOR_NOT_FOUND',
            message: 'Vendor not found',
          },
        },
        { status: 404 }
      );
    }

    // If orderId provided, verify order exists
    if (data.orderId) {
      const order = await db.labOrder.findFirst({
        where: {
          id: data.orderId,
          ...getClinicFilter(session),
          deletedAt: null,
        },
      });

      if (!order) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'ORDER_NOT_FOUND',
              message: 'Order not found',
            },
          },
          { status: 404 }
        );
      }
    }

    const message = await db.labMessage.create({
      data: {
        clinicId: session.user.clinicId,
        vendorId: data.vendorId,
        orderId: data.orderId,
        direction: 'OUTBOUND',
        subject: data.subject,
        content: data.content,
        sentBy: session.user.id,
        sentAt: new Date(),
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

    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'LabMessage',
      entityId: message.id,
      details: { vendorId: message.vendorId, subject: message.subject },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: message }, { status: 201 });
  },
  { permissions: ['lab:create_order'] }
);
