import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateFormSubmissionSchema } from '@/lib/validations/forms';

/**
 * GET /api/forms/submissions/[id]
 * Get a single form submission by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const submission = await db.formSubmission.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        template: true,
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!submission) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Form submission not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: submission,
    });
  },
  { permissions: ['forms:view', 'forms:edit', 'forms:full'] }
);

/**
 * PUT /api/forms/submissions/[id]
 * Update a form submission
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateFormSubmissionSchema.safeParse(body);
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

    // Check if submission exists
    const existing = await db.formSubmission.findFirst({
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
            code: 'NOT_FOUND',
            message: 'Form submission not found',
          },
        },
        { status: 404 }
      );
    }

    // Don't allow editing completed submissions
    if (existing.status === 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Cannot edit completed form submissions',
          },
        },
        { status: 403 }
      );
    }

    const data = result.data;
    const isCompleting = data.status === 'COMPLETED';

    // Update submission
    const submission = await db.formSubmission.update({
      where: { id },
      data: {
        ...(data.responses !== undefined && { responses: data.responses as Prisma.InputJsonValue }),
        ...(data.status !== undefined && { status: data.status }),
        ...(isCompleting && { completedAt: new Date() }),
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
      action: 'UPDATE',
      entity: 'FormSubmission',
      entityId: id,
      details: {
        statusChange: isCompleting ? 'COMPLETED' : undefined,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: submission,
    });
  },
  { permissions: ['forms:edit', 'forms:full'] }
);

/**
 * DELETE /api/forms/submissions/[id]
 * Delete a form submission
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Check if submission exists
    const existing = await db.formSubmission.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        template: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Form submission not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete submission
    await db.formSubmission.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'FormSubmission',
      entityId: id,
      details: {
        templateName: existing.template.name,
        leadId: existing.leadId,
        patientId: existing.patientId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['forms:full'] }
);
