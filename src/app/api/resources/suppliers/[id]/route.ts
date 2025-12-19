import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateSupplierSchema } from '@/lib/validations/equipment';

/**
 * GET /api/resources/suppliers/:id
 * Get a single supplier by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    const supplier = await db.supplier.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        _count: {
          select: {
            equipment: true,
            maintenanceRecords: true,
            repairRecords: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Supplier not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: supplier,
    });
  },
  { permissions: ['equipment:read'] }
);

/**
 * PUT /api/resources/suppliers/:id
 * Update a supplier
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    // Find the existing supplier
    const existing = await db.supplier.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Supplier not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input
    const result = updateSupplierSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid supplier data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate code if being changed
    if (data.code && data.code !== existing.code) {
      const duplicateCode = await db.supplier.findFirst({
        where: withSoftDelete({
          clinicId: session.user.clinicId,
          code: data.code,
          id: { not: id },
        }),
      });

      if (duplicateCode) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_CODE',
              message: 'A supplier with this code already exists',
            },
          },
          { status: 409 }
        );
      }
    }

    // Update the supplier
    const supplier = await db.supplier.update({
      where: { id },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'Supplier',
      entityId: supplier.id,
      details: {
        code: supplier.code,
        name: supplier.name,
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: supplier,
    });
  },
  { permissions: ['equipment:update'] }
);

/**
 * DELETE /api/resources/suppliers/:id
 * Soft delete a supplier
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, { params }) => {
    const { id } = await params;

    // Find the existing supplier
    const existing = await db.supplier.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        _count: {
          select: {
            equipment: true,
            maintenanceRecords: true,
            repairRecords: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Supplier not found',
          },
        },
        { status: 404 }
      );
    }

    // Check for associations
    if (existing._count.equipment > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_EQUIPMENT',
            message: 'Cannot delete supplier with associated equipment. Remove equipment associations first.',
            details: { equipmentCount: existing._count.equipment },
          },
        },
        { status: 400 }
      );
    }

    // Soft delete the supplier
    await db.supplier.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'Supplier',
      entityId: existing.id,
      details: {
        code: existing.code,
        name: existing.name,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['equipment:delete'] }
);
