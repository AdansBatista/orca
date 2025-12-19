import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateComplianceLogSchema } from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/compliance-logs/[id]
 * Get a single compliance log by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const log = await db.complianceLog.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!log) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOG_NOT_FOUND',
            message: 'Compliance log not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: log });
  },
  { permissions: ['sterilization:read'] }
);

/**
 * PUT /api/resources/sterilization/compliance-logs/[id]
 * Update a compliance log
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Check if log exists
    const existingLog = await db.complianceLog.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingLog) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOG_NOT_FOUND',
            message: 'Compliance log not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input
    const result = updateComplianceLogSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid compliance log data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Update the log
    const log = await db.complianceLog.update({
      where: { id },
      data: {
        ...data,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ComplianceLog',
      entityId: log.id,
      details: {
        logType: log.logType,
        title: log.title,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: log });
  },
  { permissions: ['sterilization:update'] }
);

/**
 * DELETE /api/resources/sterilization/compliance-logs/[id]
 * Delete a compliance log
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const existingLog = await db.complianceLog.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingLog) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'LOG_NOT_FOUND',
            message: 'Compliance log not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the log
    await db.complianceLog.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ComplianceLog',
      entityId: id,
      details: {
        logType: existingLog.logType,
        title: existingLog.title,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['sterilization:delete'] }
);
