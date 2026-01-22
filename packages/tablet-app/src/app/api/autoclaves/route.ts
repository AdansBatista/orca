import { NextRequest, NextResponse } from 'next/server';
import { db, getClinicId } from '@/lib/db';
import { z } from 'zod';

// GET /api/autoclaves - List all autoclaves for the clinic
export async function GET() {
  try {
    const clinicId = getClinicId();

    const autoclaves = await db.autoclaveIntegration.findMany({
      where: {
        clinicId,
        deletedAt: null,
      },
      include: {
        equipment: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      data: autoclaves,
    });
  } catch (error) {
    console.error('Failed to fetch autoclaves:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: error instanceof Error ? error.message : 'Failed to fetch autoclaves',
        },
      },
      { status: 500 }
    );
  }
}

// POST /api/autoclaves - Create a new autoclave
const createAutoclaveSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  ipAddress: z.string().regex(/^(\d{1,3}\.){3}\d{1,3}$/, 'Invalid IP address'),
  port: z.number().int().min(1).max(65535).default(80),
  equipmentId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const clinicId = getClinicId();
    const body = await req.json();
    const data = createAutoclaveSchema.parse(body);

    const { equipmentId, ...createFields } = data;
    const autoclave = await db.autoclaveIntegration.create({
      data: {
        ...createFields,
        clinic: { connect: { id: clinicId } },
        equipment: { connect: { id: equipmentId } },
        status: 'PENDING_CONNECTION',
        createdBy: 'tablet-app', // No user auth in tablet mode
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

    console.error('Failed to create autoclave:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CREATE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to create autoclave',
        },
      },
      { status: 500 }
    );
  }
}
