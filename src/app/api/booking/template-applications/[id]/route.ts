import { NextRequest, NextResponse } from 'next/server';

import { db } from '@/lib/db';
import { withAuth, getClinicFilter } from '@/lib/auth/with-auth';
import type { Session } from 'next-auth';

/**
 * DELETE /api/booking/template-applications/[id]
 * Remove a specific template application by ID
 */
export const DELETE = withAuth(
  async (req: NextRequest, session: Session, { params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;

    // Verify the application exists and belongs to this clinic
    const application = await db.templateApplication.findFirst({
      where: {
        id,
        ...getClinicFilter(session),
      },
    });

    if (!application) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'APPLICATION_NOT_FOUND',
            message: 'Template application not found',
          },
        },
        { status: 404 }
      );
    }

    // Delete the application
    await db.templateApplication.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      data: { id },
    });
  },
  { permissions: ['booking:write'] }
);
