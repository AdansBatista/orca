import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import {
  createCephAnalysisSchema,
  cephAnalysisListQuerySchema,
} from '@/lib/validations/imaging';

/**
 * GET /api/imaging/ceph-analyses
 * List cephalometric analyses with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      patientId: searchParams.get('patientId') ?? undefined,
      imageId: searchParams.get('imageId') ?? undefined,
      presetId: searchParams.get('presetId') ?? undefined,
      isComplete: searchParams.get('isComplete') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      pageSize: searchParams.get('pageSize') ?? undefined,
      sortBy: searchParams.get('sortBy') ?? undefined,
      sortOrder: searchParams.get('sortOrder') ?? undefined,
    };

    const queryResult = cephAnalysisListQuerySchema.safeParse(rawParams);

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
      patientId,
      imageId,
      presetId,
      isComplete,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = {
      ...getClinicFilter(session),
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (imageId) {
      where.imageId = imageId;
    }

    if (presetId) {
      where.presetId = presetId;
    }

    if (isComplete !== undefined) {
      where.isComplete = isComplete === 'true';
    }

    // Get total count
    const total = await db.cephAnalysis.count({ where });

    // Build sort order
    const orderBy: Record<string, string> = {};
    orderBy[sortBy] = sortOrder;

    // Get paginated results
    const analyses = await db.cephAnalysis.findMany({
      where,
      orderBy,
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
        image: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            thumbnailUrl: true,
            category: true,
          },
        },
        createdBy: {
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
        items: analyses,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * POST /api/imaging/ceph-analyses
 * Create a new cephalometric analysis
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const validationResult = createCephAnalysisSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const {
      patientId,
      imageId,
      presetId,
      landmarks,
      measurements,
      calibration,
      notes,
      summary,
      isComplete,
    } = validationResult.data;

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

    // Verify image exists and belongs to patient/clinic
    const image = await db.patientImage.findFirst({
      where: withSoftDelete({
        id: imageId,
        patientId,
        ...getClinicFilter(session),
      }),
    });

    if (!image) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Image not found',
          },
        },
        { status: 404 }
      );
    }

    // Get staff profile ID
    const staffProfile = await db.staffProfile.findFirst({
      where: {
        userId: session.user.id,
        clinicId: session.user.clinicId,
      },
    });

    if (!staffProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Staff profile not found',
          },
        },
        { status: 403 }
      );
    }

    // Create the analysis
    const analysis = await db.cephAnalysis.create({
      data: {
        clinicId: session.user.clinicId,
        patientId,
        imageId,
        presetId,
        landmarks,
        measurements,
        calibration,
        notes,
        summary,
        isComplete,
        createdById: staffProfile.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        image: {
          select: {
            id: true,
            fileName: true,
            fileUrl: true,
            thumbnailUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: analysis,
      },
      { status: 201 }
    );
  },
  { permissions: ['imaging:cephalometric'] }
);
