import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import {
  updateInstrumentSetSchema,
  updateInstrumentSetStatusSchema,
} from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/instrument-sets/[id]
 * Get a single instrument set by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const instrumentSet = await db.instrumentSet.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!instrumentSet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SET_NOT_FOUND',
            message: 'Instrument set not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: instrumentSet });
  },
  { permissions: ['sterilization:read'] }
);

/**
 * PUT /api/resources/sterilization/instrument-sets/[id]
 * Update an instrument set
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Check if set exists
    const existingSet = await db.instrumentSet.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existingSet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SET_NOT_FOUND',
            message: 'Instrument set not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input
    const result = updateInstrumentSetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid instrument set data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate set number if it's being changed
    if (data.setNumber && data.setNumber !== existingSet.setNumber) {
      const duplicateSet = await db.instrumentSet.findFirst({
        where: {
          clinicId: session.user.clinicId,
          setNumber: data.setNumber,
          deletedAt: null,
          NOT: { id },
        },
      });

      if (duplicateSet) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_SET_NUMBER',
              message: 'An instrument set with this set number already exists',
            },
          },
          { status: 409 }
        );
      }
    }

    // Update the instrument set
    const instrumentSet = await db.instrumentSet.update({
      where: { id },
      data: {
        ...data,
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'InstrumentSet',
      entityId: instrumentSet.id,
      details: {
        setNumber: instrumentSet.setNumber,
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: instrumentSet });
  },
  { permissions: ['sterilization:update'] }
);

/**
 * PATCH /api/resources/sterilization/instrument-sets/[id]
 * Update the status of an instrument set (quick status change)
 */
export const PATCH = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Check if set exists
    const existingSet = await db.instrumentSet.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existingSet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SET_NOT_FOUND',
            message: 'Instrument set not found',
          },
        },
        { status: 404 }
      );
    }

    // Validate input
    const result = updateInstrumentSetStatusSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid status data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status: data.status,
      currentLocation: data.currentLocation ?? existingSet.currentLocation,
      notes: data.notes ?? existingSet.notes,
      updatedBy: session.user.id,
    };

    // Update tracking fields based on status change
    if (data.status === 'IN_USE' && existingSet.status !== 'IN_USE') {
      updateData.lastUsedAt = new Date();
      updateData.useCount = existingSet.useCount + 1;
    }
    if (data.status === 'AVAILABLE' && existingSet.status === 'PROCESSING') {
      updateData.lastSterilizedAt = new Date();
      updateData.sterilizationCount = existingSet.sterilizationCount + 1;
    }

    // Update the instrument set
    const instrumentSet = await db.instrumentSet.update({
      where: { id },
      data: updateData,
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'InstrumentSet',
      entityId: instrumentSet.id,
      details: {
        setNumber: instrumentSet.setNumber,
        previousStatus: existingSet.status,
        newStatus: instrumentSet.status,
        action: 'StatusChange',
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: instrumentSet });
  },
  { permissions: ['sterilization:update'] }
);

/**
 * DELETE /api/resources/sterilization/instrument-sets/[id]
 * Soft delete an instrument set
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const existingSet = await db.instrumentSet.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
        deletedAt: null,
      },
    });

    if (!existingSet) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'SET_NOT_FOUND',
            message: 'Instrument set not found',
          },
        },
        { status: 404 }
      );
    }

    // Soft delete
    const instrumentSet = await db.instrumentSet.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'InstrumentSet',
      entityId: instrumentSet.id,
      details: {
        setNumber: instrumentSet.setNumber,
        name: instrumentSet.name,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['sterilization:delete'] }
);
