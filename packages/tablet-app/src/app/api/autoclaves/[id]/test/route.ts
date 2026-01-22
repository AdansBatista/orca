import { NextRequest, NextResponse } from 'next/server';
import { db, getClinicId } from '@/lib/db';
import { testAutoclaveConnection } from '@/lib/sterilization/autoclave-service';

/**
 * POST /api/autoclaves/[id]/test
 * Test connection to an autoclave and update its status
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const clinicId = getClinicId();

    // Find existing autoclave
    const autoclave = await db.autoclaveIntegration.findFirst({
      where: {
        id,
        clinicId,
        deletedAt: null,
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

    // Test the connection
    const connectionTest = await testAutoclaveConnection(
      autoclave.ipAddress,
      autoclave.port
    );

    // Update the autoclave status
    const updated = await db.autoclaveIntegration.update({
      where: { id },
      data: {
        status: connectionTest.success ? 'CONNECTED' : 'ERROR',
        errorMessage: connectionTest.success ? null : connectionTest.error,
        updatedBy: 'tablet-app',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        autoclave: updated,
        connectionTest,
      },
    });
  } catch (error) {
    console.error('Failed to test autoclave connection:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'TEST_FAILED',
          message: error instanceof Error ? error.message : 'Failed to test connection',
        },
      },
      { status: 500 }
    );
  }
}
