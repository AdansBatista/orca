import { NextRequest, NextResponse } from 'next/server';

import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete } from '@/lib/db/soft-delete';
import {
  createAutoclaveSchema,
  autoclaveQuerySchema,
} from '@/lib/validations/autoclave';
import { testAutoclaveConnection } from '@/lib/sterilization/autoclave-service';

/**
 * GET /api/resources/sterilization/autoclaves
 * List all configured autoclaves for the clinic
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    // Parse query parameters
    const rawParams = {
      enabled: searchParams.get('enabled') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    };

    const queryResult = autoclaveQuerySchema.safeParse(rawParams);

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: queryResult.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { enabled, status } = queryResult.data;

    // Build where clause
    const where: Record<string, unknown> = withSoftDelete({
      ...getClinicFilter(session),
    });

    if (enabled !== undefined) where.enabled = enabled;
    if (status) where.status = status;

    // Get all autoclaves
    const autoclaves = await db.autoclaveIntegration.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            equipmentNumber: true,
          },
        },
        _count: {
          select: {
            cycles: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: autoclaves,
    });
  },
  { permissions: ['sterilization:read'] }
);

/**
 * POST /api/resources/sterilization/autoclaves
 * Create a new autoclave integration
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    const body = await req.json();

    // Validate input
    const result = createAutoclaveSchema.safeParse(body);
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

    // Verify equipment exists and belongs to this clinic
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

    // Check for duplicate IP address
    const existing = await db.autoclaveIntegration.findFirst({
      where: withSoftDelete({
        clinicId: session.user.clinicId,
        ipAddress: data.ipAddress,
      }),
    });

    if (existing) {
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

    // Test connection to autoclave
    const connectionTest = await testAutoclaveConnection(data.ipAddress, data.port);

    // Create the autoclave integration
    const autoclave = await db.autoclaveIntegration.create({
      data: {
        clinicId: session.user.clinicId,
        equipmentId: data.equipmentId,
        name: data.name,
        ipAddress: data.ipAddress,
        port: data.port,
        enabled: data.enabled,
        status: connectionTest.success ? 'CONNECTED' : 'ERROR',
        errorMessage: connectionTest.success ? null : connectionTest.error,
        createdBy: session.user.id,
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
      action: 'CREATE',
      entity: 'AutoclaveIntegration',
      entityId: autoclave.id,
      details: {
        name: autoclave.name,
        ipAddress: autoclave.ipAddress,
        equipmentId: autoclave.equipmentId,
        connectionStatus: connectionTest.success ? 'SUCCESS' : 'FAILED',
      },
      ipAddress: clientIp,
      userAgent,
    });

    return NextResponse.json(
      {
        success: true,
        data: autoclave,
        connectionTest,
      },
      { status: 201 }
    );
  },
  { permissions: ['sterilization:create'] }
);
