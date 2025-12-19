import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createFAQSchema, faqQuerySchema } from '@/lib/validations/content';

/**
 * GET /api/content/faqs
 * List FAQ items
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const result = faqQuerySchema.safeParse({
      category: searchParams.get('category') || undefined,
      isFeatured: searchParams.get('isFeatured') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || 1,
      pageSize: searchParams.get('pageSize') || 50,
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

    const { category, isFeatured, search, page, pageSize } = result.data;
    const skip = (page - 1) * pageSize;
    const clinicId = session.user.clinicId;

    // Build where clause - include clinic-specific and global FAQs
    const where: Prisma.FAQItemWhereInput = {
      OR: [{ clinicId }, { clinicId: null }],
      isActive: true,
    };

    if (category) {
      where.category = category;
    }

    if (isFeatured !== undefined) {
      where.isFeatured = isFeatured;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { question: { contains: search, mode: 'insensitive' } },
            { answer: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const [faqs, total] = await Promise.all([
      db.fAQItem.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: pageSize,
      }),
      db.fAQItem.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: faqs,
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
 * POST /api/content/faqs
 * Create a new FAQ item
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json().catch(() => ({}));

    const result = createFAQSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid FAQ data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;
    const clinicId = session.user.clinicId;

    const faq = await db.fAQItem.create({
      data: {
        clinicId,
        question: data.question,
        answer: data.answer,
        category: data.category,
        tags: data.tags || [],
        sortOrder: data.sortOrder || 0,
        isFeatured: data.isFeatured || false,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'FAQItem',
      entityId: faq.id,
      details: {
        question: faq.question.substring(0, 100),
        category: faq.category,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: faq,
      },
      { status: 201 }
    );
  },
  { permissions: ['content:create'] }
);
