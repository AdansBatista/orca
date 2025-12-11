import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  createAlignerDeliverySchema,
  alignerDeliveryQuerySchema,
} from '@/lib/validations/treatment';

/**
 * GET /api/aligners/[id]/deliveries
 * List deliveries for a specific aligner record
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id: alignerRecordId } = await context.params;
    const { searchParams } = new URL(req.url);

    // Verify aligner exists
    const alignerRecord = await db.alignerRecord.findFirst({
      where: {
        id: alignerRecordId,
        ...getClinicFilter(session),
      },
    });

    if (!alignerRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALIGNER_NOT_FOUND',
            message: 'Aligner record not found',
          },
        },
        { status: 404 }
      );
    }

    const rawParams = {
      alignerRecordId,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = alignerDeliveryQuerySchema.safeParse(rawParams);

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

    const { page, pageSize, sortBy, sortOrder } = queryResult.data;

    const where = {
      alignerRecordId,
      ...getClinicFilter(session),
    };

    const total = await db.alignerDelivery.count({ where });

    const items = await db.alignerDelivery.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        deliveredBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
  { permissions: ['treatment:read'] }
);

/**
 * POST /api/aligners/[id]/deliveries
 * Create a new aligner delivery
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id: alignerRecordId } = await context.params;
    const body = await req.json();

    // Verify aligner record exists
    const alignerRecord = await db.alignerRecord.findFirst({
      where: {
        id: alignerRecordId,
        ...getClinicFilter(session),
      },
    });

    if (!alignerRecord) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ALIGNER_NOT_FOUND',
            message: 'Aligner record not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input with alignerRecordId from URL
    const result = createAlignerDeliverySchema.safeParse({
      ...body,
      alignerRecordId,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid delivery data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify provider exists
    const provider = await db.staffProfile.findFirst({
      where: withSoftDelete({
        id: data.deliveredById,
      }),
    });

    if (!provider) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROVIDER_NOT_FOUND',
            message: 'Provider not found',
          },
        },
        { status: 404 }
      );
    }

    // Create the delivery
    const delivery = await db.alignerDelivery.create({
      data: {
        clinicId: session.user.clinicId,
        alignerRecordId,
        deliveryDate: data.deliveryDate,
        alignerNumberStart: data.alignerNumberStart,
        alignerNumberEnd: data.alignerNumberEnd,
        wearSchedule: data.wearSchedule,
        wearHoursPerDay: data.wearHoursPerDay,
        attachmentsPlaced: data.attachmentsPlaced,
        attachmentTeeth: data.attachmentTeeth,
        iprPerformed: data.iprPerformed,
        iprDetails: data.iprDetails,
        deliveredById: data.deliveredById,
        instructions: data.instructions,
        notes: data.notes,
      },
      include: {
        deliveredBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Update aligner record with delivery info
    const alignersInDelivery = data.alignerNumberEnd - data.alignerNumberStart + 1;
    await db.alignerRecord.update({
      where: { id: alignerRecordId },
      data: {
        alignersDelivered: { increment: alignersInDelivery },
        lastDeliveryDate: data.deliveryDate,
        currentAligner: data.alignerNumberStart,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'AlignerDelivery',
      entityId: delivery.id,
      details: {
        alignerRecordId,
        alignerRange: `${data.alignerNumberStart}-${data.alignerNumberEnd}`,
        alignersDelivered: alignersInDelivery,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: delivery }, { status: 201 });
  },
  { permissions: ['treatment:create'] }
);
