import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateLabProductSchema } from '@/lib/validations/lab';

/**
 * GET /api/lab/products/[id]
 * Get a single lab product by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const product = await db.labProduct.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
        feeSchedules: {
          where: { isActive: true },
          orderBy: { effectiveDate: 'desc' },
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Lab product not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  },
  { permissions: ['lab:track'] }
);

/**
 * PUT /api/lab/products/[id]
 * Update a lab product
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateLabProductSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid product data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check product exists
    const existingProduct = await db.labProduct.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Lab product not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify new vendor if provided
    if (data.vendorId && data.vendorId !== existingProduct.vendorId) {
      const vendor = await db.labVendor.findFirst({
        where: withSoftDelete({
          id: data.vendorId,
          ...getClinicFilter(session),
        }),
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
    }

    // Update the product
    const product = await db.labProduct.update({
      where: { id },
      data,
      include: {
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'LabProduct',
      entityId: product.id,
      details: {
        updatedFields: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: product });
  },
  { permissions: ['lab:manage_vendors'] }
);

/**
 * DELETE /api/lab/products/[id]
 * Soft delete a lab product
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Check product exists
    const existingProduct = await db.labProduct.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Lab product not found',
          },
        },
        { status: 404 }
      );
    }

    // Check for order history - warn but allow deletion
    const hasOrders = existingProduct._count.orderItems > 0;

    // Soft delete
    await db.labProduct.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'LabProduct',
      entityId: id,
      details: {
        name: existingProduct.name,
        hadOrders: hasOrders,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
      meta: {
        hadOrders: hasOrders,
        message: hasOrders
          ? 'Product archived. Historical order data preserved.'
          : undefined,
      },
    });
  },
  { permissions: ['lab:manage_vendors'] }
);
