import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateLabContractSchema } from '@/lib/validations/lab';

/**
 * GET /api/lab/contracts/[id]
 * Get a specific contract
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const contract = await db.labContract.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true, status: true },
        },
      },
    });

    if (!contract) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTRACT_NOT_FOUND',
            message: 'Contract not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: contract });
  },
  { permissions: ['lab:view'] }
);

/**
 * PUT /api/lab/contracts/[id]
 * Update a contract
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    const result = updateLabContractSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid contract data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const existing = await db.labContract.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTRACT_NOT_FOUND',
            message: 'Contract not found',
          },
        },
        { status: 404 }
      );
    }

    const contract = await db.labContract.update({
      where: { id },
      data: {
        ...result.data,
        updatedAt: new Date(),
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'LabContract',
      entityId: contract.id,
      details: { name: contract.name, changes: Object.keys(result.data) },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: contract });
  },
  { permissions: ['lab:manage_vendors'] }
);

/**
 * DELETE /api/lab/contracts/[id]
 * Soft delete a contract
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const existing = await db.labContract.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CONTRACT_NOT_FOUND',
            message: 'Contract not found',
          },
        },
        { status: 404 }
      );
    }

    await db.labContract.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'LabContract',
      entityId: id,
      details: { name: existing.name },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { deleted: true } });
  },
  { permissions: ['lab:manage_vendors'] }
);
