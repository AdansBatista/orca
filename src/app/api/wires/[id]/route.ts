import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateWireRecordSchema } from '@/lib/validations/treatment';

/**
 * GET /api/wires/[id]
 * Get a single wire record
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const wire = await db.wireRecord.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        applianceRecord: {
          select: {
            id: true,
            applianceType: true,
            applianceSystem: true,
            arch: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        placedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        removedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
      },
    });

    if (!wire) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WIRE_NOT_FOUND',
            message: 'Wire record not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: wire });
  },
  { permissions: ['treatment:read'] }
);

/**
 * PUT /api/wires/[id]
 * Update a wire record
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateWireRecordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid wire data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify wire exists
    const existingWire = await db.wireRecord.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingWire) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WIRE_NOT_FOUND',
            message: 'Wire record not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // Update wire
    const wire = await db.wireRecord.update({
      where: { id },
      data,
      include: {
        applianceRecord: {
          select: {
            id: true,
            applianceType: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        placedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        removedBy: {
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
      entity: 'WireRecord',
      entityId: id,
      details: {
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: wire });
  },
  { permissions: ['treatment:update'] }
);

/**
 * DELETE /api/wires/[id]
 * Delete a wire record
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Verify wire exists
    const existingWire = await db.wireRecord.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingWire) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'WIRE_NOT_FOUND',
            message: 'Wire record not found',
          },
        },
        { status: 404 }
      );
    }

    // Hard delete (no soft delete field on this model)
    await db.wireRecord.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'WireRecord',
      entityId: id,
      details: {
        wireType: existingWire.wireType,
        wireSize: existingWire.wireSize,
        applianceRecordId: existingWire.applianceRecordId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['treatment:delete'] }
);
