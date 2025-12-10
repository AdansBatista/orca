import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createFormTemplateSchema,
  formTemplateQuerySchema,
} from '@/lib/validations/forms';

/**
 * GET /api/forms/templates
 * List form templates with filtering
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);
    const query = {
      search: searchParams.get('search') || undefined,
      type: searchParams.get('type') || undefined,
      category: searchParams.get('category') || undefined,
      isActive: searchParams.get('isActive') || undefined,
      page: searchParams.get('page') || '1',
      pageSize: searchParams.get('pageSize') || '20',
    };

    // Validate query params
    const result = formTemplateQuerySchema.safeParse(query);
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

    const { search, type, category, isActive, page, pageSize } = result.data;

    // Build where clause - include clinic-specific and global templates
    const where: Prisma.FormTemplateWhereInput = {
      OR: [{ clinicId: session.user.clinicId }, { clinicId: null }],
      ...(type && { type }),
      ...(category && { category }),
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };

    // Get total count and items
    const [total, items] = await Promise.all([
      db.formTemplate.count({ where }),
      db.formTemplate.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
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
 * POST /api/forms/templates
 * Create a new form template
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createFormTemplateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid form template data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Create form template
    const template = await db.formTemplate.create({
      data: {
        clinicId: session.user.clinicId,
        name: data.name,
        description: data.description,
        type: data.type,
        category: data.category,
        schema: data.schema as Prisma.InputJsonValue,
        isActive: data.isActive,
        isRequired: data.isRequired,
        sortOrder: data.sortOrder,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'FormTemplate',
      entityId: template.id,
      details: {
        name: data.name,
        type: data.type,
        category: data.category,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: template,
      },
      { status: 201 }
    );
  },
  { permissions: ['forms:edit', 'forms:full'] }
);
