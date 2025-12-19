import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createProcedureRecordSchema } from '@/lib/validations/treatment';
import { z } from 'zod';

// Query schema for procedures
const procedureQuerySchema = z.object({
  progressNoteId: z.string().optional(),
  patientId: z.string().optional(),
  procedureCode: z.string().optional(),
  status: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['performedAt', 'createdAt', 'procedureCode']).default('performedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/**
 * GET /api/procedures
 * List procedure records with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      progressNoteId: searchParams.get('progressNoteId') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      procedureCode: searchParams.get('procedureCode') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      fromDate: searchParams.get('fromDate') ?? undefined,
      toDate: searchParams.get('toDate') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = procedureQuerySchema.safeParse(rawParams);

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
      patientId,
      procedureCode,
      status,
      fromDate,
      toDate,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause (no soft delete on this model)
    const where: Record<string, unknown> = getClinicFilter(session);

    if (progressNoteId) where.progressNoteId = progressNoteId;
    if (patientId) {
      where.progressNote = { patientId };
    }
    if (procedureCode) where.procedureCode = procedureCode;
    if (status) where.status = status;

    if (fromDate) {
      where.performedAt = { ...((where.performedAt as object) || {}), gte: fromDate };
    }
    if (toDate) {
      where.performedAt = { ...((where.performedAt as object) || {}), lte: toDate };
    }

    const total = await db.procedureRecord.count({ where });

    const items = await db.procedureRecord.findMany({
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
        performedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        assistedBy: {
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
 * POST /api/procedures
 * Create a new procedure record
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createProcedureRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid procedure data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify progress note exists and belongs to clinic
    if (body.progressNoteId) {
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
    }

    // Verify performer exists
    const performer = await db.staffProfile.findFirst({
      where: withSoftDelete({
        id: data.performedById,
      }),
    });

    if (!performer) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PERFORMER_NOT_FOUND',
            message: 'Performer not found',
          },
        },
        { status: 404 }
      );
    }

    // Create the procedure record
    const procedure = await db.procedureRecord.create({
      data: {
        clinicId: session.user.clinicId,
        progressNoteId: body.progressNoteId,
        procedureCode: data.procedureCode,
        procedureName: data.procedureName,
        description: data.description,
        toothNumbers: data.toothNumbers,
        quadrant: data.quadrant,
        arch: data.arch,
        performedById: data.performedById,
        assistedById: data.assistedById,
        performedAt: data.performedAt ?? new Date(),
        duration: data.duration,
        status: data.status,
        notes: data.notes,
        complications: data.complications,
      },
      include: {
        performedBy: {
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
      entity: 'ProcedureRecord',
      entityId: procedure.id,
      details: {
        procedureCode: procedure.procedureCode,
        procedureName: procedure.procedureName,
        progressNoteId: procedure.progressNoteId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: procedure }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
