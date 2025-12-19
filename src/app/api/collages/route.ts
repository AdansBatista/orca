import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';

// Validation schemas
const slotAssignmentSchema = z.record(
  z.string(),
  z.object({
    slotId: z.string(),
    imageId: z.string(),
    imageUrl: z.string(),
    thumbnailUrl: z.string().optional(),
    label: z.string().optional(),
  })
);

const createCollageSchema = z.object({
  patientId: z.string(),
  templateId: z.string(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  slotAssignments: slotAssignmentSchema,
  customizations: z.record(z.string(), z.unknown()).optional(),
  annotations: z.array(z.unknown()).optional(),
});

/**
 * GET /api/collages
 * List collages with filtering
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');
    const templateId = searchParams.get('templateId');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    const whereClause: Prisma.ImageCollageWhereInput = {
      clinicId: session.user.clinicId,
    };

    if (patientId) {
      whereClause.patientId = patientId;
    }

    if (templateId) {
      whereClause.templateId = templateId;
    }

    const [collages, total] = await Promise.all([
      db.imageCollage.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
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
          template: {
            select: {
              id: true,
              name: true,
              category: true,
              aspectRatio: true,
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
      }),
      db.imageCollage.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        items: collages,
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
 * POST /api/collages
 * Create a new collage
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const result = createCollageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid collage data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Verify patient belongs to clinic
    const patient = await db.patient.findFirst({
      where: {
        id: result.data.patientId,
        ...getClinicFilter(session),
      },
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

    // Verify template exists
    const template = await db.collageTemplate.findFirst({
      where: {
        id: result.data.templateId,
        OR: [
          { isSystem: true },
          { clinicId: session.user.clinicId },
        ],
      },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Template not found',
          },
        },
        { status: 404 }
      );
    }

    // Get staff profile
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
            message: 'Staff profile not found',
          },
        },
        { status: 400 }
      );
    }

    const collage = await db.imageCollage.create({
      data: {
        clinicId: session.user.clinicId,
        patientId: result.data.patientId,
        templateId: result.data.templateId,
        title: result.data.title,
        description: result.data.description,
        slotAssignments: result.data.slotAssignments as Prisma.InputJsonValue,
        customizations: (result.data.customizations || null) as Prisma.InputJsonValue,
        annotations: (result.data.annotations || null) as Prisma.InputJsonValue,
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
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ImageCollage',
      entityId: collage.id,
      details: {
        patientId: patient.id,
        templateId: template.id,
        title: collage.title,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: collage,
    });
  },
  { permissions: ['imaging:edit'] }
);
