import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { createPhotoProtocolSchema } from '@/lib/validations/imaging';

/**
 * GET /api/photo-protocols
 * List all photo protocols (system + clinic-specific)
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    // Get system protocols (clinicId = null) and clinic-specific ones
    const where: Record<string, unknown> = {
      OR: [
        { clinicId: null }, // System defaults
        getClinicFilter(session), // Clinic-specific
      ],
    };

    if (activeOnly) {
      where.isActive = true;
    }

    const protocols = await db.photoProtocol.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
      include: {
        slots: {
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { images: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: protocols,
    });
  },
  { permissions: ['imaging:view'] }
);

/**
 * POST /api/photo-protocols
 * Create a new photo protocol
 */
export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();

    const result = createPhotoProtocolSchema.safeParse(body);

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

    const { slots, ...protocolData } = result.data;

    // If setting as default, unset other defaults for this clinic
    if (protocolData.isDefault) {
      await db.photoProtocol.updateMany({
        where: getClinicFilter(session),
        data: { isDefault: false },
      });
    }

    // Create protocol with slots
    const protocol = await db.photoProtocol.create({
      data: {
        ...protocolData,
        clinicId: session.user.clinicId,
        slots: slots
          ? {
              create: slots.map((slot, index) => ({
                ...slot,
                sortOrder: slot.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: {
        slots: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'CREATE',
      entity: 'PhotoProtocol',
      entityId: protocol.id,
      details: {
        name: protocol.name,
        slotsCount: protocol.slots.length,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { success: true, data: protocol },
      { status: 201 }
    );
  },
  { permissions: ['imaging:admin'] }
);
