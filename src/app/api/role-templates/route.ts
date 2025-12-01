import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

const roleTemplateQuerySchema = z.object({
  category: z.string().optional(),
  isIndustryStandard: z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  isActive: z.preprocess((val) => {
    if (val === '' || val === 'all' || val === null) return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(50),
});

const createRoleTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(100).regex(/^[a-z][a-z0-9_]*$/),
  description: z.string().max(1000).optional().nullable(),
  category: z.string().min(1).max(100),
  permissions: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

/**
 * GET /api/role-templates
 * List role templates
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      category: searchParams.get('category') ?? undefined,
      isIndustryStandard: searchParams.get('isIndustryStandard') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = roleTemplateQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { category, isIndustryStandard, isActive, search, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (category) where.category = category;
    if (isIndustryStandard !== undefined) where.isIndustryStandard = isIndustryStandard;
    if (isActive !== undefined) where.isActive = isActive;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.roleTemplate.count({ where });

    // Get paginated results
    const items = await db.roleTemplate.findMany({
      where,
      orderBy: [
        { isIndustryStandard: 'desc' },
        { category: 'asc' },
        { name: 'asc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Get unique categories
    const categories = await db.roleTemplate.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category'],
    });

    return NextResponse.json({
      success: true,
      data: {
        items,
        categories: categories.map(c => c.category),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['roles:view', 'roles:edit', 'roles:full'] }
);

/**
 * POST /api/role-templates
 * Create a new role template (custom)
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    // Validate input
    const result = createRoleTemplateSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid template data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate code
    const existingByCode = await db.roleTemplate.findUnique({
      where: { code: data.code },
    });

    if (existingByCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_CODE',
            message: 'A template with this code already exists',
          },
        },
        { status: 409 }
      );
    }

    // Create the template (custom templates are not industry standard)
    const template = await db.roleTemplate.create({
      data: {
        ...data,
        isIndustryStandard: false,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'RoleTemplate',
      entityId: template.id,
      details: {
        name: template.name,
        code: template.code,
        category: template.category,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  },
  { permissions: ['roles:edit', 'roles:full'] }
);
