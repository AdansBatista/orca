import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createLabFeeScheduleSchema } from '@/lib/validations/lab';

/**
 * GET /api/lab/pricing
 * List fee schedules for the clinic
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const vendorId = searchParams.get('vendorId');
    const productId = searchParams.get('productId');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const feeSchedules = await db.labFeeSchedule.findMany({
      where: {
        ...getClinicFilter(session),
        ...(vendorId && { vendorId }),
        ...(productId && { productId }),
        ...(activeOnly && { isActive: true }),
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
        product: {
          select: { id: true, name: true, category: true, sku: true },
        },
      },
      orderBy: [{ vendor: { name: 'asc' } }, { product: { name: 'asc' } }],
    });

    return NextResponse.json({ success: true, data: feeSchedules });
  },
  { permissions: ['lab:view'] }
);

/**
 * POST /api/lab/pricing
 * Create a new fee schedule
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const result = createLabFeeScheduleSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid fee schedule data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify vendor exists
    const vendor = await db.labVendor.findFirst({
      where: {
        id: data.vendorId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!vendor) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VENDOR_NOT_FOUND',
            message: 'Vendor not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify product exists
    const product = await db.labProduct.findFirst({
      where: {
        id: data.productId,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        },
        { status: 404 }
      );
    }

    // If creating active schedule, deactivate existing ones for same vendor/product
    if (data.isActive !== false) {
      await db.labFeeSchedule.updateMany({
        where: {
          clinicId: session.user.clinicId,
          vendorId: data.vendorId,
          productId: data.productId,
          isActive: true,
        },
        data: {
          isActive: false,
          endDate: new Date(),
        },
      });
    }

    const feeSchedule = await db.labFeeSchedule.create({
      data: {
        clinicId: session.user.clinicId,
        vendorId: data.vendorId,
        productId: data.productId,
        basePrice: data.basePrice,
        rushUpchargePercent: data.rushUpchargePercent,
        rushUpchargeFlat: data.rushUpchargeFlat,
        effectiveDate: data.effectiveDate,
        endDate: data.endDate,
        volumeDiscounts: data.volumeDiscounts,
        isActive: data.isActive ?? true,
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
        product: {
          select: { id: true, name: true, category: true },
        },
      },
    });

    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'LabFeeSchedule',
      entityId: feeSchedule.id,
      details: {
        vendorId: feeSchedule.vendorId,
        productId: feeSchedule.productId,
        basePrice: feeSchedule.basePrice,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: feeSchedule }, { status: 201 });
  },
  { permissions: ['lab:manage_vendors'] }
);
