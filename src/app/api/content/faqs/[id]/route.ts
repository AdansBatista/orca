import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateFAQSchema } from '@/lib/validations/content';

/**
 * GET /api/content/faqs/[id]
 * Get a single FAQ item
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const clinicId = session.user.clinicId;

    const faq = await db.fAQItem.findFirst({
      where: {
        id,
        OR: [{ clinicId }, { clinicId: null }],
      },
    });

    if (!faq) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'FAQ not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: faq,
    });
  },
  { permissions: ['content:view'] }
);

/**
 * PUT /api/content/faqs/[id]
 * Update a FAQ item
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const clinicId = session.user.clinicId;

    const result = updateFAQSchema.safeParse(body);
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

    // Find the FAQ (only clinic-owned can be edited)
    const existing = await db.fAQItem.findFirst({
      where: {
        id,
        clinicId, // Only allow editing own clinic's FAQs
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'FAQ not found or not editable',
          },
        },
        { status: 404 }
      );
    }

    const faq = await db.fAQItem.update({
      where: { id },
      data: {
        question: data.question,
        answer: data.answer,
        category: data.category,
        tags: data.tags,
        sortOrder: data.sortOrder,
        isFeatured: data.isFeatured,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'FAQItem',
      entityId: faq.id,
      details: {
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: faq,
    });
  },
  { permissions: ['content:update'] }
);

/**
 * DELETE /api/content/faqs/[id]
 * Soft delete a FAQ item (set isActive = false)
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const clinicId = session.user.clinicId;

    const existing = await db.fAQItem.findFirst({
      where: {
        id,
        clinicId,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'FAQ not found',
          },
        },
        { status: 404 }
      );
    }

    await db.fAQItem.update({
      where: { id },
      data: { isActive: false },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'FAQItem',
      entityId: id,
      details: {
        question: existing.question.substring(0, 100),
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
