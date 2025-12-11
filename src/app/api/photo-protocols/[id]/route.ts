import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updatePhotoProtocolSchema, createProtocolSlotSchema } from '@/lib/validations/imaging';

/**
 * GET /api/photo-protocols/[id]
 * Get a single photo protocol with slots
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const protocol = await db.photoProtocol.findFirst({
      where: {
        id,
        OR: [
          { clinicId: null }, // System protocol
          getClinicFilter(session), // Clinic-specific
        ],
      },
      include: {
        slots: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { images: true },
        },
      },
    });

    if (!protocol) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Protocol not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: protocol,
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * PUT /api/photo-protocols/[id]
 * Update a photo protocol
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Find the protocol (only allow editing clinic-specific protocols)
    const existingProtocol = await db.photoProtocol.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!existingProtocol) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Protocol not found or is a system protocol that cannot be edited',
          },
        },
        { status: 404 }
      );
    }

    const result = updatePhotoProtocolSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid protocol data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults for this clinic
    if (result.data.isDefault) {
      await db.photoProtocol.updateMany({
        where: {
          ...getClinicFilter(session),
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const protocol = await db.photoProtocol.update({
      where: { id },
      data: result.data,
      include: {
        slots: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'PhotoProtocol',
      entityId: id,
      details: {
        name: protocol.name,
        updates: Object.keys(result.data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: protocol,
    });
  },
  { permissions: ['imaging:admin'] }
);

/**
 * DELETE /api/photo-protocols/[id]
 * Delete a photo protocol
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Find the protocol (only allow deleting clinic-specific protocols)
    const protocol = await db.photoProtocol.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        _count: {
          select: { images: true },
        },
      },
    });

    if (!protocol) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Protocol not found or is a system protocol that cannot be deleted',
          },
        },
        { status: 404 }
      );
    }

    // Prevent deletion if images are associated
    if (protocol._count.images > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'IN_USE',
            message: `Cannot delete protocol with ${protocol._count.images} associated images`,
          },
        },
        { status: 400 }
      );
    }

    // Delete slots first (cascade should handle this, but being explicit)
    await db.photoProtocolSlot.deleteMany({
      where: { protocolId: id },
    });

    // Delete the protocol
    await db.photoProtocol.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'PhotoProtocol',
      entityId: id,
      details: {
        name: protocol.name,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  },
  { permissions: ['imaging:admin'] }
);

/**
 * POST /api/photo-protocols/[id]
 * Add a slot to a protocol
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Find the protocol (only allow editing clinic-specific protocols)
    const protocol = await db.photoProtocol.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        slots: true,
      },
    });

    if (!protocol) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Protocol not found or is a system protocol that cannot be edited',
          },
        },
        { status: 404 }
      );
    }

    const result = createProtocolSlotSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid slot data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Create the slot
    const slot = await db.photoProtocolSlot.create({
      data: {
        ...result.data,
        protocolId: id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'PhotoProtocolSlot',
      entityId: slot.id,
      details: {
        protocolId: id,
        name: slot.name,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: slot },
      { status: 201 }
    );
  },
  { permissions: ['imaging:admin'] }
);
