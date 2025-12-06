import { NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete, SOFT_DELETE_FILTER } from '@/lib/db/soft-delete';
import { updateSterilizerValidationSchema } from '@/lib/validations/sterilization';

/**
 * GET /api/resources/sterilization/validations/:id
 * Get a single validation record by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    const validation = await db.sterilizerValidation.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!validation) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Validation record not found',
          },
        },
        { status: 404 }
      );
    }

    // Get equipment info
    const equipment = await db.equipment.findUnique({
      where: { id: validation.equipmentId },
      select: { id: true, name: true, equipmentNumber: true, serialNumber: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        ...validation,
        equipment,
      },
    });
  },
  { permissions: ['sterilization:read'] }
);

/**
 * PUT /api/resources/sterilization/validations/:id
 * Update a validation record
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    // Validate input
    const result = updateSterilizerValidationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid validation data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    // Check if validation exists
    const existing = await db.sterilizerValidation.findFirst({
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
            code: 'NOT_FOUND',
            message: 'Validation record not found',
          },
        },
        { status: 404 }
      );
    }

    const data = result.data;

    // If changing equipment, verify it exists and is sterilization equipment
    if (data.equipmentId && data.equipmentId !== existing.equipmentId) {
      const equipment = await db.equipment.findFirst({
        where: {
          id: data.equipmentId,
          clinicId: session.user.clinicId,
          category: 'STERILIZATION',
          ...SOFT_DELETE_FILTER,
        },
      });

      if (!equipment) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EQUIPMENT_NOT_FOUND',
              message: 'Sterilization equipment not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // Update the validation
    const updated = await db.sterilizerValidation.update({
      where: { id },
      data: {
        ...data,
        parameters: (data.parameters as Prisma.InputJsonValue) ?? undefined,
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'SterilizerValidation',
      entityId: id,
      details: {
        changes: Object.keys(data),
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: updated });
  },
  { permissions: ['sterilization:update'] }
);

/**
 * DELETE /api/resources/sterilization/validations/:id
 * Delete a validation record
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    // Check if validation exists
    const existing = await db.sterilizerValidation.findFirst({
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
            code: 'NOT_FOUND',
            message: 'Validation record not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the validation
    await db.sterilizerValidation.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'SterilizerValidation',
      entityId: id,
      details: {
        validationType: existing.validationType,
        equipmentId: existing.equipmentId,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true, data: { id } });
  },
  { permissions: ['sterilization:delete'] }
);
