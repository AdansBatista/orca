import { NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import { logAudit, getRequestMeta } from '@/lib/audit';
import { withSoftDelete } from '@/lib/db/soft-delete';
import { testAutoclaveConnection } from '@/lib/sterilization/autoclave-service';

/**
 * POST /api/resources/sterilization/autoclaves/[id]/test
 * Test connection to an autoclave and update its status
 */
export const POST = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;

    // Find existing autoclave
    const autoclave = await db.autoclaveIntegration.findFirst({
      where: withSoftDelete({
        id,
        ...getClinicFilter(session),
      }),
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
        updatedBy: session.user.id,
      },
    });

    // Audit log
    const { ipAddress: clientIp, userAgent } = getRequestMeta(req);
    await logAudit(session, {
      action: 'UPDATE',
      entity: 'AutoclaveIntegration',
      entityId: autoclave.id,
      details: {
        operation: 'TEST_CONNECTION',
        ipAddress: autoclave.ipAddress,
        result: connectionTest.success ? 'SUCCESS' : 'FAILED',
        error: connectionTest.error,
        model: connectionTest.model,
      },
      ipAddress: clientIp,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      data: {
        autoclave: updated,
        connectionTest,
      },
    });
  },
  { permissions: ['sterilization:update'] }
);
