import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  updateRecordsRequestSchema,
  markSentSchema,
  markReceivedSchema,
} from '@/lib/validations/records-requests';

/**
 * GET /api/records-requests/[id]
 * Get a single records request by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const recordsRequest = await db.recordsRequest.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
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
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!recordsRequest) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Records request not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: recordsRequest,
    });
  },
  { permissions: ['records:view', 'records:edit', 'records:full'] }
);

/**
 * PUT /api/records-requests/[id]
 * Update a records request
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateRecordsRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid records request data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if request exists
    const existing = await db.recordsRequest.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Records request not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Update records request
    const recordsRequest = await db.recordsRequest.update({
      where: { id },
      data: {
        ...(data.direction !== undefined && { direction: data.direction }),
        ...(data.providerName !== undefined && { providerName: data.providerName }),
        ...(data.providerPhone !== undefined && { providerPhone: data.providerPhone }),
        ...(data.providerFax !== undefined && { providerFax: data.providerFax }),
        ...(data.providerEmail !== undefined && { providerEmail: data.providerEmail }),
        ...(data.providerAddress !== undefined && { providerAddress: data.providerAddress }),
        ...(data.recordTypes !== undefined && { recordTypes: data.recordTypes }),
        ...(data.dateRange !== undefined && { dateRange: data.dateRange }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.dueDate !== undefined && { dueDate: data.dueDate }),
        ...(data.authorizationSigned !== undefined && {
          authorizationSigned: data.authorizationSigned,
        }),
        ...(data.authorizationDate !== undefined && {
          authorizationDate: data.authorizationDate,
        }),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        lead: {
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
      entity: 'RecordsRequest',
      entityId: id,
      details: {
        changes: data,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: recordsRequest,
    });
  },
  { permissions: ['records:edit', 'records:full'] }
);

/**
 * DELETE /api/records-requests/[id]
 * Soft delete a records request
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Check if request exists
    const existing = await db.recordsRequest.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Records request not found',
          },
        },
        { status: 404 }
      );
    }

    // Soft delete
    await db.recordsRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'RecordsRequest',
      entityId: id,
      details: {
        providerName: existing.providerName,
        direction: existing.direction,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['records:full'] }
);

/**
 * PATCH /api/records-requests/[id]
 * Mark request as sent or received
 */
export const PATCH = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();
    const action = body.action as 'mark_sent' | 'mark_received' | 'mark_completed';

    // Check if request exists
    const existing = await db.recordsRequest.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Records request not found',
          },
        },
        { status: 404 }
      );
    }

    let updateData: Record<string, unknown> = {};

    if (action === 'mark_sent') {
      const result = markSentSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid data',
              details: result.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      updateData = {
        status: 'SENT',
        sentAt: result.data.sentAt || new Date(),
        ...(result.data.notes && { notes: result.data.notes }),
      };
    } else if (action === 'mark_received') {
      const result = markReceivedSchema.safeParse(body);
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid data',
              details: result.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      updateData = {
        status: 'RECEIVED',
        receivedAt: result.data.receivedAt || new Date(),
        ...(result.data.notes && { notes: result.data.notes }),
      };
    } else if (action === 'mark_completed') {
      updateData = {
        status: 'COMPLETED',
      };
    } else {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ACTION',
            message: 'Invalid action. Use mark_sent, mark_received, or mark_completed',
          },
        },
        { status: 400 }
      );
    }

    const recordsRequest = await db.recordsRequest.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        lead: {
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
      entity: 'RecordsRequest',
      entityId: id,
      details: {
        action,
        newStatus: updateData.status,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: recordsRequest,
    });
  },
  { permissions: ['records:edit', 'records:full'] }
);
