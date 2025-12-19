import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createRecordsRequestSchema,
  recordsRequestQuerySchema,
} from '@/lib/validations/records-requests';

/**
 * GET /api/records-requests
 * List records requests with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const query = {
      search: searchParams.get('search') || undefined,
      direction: searchParams.get('direction') || undefined,
      status: searchParams.get('status') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
      sortBy: searchParams.get('sortBy') || 'createdAt',
      sortOrder: searchParams.get('sortOrder') || 'desc',
    };

    // Validate query params
    const result = recordsRequestQuerySchema.safeParse(query);
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

    const { search, direction, status, patientId, page, pageSize, sortBy, sortOrder } =
      result.data;

    // Build where clause
    const where = withSoftDelete({
      ...getClinicFilter(session),
      ...(direction && { direction }),
      ...(status && { status }),
      ...(patientId && { patientId }),
      ...(search && {
        OR: [
          { providerName: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } },
        ],
      }),
    });

    // Get total count and items
    const [total, items] = await Promise.all([
      db.recordsRequest.count({ where }),
      db.recordsRequest.findMany({
        where,
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
          createdByUser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

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
  { permissions: ['records:view', 'records:edit', 'records:full'] }
);

/**
 * POST /api/records-requests
 * Create a new records request
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createRecordsRequestSchema.safeParse(body);
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

    const data = result.data;

    // Ensure at least patient or lead is provided
    if (!data.patientId && !data.leadId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Either patient or lead must be specified',
          },
        },
        { status: 400 }
      );
    }

    // Create records request
    const recordsRequest = await db.recordsRequest.create({
      data: {
        clinicId: session.user.clinicId,
        direction: data.direction,
        patientId: data.patientId,
        leadId: data.leadId,
        providerName: data.providerName,
        providerPhone: data.providerPhone,
        providerFax: data.providerFax,
        providerEmail: data.providerEmail,
        providerAddress: data.providerAddress,
        recordTypes: data.recordTypes,
        dateRange: data.dateRange,
        notes: data.notes,
        dueDate: data.dueDate,
        authorizationSigned: data.authorizationSigned,
        authorizationDate: data.authorizationDate,
        createdById: session.user.id,
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
      action: 'CREATE',
      entity: 'RecordsRequest',
      entityId: recordsRequest.id,
      details: {
        direction: data.direction,
        providerName: data.providerName,
        patientId: data.patientId,
        leadId: data.leadId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: recordsRequest,
      },
      { status: 201 }
    );
  },
  { permissions: ['records:edit', 'records:full'] }
);
