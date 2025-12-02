import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateInstrumentPackageSchema } from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/packages/:id
 * Get a single instrument package
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const pkg = await db.instrumentPackage.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        cycle: {
          select: {
            id: true,
            cycleNumber: true,
            cycleType: true,
            status: true,
            startTime: true,
            endTime: true,
            temperature: true,
            pressure: true,
            exposureTime: true,
            mechanicalPass: true,
            chemicalPass: true,
            biologicalPass: true,
          },
        },
        usages: {
          orderBy: { usedAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            usages: true,
          },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PACKAGE_NOT_FOUND',
            message: 'Instrument package not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: pkg });
  },
  { permissions: ['sterilization:read'] }
);

/**
 * PUT /api/resources/sterilization/packages/:id
 * Update an instrument package
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateInstrumentPackageSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid package data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify package exists
    const existing = await db.instrumentPackage.findFirst({
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
            code: 'PACKAGE_NOT_FOUND',
            message: 'Instrument package not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot update a used package (only status can change)
    if (existing.status === 'USED' && Object.keys(data).some(k => k !== 'status' && k !== 'notes')) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PACKAGE_ALREADY_USED',
            message: 'Cannot modify a used package',
          },
        },
        { status: 400 }
      );
    }

    // Verify instrument set if provided
    if (data.instrumentSetId) {
      const instrumentSet = await db.instrumentSet.findFirst({
        where: {
          id: data.instrumentSetId,
          clinicId: session.user.clinicId,
          deletedAt: null,
        },
      });

      if (!instrumentSet) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'INSTRUMENT_SET_NOT_FOUND',
              message: 'Instrument set not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Update the package
    const pkg = await db.instrumentPackage.update({
      where: { id },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
      include: {
        cycle: {
          select: {
            id: true,
            cycleNumber: true,
            cycleType: true,
            status: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'InstrumentPackage',
      entityId: pkg.id,
      details: {
        packageNumber: pkg.packageNumber,
        changes: data,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: pkg });
  },
  { permissions: ['sterilization:update'] }
);

/**
 * DELETE /api/resources/sterilization/packages/:id
 * Delete an instrument package
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Verify package exists
    const existing = await db.instrumentPackage.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
      include: {
        _count: {
          select: { usages: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PACKAGE_NOT_FOUND',
            message: 'Instrument package not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot delete a package with usages
    if (existing._count.usages > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PACKAGE_HAS_USAGES',
            message: 'Cannot delete a package that has been used with patients',
          },
        },
        { status: 400 }
      );
    }

    // Delete the package
    await db.instrumentPackage.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'InstrumentPackage',
      entityId: id,
      details: {
        packageNumber: existing.packageNumber,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['sterilization:delete'] }
);
