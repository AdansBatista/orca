/**
 * Content Delivery API
 *
 * GET /api/content/deliveries - List content deliveries
 * POST /api/content/deliveries - Deliver content to patient(s)
 *
 * Handles manual and batch content delivery operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { getContentDeliveryService } from '@/lib/services/content-delivery';
import { deliveryMethodSchema } from '@/lib/validations/content';

// Query schema for listing deliveries
const deliveryQuerySchema = z.object({
  patientId: z.string().optional(),
  articleId: z.string().optional(),
  method: deliveryMethodSchema.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

// Schema for batch delivery
const batchDeliverySchema = z.object({
  articleId: z.string().min(1, 'Article ID is required'),
  patientIds: z.array(z.string()).min(1, 'At least one patient is required'),
  method: deliveryMethodSchema,
  personalMessage: z.string().max(500).optional(),
});

/**
 * GET /api/content/deliveries
 * List content deliveries with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const result = deliveryQuerySchema.safeParse({
      patientId: searchParams.get('patientId') || undefined,
      articleId: searchParams.get('articleId') || undefined,
      method: searchParams.get('method') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
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

    const { patientId, articleId, method, startDate, endDate, page, pageSize } = result.data;
    const skip = (page - 1) * pageSize;
    const clinicId = session.user.clinicId;

    // Build where clause
    const where: Record<string, unknown> = {
      clinicId,
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (articleId) {
      where.articleId = articleId;
    }

    if (method) {
      where.method = method;
    }

    if (startDate || endDate) {
      where.deliveredAt = {
        ...(startDate && { gte: new Date(startDate) }),
        ...(endDate && { lte: new Date(endDate) }),
      };
    }

    const [deliveries, total] = await Promise.all([
      db.contentDelivery.findMany({
        where,
        include: {
          article: {
            select: {
              id: true,
              title: true,
              category: true,
              slug: true,
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
        orderBy: { deliveredAt: 'desc' },
        skip,
        take: pageSize,
      }),
      db.contentDelivery.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: deliveries.map((d) => ({
          id: d.id,
          articleId: d.articleId,
          articleTitle: d.article.title,
          articleCategory: d.article.category,
          patientId: d.patientId,
          patientName: `${d.patient.firstName} ${d.patient.lastName}`,
          method: d.method,
          triggeredBy: d.triggeredBy,
          deliveredAt: d.deliveredAt,
          viewedAt: d.viewedAt,
        })),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['content:view'] }
);

/**
 * POST /api/content/deliveries
 * Deliver content to one or more patients
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json().catch(() => ({}));

    const result = batchDeliverySchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid delivery request',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { articleId, patientIds, method, personalMessage } = result.data;
    const clinicId = session.user.clinicId;

    // Verify article exists
    const article = await db.contentArticle.findFirst({
      where: {
        id: articleId,
        OR: [{ clinicId }, { clinicId: null }],
        status: 'PUBLISHED',
        deletedAt: null,
      },
      select: { id: true, title: true },
    });

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ARTICLE_NOT_FOUND',
            message: 'Article not found or not published',
          },
        },
        { status: 404 }
      );
    }

    // Verify all patients exist
    const patients = await db.patient.findMany({
      where: {
        id: { in: patientIds },
        clinicId,
        deletedAt: null,
      },
      select: { id: true },
    });

    const validPatientIds = patients.map((p) => p.id);
    const invalidPatientIds = patientIds.filter((id) => !validPatientIds.includes(id));

    if (invalidPatientIds.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENTS_NOT_FOUND',
            message: `Some patients were not found: ${invalidPatientIds.join(', ')}`,
          },
        },
        { status: 400 }
      );
    }

    // Perform batch delivery
    const service = getContentDeliveryService();
    const deliveryResult = await service.deliverBatch(
      clinicId,
      {
        articleId,
        patientIds: validPatientIds,
        method,
        personalMessage,
      },
      session.user.id
    );

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ContentDelivery',
      entityId: articleId,
      details: {
        articleTitle: article.title,
        patientCount: validPatientIds.length,
        method,
        sent: deliveryResult.sent,
        failed: deliveryResult.failed,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        articleId,
        articleTitle: article.title,
        method,
        sent: deliveryResult.sent,
        failed: deliveryResult.failed,
        results: deliveryResult.results.map((r) => ({
          patientId: r.patientId,
          success: r.success,
          deliveryId: r.deliveryId,
          error: r.error,
        })),
      },
    });
  },
  { permissions: ['content:deliver'] }
);
