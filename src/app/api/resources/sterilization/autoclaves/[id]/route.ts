import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { updateAutoclaveSchema } from '@/lib/validations/autoclave';
import { testAutoclaveConnection } from '@/lib/sterilization/autoclave-service';

/**
 * GET /api/resources/sterilization/autoclaves/[id]
 * Get a single autoclave integration
 */
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    const autoclave = await db.autoclaveIntegration.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            equipmentNumber: true,
            serialNumber: true,
          },
        },
        _count: {
          select: {
            cycles: true,
          },
        },
      },
    });

    if (!autoclave) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Autoclave not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: autoclave,
    });
  },
  { permissions: ['sterilization:read'] }
);

/**
 * PUT /api/resources/sterilization/autoclaves/[id]
 * Update an autoclave integration
 */
export const PUT = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;
    const body = await req.json();

    // Validate input
    const result = updateAutoclaveSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid autoclave data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Find existing autoclave
    const existing = await db.autoclaveIntegration.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Autoclave not found',
          },
        },
        { status: 404 }
      );
    }

    // If equipment is being changed, verify it exists
    if (data.equipmentId && data.equipmentId !== existing.equipmentId) {
      const equipment = await db.equipment.findFirst({
        where: withSoftDelete({
          id: data.equipmentId,
          clinicId: session.user.clinicId,
        }),
      });

      if (!equipment) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'EQUIPMENT_NOT_FOUND',
              message: 'Equipment not found',
            },
          },
          { status: 404 }
        );
      }
    }

    // If IP is being changed, check for duplicates
    if (data.ipAddress && data.ipAddress !== existing.ipAddress) {
      const duplicate = await db.autoclaveIntegration.findFirst({
        where: withSoftDelete({
          clinicId: session.user.clinicId,
          ipAddress: data.ipAddress,
          id: { not: id },
        }),
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DUPLICATE_IP',
              message: 'An autoclave with this IP address already exists',
            },
          },
          { status: 409 }
        );
      }
    }

    // Test connection if IP or port changed
    let connectionTest = null;
    const newIp = data.ipAddress || existing.ipAddress;
    const newPort = data.port || existing.port;

    if (data.ipAddress || data.port) {
      connectionTest = await testAutoclaveConnection(newIp, newPort);
    }

    // Update the autoclave
    const autoclave = await db.autoclaveIntegration.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.ipAddress !== undefined && { ipAddress: data.ipAddress }),
        ...(data.port !== undefined && { port: data.port }),
        ...(data.equipmentId !== undefined && { equipmentId: data.equipmentId }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(connectionTest && {
          status: connectionTest.success ? 'CONNECTED' : 'ERROR',
          errorMessage: connectionTest.success ? null : connectionTest.error,
        }),
        updatedBy: session.user.id,
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            equipmentNumber: true,
          },
        },
      },
    });

    // Audit log
    const { ipAddress: clientIp, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'AutoclaveIntegration',
      entityId: autoclave.id,
      details: {
        changes: data,
        connectionTest: connectionTest ? (connectionTest.success ? 'SUCCESS' : 'FAILED') : null,
      },
      ipAddress: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: autoclave,
      connectionTest,
    });
  },
  { permissions: ['sterilization:update'] }
);

/**
 * DELETE /api/resources/sterilization/autoclaves/[id]
 * Soft delete an autoclave integration
 */
export const DELETE = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Find existing autoclave
    const existing = await db.autoclaveIntegration.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Autoclave not found',
          },
        },
        { status: 404 }
      );
    }

    // Soft delete
    await db.autoclaveIntegration.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress: clientIp, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'DELETE',
      entity: 'AutoclaveIntegration',
      entityId: id,
      details: {
        name: existing.name,
        ipAddress: existing.ipAddress,
      },
      ipAddress: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['sterilization:delete'] }
);
