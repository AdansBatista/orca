import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

import { db } from '@/lib/db';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { getStorage } from '@/lib/storage';
import { uploadQuerySchema, imageListQuerySchema } from '@/lib/validations/imaging';

/**
 * GET /api/images
 * List images with filtering and pagination
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const queryResult = imageListQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

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

    const query = queryResult.data;
    const skip = (query.page - 1) * query.pageSize;

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = withSoftDelete({
      ...getClinicFilter(session),
    });

    if (query.patientId) where.patientId = query.patientId;
    if (query.category) where.category = query.category;
    if (query.subcategory) where.subcategory = query.subcategory;
    if (query.appointmentId) where.appointmentId = query.appointmentId;
    if (query.treatmentPlanId) where.treatmentPlanId = query.treatmentPlanId;
    if (query.treatmentPhaseId) where.treatmentPhaseId = query.treatmentPhaseId;
    if (query.protocolId) where.protocolId = query.protocolId;
    if (query.visibleToPatient) {
      where.visibleToPatient = query.visibleToPatient === 'true';
    }

    // Tag filter
    if (query.tagId) {
      where.tags = {
        some: { tagId: query.tagId },
      };
    }

    // Date range filter
    if (query.startDate || query.endDate) {
      where.captureDate = {};
      if (query.startDate) where.captureDate.gte = new Date(query.startDate);
      if (query.endDate) where.captureDate.lte = new Date(query.endDate);
    }

    // Search filter
    if (query.search) {
      where.OR = [
        { fileName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await db.patientImage.count({ where });

    // Get images
    const images = await db.patientImage.findMany({
      where,
      skip,
      take: query.pageSize,
      orderBy: { [query.sortBy]: query.sortOrder },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        treatmentPhase: {
          select: {
            id: true,
            phaseNumber: true,
            phaseName: true,
            phaseType: true,
            status: true,
          },
        },
        treatmentPlan: {
          select: {
            id: true,
            planName: true,
            planNumber: true,
          },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    // Transform results
    const items = images.map((img) => ({
      ...img,
      tags: img.tags.map((ta) => ta.tag),
    }));

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.ceil(total / query.pageSize),
      },
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * POST /api/images
 * Upload one or more images
 * Accepts multipart/form-data with files
 */
export const POST = withAuth(
  async (req, session) => {
    try {
      const formData = await req.formData();
      const files = formData.getAll('files') as File[];

      if (files.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NO_FILES',
              message: 'No files provided',
            },
          },
          { status: 400 }
        );
      }

      // Parse metadata from form data
      const rawParams = {
        patientId: formData.get('patientId') as string,
        category: formData.get('category') as string,
        subcategory: (formData.get('subcategory') as string) || undefined,
        protocolId: (formData.get('protocolId') as string) || undefined,
        protocolSlotId: (formData.get('protocolSlotId') as string) || undefined,
        appointmentId: (formData.get('appointmentId') as string) || undefined,
        treatmentPlanId: (formData.get('treatmentPlanId') as string) || undefined,
        captureDate: (formData.get('captureDate') as string) || undefined,
        visibleToPatient: (formData.get('visibleToPatient') as string) || 'false',
      };

      const queryResult = uploadQuerySchema.safeParse(rawParams);

      if (!queryResult.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid upload parameters',
              details: queryResult.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const params = queryResult.data;

      // Verify patient exists and belongs to clinic
      const patient = await db.patient.findFirst({
        where: withSoftDelete({
          id: params.patientId,
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

      // Get staff profile for the current user
      const staffProfile = await db.staffProfile.findFirst({
        where: {
          userId: session.user.id,
          ...getClinicFilter(session),
        },
      });

      if (!staffProfile) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'STAFF_NOT_FOUND',
              message: 'Staff profile not found for current user',
            },
          },
          { status: 400 }
        );
      }

      const storage = getStorage();
      const uploadedImages = [];

      // Supported MIME types for 3D models
      const MODEL_3D_MIME_TYPES = [
        'model/stl',
        'application/sla',
        'application/vnd.ms-pki.stl',
        'application/x-navistyle',
        'model/x.stl-ascii',
        'model/x.stl-binary',
        'application/octet-stream', // STL files often have this
      ];

      // Supported file extensions for 3D models
      const MODEL_3D_EXTENSIONS = ['.stl', '.ply', '.obj'];

      // Supported MIME types for DICOM
      const DICOM_MIME_TYPES = [
        'application/dicom',
        'application/x-dicom',
      ];

      // Supported file extensions for DICOM
      const DICOM_EXTENSIONS = ['.dcm', '.dicom'];

      for (const file of files) {
        // Check if file is a valid type (image, 3D model, or DICOM)
        const fileExt = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
        const isImage = file.type.startsWith('image/');
        const is3DModel =
          MODEL_3D_MIME_TYPES.includes(file.type) ||
          MODEL_3D_EXTENSIONS.includes(fileExt);
        const isDicom =
          DICOM_MIME_TYPES.includes(file.type) ||
          DICOM_EXTENSIONS.includes(fileExt);

        if (!isImage && !is3DModel && !isDicom) {
          continue; // Skip unsupported files
        }

        // Generate unique filename
        const extension = file.name.split('.').pop() || 'jpg';
        const uniqueId = randomUUID();
        const storagePath = `${session.user.clinicId}/${params.patientId}/${uniqueId}.${extension}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to storage (only generate thumbnail for images)
        const uploadResult = await storage.upload(buffer, storagePath, {
          mimeType: file.type,
          generateThumbnail: isImage,
          thumbnailWidth: 300,
        });

        // Create database record
        const patientImage = await db.patientImage.create({
          data: {
            clinicId: session.user.clinicId,
            patientId: params.patientId,
            fileName: file.name,
            fileUrl: uploadResult.url,
            thumbnailUrl: uploadResult.thumbnailUrl,
            fileSize: uploadResult.fileSize,
            mimeType: uploadResult.mimeType,
            category: params.category,
            subcategory: params.subcategory,
            captureDate: params.captureDate ? new Date(params.captureDate) : null,
            capturedById: staffProfile.id,
            appointmentId: params.appointmentId,
            treatmentPlanId: params.treatmentPlanId,
            protocolId: params.protocolId,
            protocolSlotId: params.protocolSlotId,
            visibleToPatient: params.visibleToPatient === 'true',
            createdById: staffProfile.id,
          },
          include: {
            tags: {
              include: {
                tag: true,
              },
            },
          },
        });

        uploadedImages.push(patientImage);
      }

      // Audit log
      const { ipAddress, userAgent } = getRequestMeta(req);
      await logAudit(session, {
        action: 'CREATE',
        entity: 'PatientImage',
        entityId: uploadedImages.map((img) => img.id).join(','),
        details: {
          patientId: params.patientId,
          category: params.category,
          count: uploadedImages.length,
          fileNames: uploadedImages.map((img) => img.fileName),
        },
        ipAddress,
        userAgent,
      });

      return NextResponse.json(
        {
          success: true,
          data: uploadedImages,
        },
        { status: 201 }
      );
    } catch (error) {
      console.error('Image upload error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: 'Failed to upload images',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:upload'] }
);
