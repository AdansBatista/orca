import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createLabInspectionSchema,
  InspectionResultEnum,
} from '@/lib/validations/lab';
import type { Prisma } from '@prisma/client';

const inspectionQuerySchema = z.object({
  orderId: z.string().optional(),
  result: InspectionResultEnum.optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

/**
 * GET /api/lab/inspections
 * List lab inspections with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const rawParams = {
      orderId: searchParams.get('orderId') ?? undefined,
      result: searchParams.get('result') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
    };

    const queryResult = inspectionQuerySchema.safeParse(rawParams);

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

    const { orderId, result, page, pageSize } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      clinicId: session.user.clinicId,
    };

    if (orderId) where.orderId = orderId;
    if (result) where.result = result;

    const total = await db.labInspection.count({ where });

    const items = await db.labInspection.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        orderItem: {
          select: {
            id: true,
            productName: true,
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
 * POST /api/lab/inspections
 * Create a new lab inspection
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createLabInspectionSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid inspection data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify order exists and belongs to clinic
    const order = await db.labOrder.findFirst({
      where: withSoftDelete({
        id: data.orderId,
        ...getClinicFilter(session),
      }),
    });

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Lab order not found',
          },
        },
        { status: 404 }
      );
    }

    // Verify order item exists
    const orderItem = await db.labOrderItem.findFirst({
      where: {
        id: data.orderItemId,
        orderId: data.orderId,
      },
    });

    if (!orderItem) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ORDER_ITEM_NOT_FOUND',
            message: 'Order item not found',
          },
        },
        { status: 404 }
      );
    }

    // Create the inspection
    const inspection = await db.labInspection.create({
      data: {
        clinicId: session.user.clinicId,
        orderId: data.orderId,
        orderItemId: data.orderItemId,
        result: data.result || 'PENDING',
        checklist: data.checklist as Prisma.InputJsonValue | undefined,
        notes: data.notes,
        inspectedBy: session.user.id,
      },
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        orderItem: {
          select: {
            id: true,
            productName: true,
          },
        },
      },
    });

    // Update order item status based on inspection result
    if (data.result === 'PASS' || data.result === 'PASS_WITH_NOTES') {
      await db.labOrderItem.update({
        where: { id: data.orderItemId },
        data: { status: 'ACCEPTED' },
      });
    } else if (data.result === 'FAIL_REMAKE' || data.result === 'FAIL_ADJUSTMENT') {
      await db.labOrderItem.update({
        where: { id: data.orderItemId },
        data: { status: 'REJECTED' },
      });
    }

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'LabInspection',
      entityId: inspection.id,
      details: {
        orderId: data.orderId,
        orderNumber: order.orderNumber,
        orderItemId: data.orderItemId,
        result: inspection.result,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: inspection }, { status: 201 });
  },
  { permissions: ['lab:track'] }
);
