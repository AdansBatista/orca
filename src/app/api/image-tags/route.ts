import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createImageTagSchema } from '@/lib/validations/imaging';

/**
 * GET /api/image-tags
 * List all image tags (system + clinic-specific)
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;

    // Get system tags (clinicId = null) and clinic-specific ones
    const where: Record<string, unknown> = {
      OR: [
        { clinicId: null }, // System tags
        getClinicFilter(session), // Clinic-specific
      ],
    };

    if (category) {
      where.category = category;
    }

    const tags = await db.imageTag.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    // Add usage count for easier display
    const tagsWithCount = tags.map((tag) => ({
      ...tag,
      usageCount: tag._count.assignments,
    }));

    return NextResponse.json({
      success: true,
      data: tagsWithCount,
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * POST /api/image-tags
 * Create a new image tag
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    const result = createImageTagSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid tag data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check for duplicate name within clinic
    const existing = await db.imageTag.findFirst({
      where: {
        name: result.data.name,
        OR: [
          { clinicId: null },
          getClinicFilter(session),
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DUPLICATE',
            message: 'A tag with this name already exists',
          },
        },
        { status: 400 }
      );
    }

    const tag = await db.imageTag.create({
      data: {
        ...result.data,
        clinicId: session.user.clinicId,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'ImageTag',
      entityId: tag.id,
      details: {
        name: tag.name,
        category: tag.category,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: tag },
      { status: 201 }
    );
  },
  { permissions: ['imaging:admin'] }
);
