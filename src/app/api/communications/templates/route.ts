import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDeleteAnd, SOFT_DELETE_FILTER } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createTemplateSchema,
  templateQuerySchema,
} from '@/lib/validations/communications';

/**
 * GET /api/communications/templates
 * List message templates with filtering and pagination
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query params
    const result = templateQuerySchema.safeParse({
      category: searchParams.get('category') || undefined,
      isActive: searchParams.get('isActive') || undefined,
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

    const { category, isActive, search, page, pageSize } = result.data;

    // Build base conditions using soft delete helper
    const conditions: Record<string, unknown>[] = [getClinicFilter(session)];

    if (category) {
      conditions.push({ category });
    }

    if (isActive !== undefined) {
      conditions.push({ isActive });
    }

    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // Use soft delete helper which handles MongoDB null/unset correctly
    const where = withSoftDeleteAnd(conditions);

    // Count total
    const total = await db.messageTemplate.count({ where });

    // Fetch templates
    const templates = await db.messageTemplate.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      success: true,
      data: {
        items: templates,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['comms:view_inbox'] }
);

/**
 * POST /api/communications/templates
 * Create a new message template
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = createTemplateSchema.safeParse(body);
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
    const clinicId = session.user.clinicId;

    // Check for duplicate name (using soft delete filter)
    const existing = await db.messageTemplate.findFirst({
      where: {
        clinicId,
        name: data.name,
        ...SOFT_DELETE_FILTER,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE_NAME',
            message: 'A template with this name already exists',
          },
        },
        { status: 400 }
      );
    }

    // Create template
    const template = await db.messageTemplate.create({
      data: {
        clinicId,
        name: data.name,
        description: data.description,
        category: data.category,
        smsBody: data.smsBody,
        emailSubject: data.emailSubject,
        emailBody: data.emailBody,
        emailHtmlBody: data.emailHtmlBody,
        pushTitle: data.pushTitle,
        pushBody: data.pushBody,
        inAppTitle: data.inAppTitle,
        inAppBody: data.inAppBody,
        variables: data.variables || [],
        isActive: data.isActive,
        createdBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'MessageTemplate',
      entityId: template.id,
      details: {
        name: template.name,
        category: template.category,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: template,
    });
  },
  { permissions: ['comms:manage_templates'] }
);
