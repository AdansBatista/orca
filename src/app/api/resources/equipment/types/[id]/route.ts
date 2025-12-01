import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { updateEquipmentTypeSchema } from '@/lib/validations/equipment';

/**
 * GET /api/resources/equipment/types/:id
 * Get a single equipment type by ID
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    const equipmentType = await db.equipmentType.findFirst({
      where: {
        id,
        OR: [
          { clinicId: session.user.clinicId },
          { clinicId: null }, // System types
        ],
      },
      include: {
        _count: {
          select: { equipment: true },
        },
      },
    });

    if (!equipmentType) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Equipment type not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: equipmentType,
    });
  },
  { permissions: ['equipment:read'] }
);

/**
 * PUT /api/resources/equipment/types/:id
 * Update an equipment type (clinic-specific only, not system types)
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;
    const body = await req.json();

    // Find the existing equipment type
    const existing = await db.equipmentType.findFirst({
      where: {
        id,
        OR: [
          { clinicId: session.user.clinicId },
          { clinicId: null },
        ],
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Equipment type not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot modify system types (only deactivate)
    if (existing.isSystem) {
      // Only allow updating isActive for system types
      const allowedFields = ['isActive'];
      const requestedFields = Object.keys(body);
      const disallowedFields = requestedFields.filter(
        (field) => !allowedFields.includes(field)
      );

      if (disallowedFields.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CANNOT_MODIFY_SYSTEM_TYPE',
              message: 'System equipment types can only be activated/deactivated',
              details: { disallowedFields },
            },
          },
          { status: 400 }
        );
      }
    }

    // Validate input
    const result = updateEquipmentTypeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid equipment type data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check for duplicate code if being changed
    if (data.code && data.code !== existing.code) {
      const duplicateCode = await db.equipmentType.findFirst({
        where: {
          code: data.code,
          id: { not: id },
          OR: [
            { clinicId: session.user.clinicId },
            { clinicId: null },
          ],
        },
      });

      if (duplicateCode) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_CODE',
              message: 'An equipment type with this code already exists',
            },
          },
          { status: 409 }
        );
      }
    }

    // Update the equipment type
    const equipmentType = await db.equipmentType.update({
      where: { id },
      data: existing.isSystem ? { isActive: data.isActive } : data,
      include: {
        _count: {
          select: { equipment: true },
        },
      },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'EquipmentType',
      entityId: equipmentType.id,
      details: {
        code: equipmentType.code,
        name: equipmentType.name,
        updatedFields: Object.keys(data),
        isSystem: equipmentType.isSystem,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: equipmentType,
    });
  },
  { permissions: ['equipment:update'] }
);

/**
 * DELETE /api/resources/equipment/types/:id
 * Delete a clinic-specific equipment type
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, { params }) => {
    const { id } = await params;

    // Find the existing equipment type
    const existing = await db.equipmentType.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId, // Can only delete clinic types
      },
      include: {
        _count: {
          select: { equipment: true },
        },
      },
    });

    if (!existing) {
      // Check if it's a system type
      const systemType = await db.equipmentType.findFirst({
        where: { id, isSystem: true },
      });

      if (systemType) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CANNOT_DELETE_SYSTEM_TYPE',
              message: 'System equipment types cannot be deleted. You can deactivate them instead.',
            },
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Equipment type not found',
          },
        },
        { status: 404 }
      );
    }

    // Cannot delete type with existing equipment
    if (existing._count.equipment > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HAS_EQUIPMENT',
            message: 'Cannot delete equipment type that has associated equipment',
            details: { equipmentCount: existing._count.equipment },
          },
        },
        { status: 400 }
      );
    }

    // Delete the equipment type
    await db.equipmentType.delete({
      where: { id },
    });

    // Audit log
    const { ipAddress, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'EquipmentType',
      entityId: existing.id,
      details: {
        code: existing.code,
        name: existing.name,
      },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['equipment:delete'] }
);
