import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateImageTagSchema } from '@/lib/validations/imaging';

/**
 * GET /api/image-tags/[id]
 * Get a single tag
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    const tag = await db.imageTag.findFirst({
      where: {
        id,
        OR: [
          { clinicId: null },
          getClinicFilter(session),
        ],
      },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tag not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...tag,
        usageCount: tag._count.assignments,
      },
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * PUT /api/image-tags/[id]
 * Update a tag
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Find the tag (only allow editing clinic-specific tags)
    const existingTag = await db.imageTag.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingTag) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tag not found or is a system tag that cannot be edited',
          },
        },
        { status: 404 }
      );
    }

    const result = updateImageTagSchema.safeParse(body);

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

    // Check for duplicate name if name is being changed
    if (result.data.name && result.data.name !== existingTag.name) {
      const duplicate = await db.imageTag.findFirst({
        where: {
          name: result.data.name,
          id: { not: id },
          OR: [
            { clinicId: null },
            getClinicFilter(session),
          ],
        },
      });

      if (duplicate) {
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
    }

    const tag = await db.imageTag.update({
      where: { id },
      data: result.data,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'ImageTag',
      entityId: id,
      details: {
        name: tag.name,
        updates: Object.keys(result.data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: tag,
    });
  },
  { permissions: ['imaging:admin'] }
);

/**
 * DELETE /api/image-tags/[id]
 * Delete a tag
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;

    // Find the tag (only allow deleting clinic-specific tags)
    const tag = await db.imageTag.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
    });

    if (!tag) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Tag not found or is a system tag that cannot be deleted',
          },
        },
        { status: 404 }
      );
    }

    // Warn if tag is in use (but allow deletion - assignments will cascade)
    const wasInUse = tag._count.assignments > 0;

    // Delete assignments first (cascade should handle this, but being explicit)
    await db.imageTagAssignment.deleteMany({
      where: { tagId: id },
    });

    // Delete the tag
    await db.imageTag.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'ImageTag',
      entityId: id,
      details: {
        name: tag.name,
        wasInUse,
        assignmentCount: tag._count.assignments,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['imaging:admin'] }
);
