import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createClinicalFindingSchema } from '@/lib/validations/treatment';
import { z } from 'zod';

// Query schema for clinical findings
const findingQuerySchema = z.object({
  progressNoteId: z.string().optional(),
  findingType: z.string().optional(),
  severity: z.string().optional(),
  actionRequired: z.preprocess(
    (val) => val === 'true' ? true : val === 'false' ? false : undefined,
    z.boolean().optional()
  ),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'findingType', 'severity']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/clinical-findings
 * List clinical findings with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      progressNoteId: searchParams.get('progressNoteId') ?? undefined,
      findingType: searchParams.get('findingType') ?? undefined,
      severity: searchParams.get('severity') ?? undefined,
      actionRequired: searchParams.get('actionRequired') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = findingQuerySchema.safeParse(rawParams);

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
      progressNoteId,
      findingType,
      severity,
      actionRequired,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause (no soft delete on this model)
    const where: Record<string, unknown> = getClinicFilter(session);

    if (progressNoteId) where.progressNoteId = progressNoteId;
    if (findingType) where.findingType = findingType;
    if (severity) where.severity = severity;
    if (actionRequired !== undefined) where.actionRequired = actionRequired;

    const total = await db.clinicalFinding.count({ where });

    const items = await db.clinicalFinding.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        progressNote: {
          select: {
            id: true,
            noteDate: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
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
 * POST /api/clinical-findings
 * Create a new clinical finding
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createClinicalFindingSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid finding data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify progress note exists
    if (!body.progressNoteId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Progress note ID is required',
          },
        },
        { status: 400 }
      );
    }

    const progressNote = await db.progressNote.findFirst({
      where: withSoftDelete({
        id: body.progressNoteId,
        ...getClinicFilter(session),
      }),
    });

    if (!progressNote) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROGRESS_NOTE_NOT_FOUND',
            message: 'Progress note not found',
          },
        },
        { status: 404 }
      );
    }

    // Create the finding
    const finding = await db.clinicalFinding.create({
      data: {
        clinicId: session.user.clinicId,
        progressNoteId: body.progressNoteId,
        findingType: data.findingType,
        description: data.description,
        severity: data.severity,
        toothNumbers: data.toothNumbers,
        location: data.location,
        actionRequired: data.actionRequired,
        actionTaken: data.actionTaken,
        followUpRequired: data.followUpRequired,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ClinicalFinding',
      entityId: finding.id,
      details: {
        findingType: finding.findingType,
        severity: finding.severity,
        progressNoteId: finding.progressNoteId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: finding }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
