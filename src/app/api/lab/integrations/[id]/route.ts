import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { z } from 'zod';

const updateIntegrationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  enabled: z.boolean().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  vendorId: z.string().optional().nullable(),
});

/**
 * GET /api/lab/integrations/[id]
 * Get integration details
 */
export const GET = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    const integration = await db.labIntegration.findFirst({
      where: {
        id,
        ...clinicFilter,
        deletedAt: null,
      },
      include: {
        vendor: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    if (!integration) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTEGRATION_NOT_FOUND',
            message: 'Integration not found',
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: integration,
    });
  },
  { permissions: ['lab:view'] }
);

/**
 * PUT /api/lab/integrations/[id]
 * Update integration configuration
 */
export const PUT = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const body = await req.json();
    const clinicFilter = getClinicFilter(session);

    // Validate input
    const result = updateIntegrationSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid integration data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const data = result.data;

    // Verify integration exists
    const existing = await db.labIntegration.findFirst({
      where: {
        id,
        ...clinicFilter,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTEGRATION_NOT_FOUND',
            message: 'Integration not found',
          },
        },
        { status: 404 }
      );
    }

    // Update integration
    const integration = await db.labIntegration.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.enabled !== undefined && { enabled: data.enabled }),
        ...(data.config && { config: data.config as object }),
        ...(data.vendorId !== undefined && { vendorId: data.vendorId }),
        // If enabling, mark as pending connection
        ...(data.enabled === true && existing.status === 'NOT_CONFIGURED'
          ? { status: 'PENDING_CONNECTION' }
          : {}),
        // If disabling, mark as inactive
        ...(data.enabled === false ? { status: 'INACTIVE' } : {}),
        updatedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: integration,
    });
  },
  { permissions: ['settings:edit'] }
);

/**
 * DELETE /api/lab/integrations/[id]
 * Remove an integration configuration
 */
export const DELETE = withAuth<{ id: string }>(
  async (req: NextRequest, session: Session, context) => {
    const { id } = await context.params;
    const clinicFilter = getClinicFilter(session);

    const existing = await db.labIntegration.findFirst({
      where: {
        id,
        ...clinicFilter,
        deletedAt: null,
      },
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INTEGRATION_NOT_FOUND',
            message: 'Integration not found',
          },
        },
        { status: 404 }
      );
    }

    // Soft delete
    await db.labIntegration.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: session.user.id,
      },
    });

    return NextResponse.json({
      success: true,
      data: { deleted: true },
    });
  },
  { permissions: ['settings:edit'] }
);
