import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateArticleSchema, deliverContentSchema } from '@/lib/validations/content';

/**
 * GET /api/content/articles/[id]
 * Get a single article
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const clinicId = session.user.clinicId;

    const article = await db.contentArticle.findFirst({
      where: {
        id,
        OR: [{ clinicId }, { clinicId: null }],
        deletedAt: null,
      },
      include: {
        _count: {
          select: { deliveries: true },
        },
      },
    });

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Article not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...article,
        deliveryCount: article._count.deliveries,
        _count: undefined,
      },
    });
  },
  { permissions: ['content:view'] }
);

/**
 * PUT /api/content/articles/[id]
 * Update an article
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const clinicId = session.user.clinicId;

    const result = updateArticleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid article data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Find the article (only clinic-owned articles can be edited)
    const existing = await db.contentArticle.findFirst({
      where: {
        id,
        clinicId, // Only allow editing own clinic's content
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Article not found or not editable',
          },
        },
        { status: 404 }
      );
    }

    // If publishing, set publishedAt
    const publishedAt =
      data.status === 'PUBLISHED' && existing.status !== 'PUBLISHED'
        ? new Date()
        : existing.publishedAt;

    const article = await db.contentArticle.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        summary: data.summary,
        body: data.body,
        featuredImage: data.featuredImage,
        videoUrl: data.videoUrl,
        category: data.category,
        tags: data.tags,
        treatmentTypes: data.treatmentTypes,
        treatmentPhases: data.treatmentPhases,
        ageGroups: data.ageGroups,
        languages: data.languages,
        status: data.status,
        publishedAt,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ContentArticle',
      entityId: article.id,
      details: {
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: article,
    });
  },
  { permissions: ['content:update'] }
);

/**
 * DELETE /api/content/articles/[id]
 * Soft delete an article
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const clinicId = session.user.clinicId;

    const existing = await db.contentArticle.findFirst({
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
            message: 'Article not found',
          },
        },
        { status: 404 }
      );
    }

    await db.contentArticle.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ContentArticle',
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
  { permissions: ['content:delete'] }
);

/**
 * POST /api/content/articles/[id]
 * Deliver content to a patient
 */
export const POST = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const clinicId = session.user.clinicId;

    const result = deliverContentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid delivery data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { patientId, method } = result.data;

    // Verify article exists
    const article = await db.contentArticle.findFirst({
      where: {
        id,
        OR: [{ clinicId }, { clinicId: null }],
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Article not found or not published',
          },
        },
        { status: 404 }
      );
    }

    // Verify patient exists
    const patient = await db.patient.findFirst({
      where: {
        id: patientId,
        clinicId,
        deletedAt: null,
      },
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: 'Patient not found',
          },
        },
        { status: 404 }
      );
    }

    // Create delivery record
    const delivery = await db.contentDelivery.create({
      data: {
        clinicId,
        articleId: id,
        patientId,
        method,
        triggeredBy: 'manual',
        sentBy: session.user.id,
      },
    });

    // Increment share count
    await db.contentArticle.update({
      where: { id },
      data: { shareCount: { increment: 1 } },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ContentDelivery',
      entityId: delivery.id,
      details: {
        articleId: id,
        patientId,
        method,
      },
      ipAddress,
      userAgent,
    });

    // TODO: Trigger actual delivery via messaging service based on method

    return NextResponse.json({
      success: true,
      data: delivery,
    });
  },
  { permissions: ['content:deliver'] }
);
