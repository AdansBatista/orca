import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createLabOrderSchema,
  labOrderQuerySchema,
} from '@/lib/validations/lab';
import type { Prisma } from '@prisma/client';

/**
 * Generate order number for a clinic
 */
async function generateOrderNumber(clinicId: string): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `LAB-${year}-`;

  // Get the highest order number for this clinic and year
  const lastOrder = await db.labOrder.findFirst({
    where: {
      clinicId,
      orderNumber: { startsWith: prefix },
    },
    orderBy: { orderNumber: 'desc' },
    select: { orderNumber: true },
  });

  let nextNumber = 1;
  if (lastOrder?.orderNumber) {
    const lastNumber = parseInt(lastOrder.orderNumber.replace(prefix, ''), 10);
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1;
    }
  }

  return `${prefix}${String(nextNumber).padStart(4, '0')}`;
}

/**
 * GET /api/lab/orders
 * List lab orders with filtering and pagination
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      search: searchParams.get('search') ?? undefined,
      patientId: searchParams.get('patientId') ?? undefined,
      vendorId: searchParams.get('vendorId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      isRush: searchParams.get('isRush') ?? undefined,
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = labOrderQuerySchema.safeParse(rawParams);

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
      patientId,
      vendorId,
      status,
      priority,
      isRush,
      dateFrom,
      dateTo,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause with soft delete
    const where: Record<string, unknown> = withSoftDelete({
      ...getClinicFilter(session),
    });

    if (patientId) where.patientId = patientId;
    if (vendorId) where.vendorId = vendorId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (isRush !== undefined) where.isRush = isRush;

    // Date range filter
    if (dateFrom || dateTo) {
      where.orderDate = {};
      if (dateFrom) (where.orderDate as Record<string, Date>).gte = dateFrom;
      if (dateTo) (where.orderDate as Record<string, Date>).lte = dateTo;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { externalOrderId: { contains: search, mode: 'insensitive' } },
        {
          patient: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const total = await db.labOrder.count({ where });

    const items = await db.labOrder.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        items: {
          select: {
            id: true,
            productName: true,
            quantity: true,
            status: true,
          },
        },
        _count: {
          select: {
            items: true,
            attachments: true,
            shipments: true,
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
  { permissions: ['lab:track'] }
);

/**
 * POST /api/lab/orders
 * Create a new lab order
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createLabOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid order data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify patient exists and belongs to clinic
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        id: data.patientId,
        ...getClinicFilter(session),
      }),
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: 'Patient not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify vendor if provided
    if (data.vendorId) {
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

    // Generate order number
    const orderNumber = await generateOrderNumber(session.user.clinicId);

    // Create the order
    const order = await db.labOrder.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: data.patientId,
        vendorId: data.vendorId,
        orderNumber,
        status: data.status ?? 'DRAFT',
        priority: data.priority ?? 'STANDARD',
        isRush: data.isRush ?? false,
        rushLevel: data.rushLevel,
        rushReason: data.rushReason,
        neededByDate: data.neededByDate,
        treatmentPlanId: data.treatmentPlanId,
        milestoneId: data.milestoneId,
        appointmentId: data.appointmentId,
        clinicNotes: data.clinicNotes,
        createdBy: session.user.id,
        updatedBy: session.user.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        vendor: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Create initial status log
    await db.labOrderStatusLog.create({
      data: {
        orderId: order.id,
        toStatus: 'DRAFT',
        source: 'USER',
        notes: 'Order created',
        changedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'LabOrder',
      entityId: order.id,
      details: {
        orderNumber: order.orderNumber,
        patientId: order.patientId,
        vendorId: order.vendorId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: order }, { status: 201 });
  },
  { permissions: ['lab:create_order'] }
);
