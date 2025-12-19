import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createSurveySchema, surveyQuerySchema } from '@/lib/validations/surveys';

/**
 * GET /api/surveys
 * List surveys
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const result = surveyQuerySchema.safeParse({
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      pageSize: searchParams.get('pageSize') || 20,
    });

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

    const { category, status, search, page, pageSize } = result.data;
    const skip = (page - 1) * pageSize;
    const clinicId = session.user.clinicId;

    // Build where clause
    const where: Prisma.SurveyWhereInput = {
      clinicId,
      deletedAt: null,
    };

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [surveys, total] = await Promise.all([
      db.survey.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          _count: {
            select: { responses: true },
          },
        },
      }),
      db.survey.count({ where }),
    ]);

    // Transform to include response count
    const items = surveys.map((survey) => ({
      ...survey,
      responseCount: survey._count.responses,
      _count: undefined,
    }));

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
  { permissions: ['survey:view'] }
);

/**
 * POST /api/surveys
 * Create a new survey
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json().catch(() => ({}));

    const result = createSurveySchema.safeParse(body);
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
    const clinicId = session.user.clinicId;

    const survey = await db.survey.create({
      data: {
        clinicId,
        title: data.title,
        description: data.description,
        category: data.category,
        isAnonymous: data.isAnonymous ?? false,
        allowMultiple: data.allowMultiple ?? false,
        requiresAuth: data.requiresAuth ?? false,
        questions: data.questions as Prisma.InputJsonValue,
        logoUrl: data.logoUrl,
        primaryColor: data.primaryColor,
        thankYouMessage: data.thankYouMessage,
        status: data.status || 'DRAFT',
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        createdBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'Survey',
      entityId: survey.id,
      details: {
        title: survey.title,
        category: survey.category,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: survey,
      },
      { status: 201 }
    );
  },
  { permissions: ['survey:create'] }
);
