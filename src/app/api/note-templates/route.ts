import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createNoteTemplateSchema } from '@/lib/validations/treatment';
import { z } from 'zod';

// Query schema for note templates
const templateQuerySchema = z.object({
  search: z.string().optional(),
  templateType: z.string().optional(),
  isActive: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  ),
  providerId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['templateName', 'createdAt', 'updatedAt', 'templateType']).default('templateName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/**
 * GET /api/note-templates
 * List note templates with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      templateType: searchParams.get('templateType') ?? undefined,
      isActive: searchParams.get('isActive') ?? undefined,
      providerId: searchParams.get('providerId') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = templateQuerySchema.safeParse(rawParams);

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

    const {
      search,
      templateType,
      isActive,
      providerId,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause - include clinic's templates and system templates
    const where: Record<string, unknown> = {
      OR: [
        { clinicId: session.user.clinicId },
        { clinicId: null }, // System templates
      ],
    };

    if (templateType) where.templateType = templateType;
    if (isActive !== undefined) where.isActive = isActive;
    if (providerId) where.providerId = providerId;

    if (search) {
      where.AND = [
        {
          OR: [
            { templateName: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const total = await db.noteTemplate.count({ where });

    const items = await db.noteTemplate.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

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
  { permissions: ['treatment:read'] }
);

/**
 * POST /api/note-templates
 * Create a new note template
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createNoteTemplateSchema.safeParse(body);
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

    // Create the template
    const template = await db.noteTemplate.create({
      data: {
        clinicId: session.user.clinicId,
        templateName: data.templateName,
        templateType: data.templateType,
        description: data.description,
        defaultSubjective: data.defaultSubjective,
        defaultObjective: data.defaultObjective,
        defaultAssessment: data.defaultAssessment,
        defaultPlan: data.defaultPlan,
        defaultProcedures: data.defaultProcedures,
        isActive: data.isActive,
        providerId: session.user.id,
      },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'NoteTemplate',
      entityId: template.id,
      details: {
        templateName: template.templateName,
        templateType: template.templateType,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: template }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
