import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createArticleSchema, articleQuerySchema } from '@/lib/validations/content';

// Generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

/**
 * GET /api/content/articles
 * List educational content articles
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    const result = articleQuerySchema.safeParse({
      category: searchParams.get('category') || undefined,
      status: searchParams.get('status') || undefined,
      tag: searchParams.get('tag') || undefined,
      treatmentType: searchParams.get('treatmentType') || undefined,
      treatmentPhase: searchParams.get('treatmentPhase') || undefined,
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

    const { category, status, tag, treatmentType, treatmentPhase, search, page, pageSize } =
      result.data;
    const skip = (page - 1) * pageSize;
    const clinicId = session.user.clinicId;

    // Build where clause - include clinic-specific and global content
    const where: Prisma.ContentArticleWhereInput = {
      OR: [{ clinicId }, { clinicId: null }],
      deletedAt: null,
    };

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (tag) {
      where.tags = { has: tag };
    }

    if (treatmentType) {
      where.treatmentTypes = { has: treatmentType };
    }

    if (treatmentPhase) {
      where.treatmentPhases = { has: treatmentPhase };
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { summary: { contains: search, mode: 'insensitive' } },
            { body: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [articles, total] = await Promise.all([
      db.contentArticle.findMany({
        where,
        select: {
          id: true,
          clinicId: true,
          title: true,
          slug: true,
          summary: true,
          featuredImage: true,
          category: true,
          tags: true,
          treatmentTypes: true,
          treatmentPhases: true,
          status: true,
          publishedAt: true,
          viewCount: true,
          shareCount: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      db.contentArticle.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: articles,
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
 * POST /api/content/articles
 * Create a new educational article
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json().catch(() => ({}));

    const result = createArticleSchema.safeParse(body);
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
    const clinicId = session.user.clinicId;
    const slug = data.slug || generateSlug(data.title);

    // Check for duplicate slug
    const existing = await db.contentArticle.findFirst({
      where: {
        OR: [{ clinicId }, { clinicId: null }],
        slug,
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_SLUG',
            message: 'An article with this slug already exists',
          },
        },
        { status: 400 }
      );
    }

    const article = await db.contentArticle.create({
      data: {
        clinicId,
        title: data.title,
        slug,
        summary: data.summary,
        body: data.body,
        featuredImage: data.featuredImage,
        videoUrl: data.videoUrl,
        category: data.category,
        tags: data.tags || [],
        treatmentTypes: data.treatmentTypes || [],
        treatmentPhases: data.treatmentPhases || [],
        ageGroups: data.ageGroups || [],
        languages: data.languages || ['en'],
        status: data.status || 'DRAFT',
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        createdBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ContentArticle',
      entityId: article.id,
      details: {
        title: article.title,
        category: article.category,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: article,
      },
      { status: 201 }
    );
  },
  { permissions: ['content:create'] }
);
