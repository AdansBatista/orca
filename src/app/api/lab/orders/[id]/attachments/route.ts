import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createLabOrderAttachmentSchema } from '@/lib/validations/lab';

/**
 * GET /api/lab/orders/[id]/attachments
 * List attachments for a lab order
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: orderId } = await context.params;

    // Verify order exists and belongs to clinic
    const order = await db.labOrder.findFirst({
      where: withSoftDelete({
        id: orderId,
        ...getClinicFilter(session),
      }),
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Lab order not found',
          },
        },
        { status: 404 }
      );
    }

    const attachments = await db.labOrderAttachment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
      include: {
        patientImage: {
          select: {
            id: true,
            fileName: true,
            category: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: attachments,
    });
  },
  { permissions: ['lab:track'] }
);

/**
 * POST /api/lab/orders/[id]/attachments
 * Add an attachment to a lab order
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: orderId } = await context.params;
    const body = await req.json();

    // Validate input
    const result = createLabOrderAttachmentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid attachment data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify order exists and belongs to clinic
    const order = await db.labOrder.findFirst({
      where: withSoftDelete({
        id: orderId,
        ...getClinicFilter(session),
      }),
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Lab order not found',
          },
        },
        { status: 404 }
      );
    }

    // Create the attachment
    const attachment = await db.labOrderAttachment.create({
      data: {
        orderId,
        fileName: data.fileName,
        fileType: data.fileType,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        storageKey: data.storageKey,
        source: data.source,
        patientImageId: data.patientImageId,
        description: data.description,
        uploadedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'LabOrderAttachment',
      entityId: attachment.id,
      details: {
        orderId,
        fileName: attachment.fileName,
        fileType: attachment.fileType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: attachment }, { status: 201 });
  },
  { permissions: ['lab:create_order'] }
);

/**
 * DELETE /api/lab/orders/[id]/attachments
 * Delete an attachment from a lab order
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id: orderId } = await context.params;
    const { searchParams } = new URL(req.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_ATTACHMENT_ID',
            message: 'Attachment ID is required',
          },
        },
        { status: 400 }
      );
    }

    // Verify order exists and belongs to clinic
    const order = await db.labOrder.findFirst({
      where: withSoftDelete({
        id: orderId,
        ...getClinicFilter(session),
      }),
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Lab order not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify attachment belongs to this order
    const attachment = await db.labOrderAttachment.findFirst({
      where: {
        id: attachmentId,
        orderId,
      },
    });

    if (!attachment) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ATTACHMENT_NOT_FOUND',
            message: 'Attachment not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the attachment
    await db.labOrderAttachment.delete({
      where: { id: attachmentId },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'LabOrderAttachment',
      entityId: attachmentId,
      details: {
        orderId,
        fileName: attachment.fileName,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['lab:create_order'] }
);
