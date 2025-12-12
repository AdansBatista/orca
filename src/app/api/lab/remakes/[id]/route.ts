import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateRemakeRequestSchema } from '@/lib/validations/lab';

/**
 * GET /api/lab/remakes/[id]
 * Get a single remake request by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const remake = await db.remakeRequest.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        originalItem: {
          select: {
            id: true,
            productName: true,
            unitPrice: true,
            quantity: true,
          },
        },
      },
    });

    if (!remake) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REMAKE_NOT_FOUND',
            message: 'Remake request not found',
          },
        },
        { status: 404 }
      );
    }

    // Fetch related data separately since no direct relations exist
    const [originalOrder, newOrder] = await Promise.all([
      db.labOrder.findUnique({
        where: { id: remake.originalOrderId },
        select: {
          id: true,
          orderNumber: true,
          orderDate: true,
          vendorId: true,
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
              primaryEmail: true,
              primaryPhone: true,
            },
          },
        },
      }),
      remake.newOrderId
        ? db.labOrder.findUnique({
            where: { id: remake.newOrderId },
            select: {
              id: true,
              orderNumber: true,
              status: true,
              orderDate: true,
            },
          })
        : null,
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...remake,
        originalOrder,
        newOrder,
      },
    });
  },
  { permissions: ['lab:track'] }
);

/**
 * PUT /api/lab/remakes/[id]
 * Update a remake request
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateRemakeRequestSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid remake request data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check remake exists
    const existingRemake = await db.remakeRequest.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingRemake) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REMAKE_NOT_FOUND',
            message: 'Remake request not found',
          },
        },
        { status: 404 }
      );
    }

    // Check if remake can be modified
    const terminalStatuses = ['COMPLETED', 'CANCELLED'];
    if (terminalStatuses.includes(existingRemake.status)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REMAKE_CANNOT_BE_MODIFIED',
            message: `Remake request in ${existingRemake.status} status cannot be modified`,
          },
        },
        { status: 400 }
      );
    }

    // Update the remake
    const remake = await db.remakeRequest.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        originalItem: {
          select: {
            id: true,
            productName: true,
          },
        },
      },
    });

    // Fetch related order data
    const originalOrder = await db.labOrder.findUnique({
      where: { id: remake.originalOrderId },
      select: {
        id: true,
        orderNumber: true,
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
      entity: 'RemakeRequest',
      entityId: remake.id,
      details: {
        updatedFields: Object.keys(data),
        statusChanged: data.status
          ? { from: existingRemake.status, to: data.status }
          : undefined,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        ...remake,
        originalOrder,
      },
    });
  },
  { permissions: ['lab:request_remake'] }
);
