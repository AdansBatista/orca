import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateSurveySchema } from '@/lib/validations/surveys';

/**
 * GET /api/surveys/[id]
 * Get a single survey
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const clinicId = session.user.clinicId;

    const survey = await db.survey.findFirst({
      where: {
        id,
        clinicId,
        deletedAt: null,
      },
      include: {
        _count: {
          select: { responses: true },
        },
      },
    });

    if (!survey) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Survey not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...survey,
        responseCount: survey._count.responses,
        _count: undefined,
      },
    });
  },
  { permissions: ['survey:view'] }
);

/**
 * PUT /api/surveys/[id]
 * Update a survey
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const clinicId = session.user.clinicId;

    const result = updateSurveySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid survey data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Find the survey
    const existing = await db.survey.findFirst({
      where: {
        id,
        clinicId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Survey not found',
          },
        },
        { status: 404 }
      );
    }

    const survey = await db.survey.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        isAnonymous: data.isAnonymous,
        allowMultiple: data.allowMultiple,
        requiresAuth: data.requiresAuth,
        questions: data.questions as Prisma.InputJsonValue,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        thankYouMessage: data.thankYouMessage,
        status: data.status,
        startsAt: data.startsAt ? new Date(data.startsAt) : undefined,
        endsAt: data.endsAt ? new Date(data.endsAt) : undefined,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Survey',
      entityId: survey.id,
      details: {
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: survey,
    });
  },
  { permissions: ['survey:update'] }
);

/**
 * DELETE /api/surveys/[id]
 * Soft delete a survey
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const clinicId = session.user.clinicId;

    const existing = await db.survey.findFirst({
      where: {
        id,
        clinicId,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Survey not found',
          },
        },
        { status: 404 }
      );
    }

    await db.survey.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'Survey',
      entityId: id,
      details: {
        title: existing.title,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  },
  { permissions: ['survey:delete'] }
);
