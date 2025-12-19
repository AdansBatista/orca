import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateProcedureRecordSchema } from '@/lib/validations/treatment';

/**
 * GET /api/procedures/[id]
 * Get a single procedure record
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const procedure = await db.procedureRecord.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        progressNote: {
          select: {
            id: true,
            noteDate: true,
            noteType: true,
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

    if (!procedure) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROCEDURE_NOT_FOUND',
            message: 'Procedure record not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: procedure });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/procedures/[id]
 * Update a procedure record
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateProcedureRecordSchema.safeParse(body);
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

    // Verify procedure exists
    const existingProcedure = await db.procedureRecord.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingProcedure) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROCEDURE_NOT_FOUND',
            message: 'Procedure record not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Update procedure
    const procedure = await db.procedureRecord.update({
      where: { id },
      data,
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
      action: 'UPDATE',
      entity: 'ProcedureRecord',
      entityId: id,
      details: {
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: procedure });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/procedures/[id]
 * Delete a procedure record
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Verify procedure exists
    const existingProcedure = await db.procedureRecord.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingProcedure) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROCEDURE_NOT_FOUND',
            message: 'Procedure record not found',
          },
        },
        { status: 404 }
      );
    }

    // Hard delete (no soft delete field on this model)
    await db.procedureRecord.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ProcedureRecord',
      entityId: id,
      details: {
        procedureCode: existingProcedure.procedureCode,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['treatment:delete'] }
);
