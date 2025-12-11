import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { imageListQuerySchema } from '@/lib/validations/imaging';

/**
 * GET /api/patients/[id]/images
 * List all images for a patient with filtering
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id: patientId } = await context.params;
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      patientId,
      category: searchParams.get('category') ?? undefined,
      subcategory: searchParams.get('subcategory') ?? undefined,
      tagId: searchParams.get('tagId') ?? undefined,
      appointmentId: searchParams.get('appointmentId') ?? undefined,
      treatmentPlanId: searchParams.get('treatmentPlanId') ?? undefined,
      protocolId: searchParams.get('protocolId') ?? undefined,
      startDate: searchParams.get('startDate') ?? undefined,
      endDate: searchParams.get('endDate') ?? undefined,
      visibleToPatient: searchParams.get('visibleToPatient') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = imageListQuerySchema.safeParse(rawParams);

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
      category,
      subcategory,
      tagId,
      appointmentId,
      treatmentPlanId,
      protocolId,
      startDate,
      endDate,
      visibleToPatient,
      search,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Verify patient exists and belongs to clinic
    const patient = await db.patient.findFirst({
      where: withSoftDelete({
        id: patientId,
        ...getClinicFilter(session),
      }),
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Patient not found',
          },
        },
        { status: 404 }
      );
    }

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete({
      patientId,
      ...getClinicFilter(session),
    });

    if (category) {
      where.category = category;
    }

    if (subcategory) {
      where.subcategory = subcategory;
    }

    if (appointmentId) {
      where.appointmentId = appointmentId;
    }

    if (treatmentPlanId) {
      where.treatmentPlanId = treatmentPlanId;
    }

    if (protocolId) {
      where.protocolId = protocolId;
    }

    if (visibleToPatient !== undefined) {
      where.visibleToPatient = visibleToPatient === 'true';
    }

    // Date range filter
    if (startDate || endDate) {
      where.captureDate = {};
      if (startDate) {
        (where.captureDate as Record<string, Date>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.captureDate as Record<string, Date>).lte = new Date(endDate);
      }
    }

    // Search filter (filename or description)
    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Tag filter - need to join through assignment table
    if (tagId) {
      where.tags = {
        some: {
          tagId,
        },
      };
    }

    // Get total count
    const total = await db.patientImage.count({ where });

    // Build sort order
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    // Get paginated results
    const images = await db.patientImage.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        capturedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        protocol: {
          select: {
            id: true,
            name: true,
          },
        },
        protocolSlot: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    // Flatten tags for easier consumption
    const imagesWithTags = images.map((image) => ({
      ...image,
      tags: image.tags.map((ta) => ta.tag),
    }));

    return NextResponse.json({
      success: true,
      data: {
        items: imagesWithTags,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['imaging:view'] }
);
