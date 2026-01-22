import { NextRequest, NextResponse } from 'next/server';
import { db, getClinicId } from '@/lib/db';
import { z } from 'zod';

// GET /api/autoclaves/[id] - Get single autoclave
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const clinicId = getClinicId();

    const autoclave = await db.autoclaveIntegration.findFirst({
      where: {
        id,
        clinicId,
        deletedAt: null,
      },
      include: {
        equipment: true,
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
  } catch (error) {
    console.error('Failed to fetch autoclave:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch autoclave',
        },
      },
      { status: 500 }
    );
  }
}

// PUT /api/autoclaves/[id] - Update autoclave
const updateAutoclaveSchema = z.object({
  name: z.string().min(1).optional(),
  ipAddress: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Invalid IP address').optional(),
  port: z.number().int().min(1).max(65535).optional(),
  equipmentId: z.string().optional(),
  status: z.enum(['NOT_CONFIGURED', 'PENDING_SETUP', 'PENDING_CONNECTION', 'CONNECTED', 'ERROR', 'INACTIVE']).optional(),
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const clinicId = getClinicId();
    const body = await req.json();
    const data = updateAutoclaveSchema.parse(body);

    // Verify autoclave exists and belongs to clinic
    const existing = await db.autoclaveIntegration.findFirst({
      where: {
        id,
        clinicId,
        deletedAt: null,
      },
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

    const { equipmentId, ...updateFields } = data;
    const autoclave = await db.autoclaveIntegration.update({
      where: { id },
      data: {
        ...updateFields,
        ...(equipmentId !== undefined && {
          equipment: { connect: { id: equipmentId } },
        }),
        updatedBy: 'tablet-app',
      },
      include: {
        equipment: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: autoclave,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.issues[0].message,
            details: error.issues,
          },
        },
        { status: 400 }
      );
    }

    console.error('Failed to update autoclave:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to update autoclave',
        },
      },
      { status: 500 }
    );
  }
}

// DELETE /api/autoclaves/[id] - Soft delete autoclave
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const clinicId = getClinicId();

    // Verify autoclave exists and belongs to clinic
    const existing = await db.autoclaveIntegration.findFirst({
      where: {
        id,
        clinicId,
        deletedAt: null,
      },
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

    await db.autoclaveIntegration.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: 'tablet-app',
      },
    });

    return NextResponse.json({
      success: true,
      data: null,
    });
  } catch (error) {
    console.error('Failed to delete autoclave:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to delete autoclave',
        },
      },
      { status: 500 }
    );
  }
}
