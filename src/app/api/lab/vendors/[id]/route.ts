import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateLabVendorSchema } from '@/lib/validations/lab';
import type { LabContractStatus } from '@prisma/client';

/**
 * GET /api/lab/vendors/[id]
 * Get a single lab vendor by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const vendor = await db.labVendor.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        contacts: {
          orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
        },
        products: {
          where: { isActive: true },
          orderBy: { name: 'asc' },
        },
        contracts: {
          where: withSoftDelete({ status: 'ACTIVE' as LabContractStatus }),
          orderBy: { endDate: 'asc' },
        },
        feeSchedules: {
          where: { isActive: true },
          orderBy: { effectiveDate: 'desc' },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
        preferenceRules: {
          where: { isActive: true },
          orderBy: { priority: 'asc' },
        },
        _count: {
          select: {
            orders: true,
            products: true,
            contracts: true,
            messages: true,
          },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VENDOR_NOT_FOUND',
            message: 'Lab vendor not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: vendor });
  },
  { permissions: ['lab:track'] }
);

/**
 * PUT /api/lab/vendors/[id]
 * Update a lab vendor
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateLabVendorSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid vendor data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check vendor exists
    const existingVendor = await db.labVendor.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existingVendor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VENDOR_NOT_FOUND',
            message: 'Lab vendor not found',
          },
        },
        { status: 404 }
      );
    }

    // If code is being changed, check for duplicates
    if (data.code && data.code !== existingVendor.code) {
      const duplicateVendor = await db.labVendor.findFirst({
        where: withSoftDelete({
          ...getClinicFilter(session),
          code: data.code,
          NOT: { id },
        }),
      });

      if (duplicateVendor) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_CODE',
              message: `A vendor with code "${data.code}" already exists`,
            },
          },
          { status: 409 }
        );
      }
    }

    // Update the vendor
    const vendor = await db.labVendor.update({
      where: { id },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
      include: {
        contacts: {
          where: { isPrimary: true },
          take: 1,
        },
        _count: {
          select: {
            orders: true,
            products: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'LabVendor',
      entityId: vendor.id,
      details: {
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: vendor });
  },
  { permissions: ['lab:manage_vendors'] }
);

/**
 * DELETE /api/lab/vendors/[id]
 * Soft delete a lab vendor
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Check vendor exists
    const existingVendor = await db.labVendor.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        _count: {
          select: {
            orders: {
              where: {
                status: {
                  notIn: ['PICKED_UP', 'CANCELLED'],
                },
              },
            },
          },
        },
      },
    });

    if (!existingVendor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VENDOR_NOT_FOUND',
            message: 'Lab vendor not found',
          },
        },
        { status: 404 }
      );
    }

    // Check for active orders
    if (existingVendor._count.orders > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VENDOR_HAS_ACTIVE_ORDERS',
            message: `Cannot delete vendor with ${existingVendor._count.orders} active orders`,
          },
        },
        { status: 409 }
      );
    }

    // Soft delete
    await db.labVendor.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'LabVendor',
      entityId: id,
      details: {
        name: existingVendor.name,
        code: existingVendor.code,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['lab:manage_vendors'] }
);
