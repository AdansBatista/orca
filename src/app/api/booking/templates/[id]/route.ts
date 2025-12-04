import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { updateBookingTemplateSchema } from '@/lib/validations/advanced-scheduling';

/**
 * GET /api/booking/templates/[id]
 * Get a specific booking template
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    const template = await db.bookingTemplate.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            title: true,
          },
        },
        applications: {
          orderBy: { appliedAt: 'desc' },
          take: 10,
          include: {
            provider: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Booking template not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  },
  { permissions: ['booking:read'] }
);

/**
 * PUT /api/booking/templates/[id]
 * Update a booking template
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();
    const validationResult = updateBookingTemplateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid template data',
            details: validationResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Verify template exists and belongs to clinic
    const existing = await db.bookingTemplate.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Booking template not found',
          },
        },
        { status: 404 }
      );
    }

    // If provider is being updated, verify new provider exists
    if (data.providerId) {
      const provider = await db.staffProfile.findFirst({
        where: {
          id: data.providerId,
          ...getClinicFilter(session),
          isProvider: true,
        },
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
    }

    // If setting as default, unset other defaults
    if (data.isDefault) {
      await db.bookingTemplate.updateMany({
        where: {
          id: { not: id },
          ...getClinicFilter(session),
          templateType: data.templateType ?? existing.templateType,
          providerId: data.providerId ?? existing.providerId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    // Prepare slots data - support both new blocks and legacy slots format
    const hasBlocksUpdate = data.blocks !== undefined;
    const hasSlotsUpdate = data.slots !== undefined;
    const slotsData = hasBlocksUpdate
      ? (data.blocks && data.blocks.length > 0 ? data.blocks : [])
      : hasSlotsUpdate
        ? (data.slots && data.slots.length > 0 ? data.slots : [])
        : undefined;

    // Increment version if slots/blocks are updated
    const version = (hasBlocksUpdate || hasSlotsUpdate) ? existing.version + 1 : existing.version;

    // Build update data, excluding blocks field (use slots for DB)
    const { blocks: _blocks, slots: _slots, ...restData } = data;

    // Update template
    const template = await db.bookingTemplate.update({
      where: { id },
      data: {
        ...restData,
        ...(slotsData !== undefined ? { slots: slotsData } : {}),
        version,
        updatedBy: session.user.id,
      },
      include: {
        provider: {
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
      data: template,
    });
  },
  { permissions: ['booking:write'] }
);

/**
 * DELETE /api/booking/templates/[id]
 * Delete a booking template
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    // Verify template exists and belongs to clinic
    const existing = await db.bookingTemplate.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: 'Booking template not found',
          },
        },
        { status: 404 }
      );
    }

    // Don't allow deleting if template has been used
    if (existing._count.applications > 0) {
      // Instead of deleting, mark as inactive
      await db.bookingTemplate.update({
        where: { id },
        data: {
          isActive: false,
          updatedBy: session.user.id,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id,
          deactivated: true,
          message: 'Template has been used and was deactivated instead of deleted',
        },
      });
    }

    // Delete template and its applications
    await db.templateApplication.deleteMany({
      where: { templateId: id },
    });

    await db.bookingTemplate.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: {
        id,
        deleted: true,
      },
    });
  },
  { permissions: ['booking:write'] }
);
