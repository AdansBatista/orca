import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createFormSubmissionSchema,
  formSubmissionQuerySchema,
} from '@/lib/validations/forms';

/**
 * GET /api/forms/submissions
 * List form submissions with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const query = {
      templateId: searchParams.get('templateId') || undefined,
      leadId: searchParams.get('leadId') || undefined,
      patientId: searchParams.get('patientId') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
    };

    // Validate query params
    const result = formSubmissionQuerySchema.safeParse(query);
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

    const { templateId, leadId, patientId, status, page, pageSize } = result.data;

    // Build where clause
    const where: Prisma.FormSubmissionWhereInput = {
      ...getClinicFilter(session),
      ...(templateId && { templateId }),
      ...(leadId && { leadId }),
      ...(patientId && { patientId }),
      ...(status && { status }),
    };

    // Get total count and items
    const [total, items] = await Promise.all([
      db.formSubmission.count({ where }),
      db.formSubmission.findMany({
        where,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              type: true,
              category: true,
            },
          },
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
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
  { permissions: ['forms:view', 'forms:edit', 'forms:full'] }
);

/**
 * POST /api/forms/submissions
 * Create a new form submission (internal use)
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createFormSubmissionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid form submission data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify template exists
    const template = await db.formTemplate.findFirst({
      where: {
        id: data.templateId,
        OR: [{ clinicId: session.user.clinicId }, { clinicId: null }],
        isActive: true,
      },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Form template not found or inactive',
          },
        },
        { status: 404 }
      );
    }

    // Create form submission
    const submission = await db.formSubmission.create({
      data: {
        clinicId: session.user.clinicId,
        templateId: data.templateId,
        leadId: data.leadId,
        patientId: data.patientId,
        responses: data.responses as Prisma.InputJsonValue,
        status: data.status,
        startedAt: new Date(),
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'FormSubmission',
      entityId: submission.id,
      details: {
        templateId: data.templateId,
        templateName: template.name,
        leadId: data.leadId,
        patientId: data.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: submission,
      },
      { status: 201 }
    );
  },
  { permissions: ['forms:edit', 'forms:full'] }
);
