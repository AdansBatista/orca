import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createComplianceLogSchema,
  complianceLogQuerySchema,
} from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/compliance-logs
 * List compliance logs with pagination and filters
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      logType: searchParams.get('logType') ?? undefined,
      isCompliant: searchParams.get('isCompliant') ?? undefined,
      deficiencyFound: searchParams.get('deficiencyFound') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = complianceLogQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      logType,
      isCompliant,
      deficiencyFound,
      startDate,
      endDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (logType) where.logType = logType;
    if (typeof isCompliant === 'boolean') where.isCompliant = isCompliant;
    if (typeof deficiencyFound === 'boolean') where.deficiencyFound = deficiencyFound;

    // Date range filter
    if (startDate || endDate) {
      where.logDate = {};
      if (startDate) (where.logDate as Record<string, unknown>).gte = startDate;
      if (endDate) (where.logDate as Record<string, unknown>).lte = endDate;
    }

    // Get total count
    const total = await db.complianceLog.count({ where });

    // Get paginated results
    const items = await db.complianceLog.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['sterilization:read'] }
);

/**
 * POST /api/resources/sterilization/compliance-logs
 * Create a new compliance log entry
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createComplianceLogSchema.safeParse(body);
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

    // Create the compliance log
    const log = await db.complianceLog.create({
      data: {
        clinicId: session.user.clinicId,
        logType: data.logType,
        logDate: data.logDate ?? new Date(),
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        title: data.title,
        description: data.description,
        action: data.action,
        outcome: data.outcome,
        isCompliant: data.isCompliant,
        deficiencyFound: data.deficiencyFound,
        correctiveAction: data.correctiveAction,
        attachments: data.attachments,
        notes: data.notes,
        performedById: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ComplianceLog',
      entityId: log.id,
      details: {
        logType: log.logType,
        title: log.title,
        isCompliant: log.isCompliant,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: log }, { status: 201 });
  },
  { permissions: ['sterilization:create'] }
);
