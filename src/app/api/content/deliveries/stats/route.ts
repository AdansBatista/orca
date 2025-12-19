/**
 * Content Delivery Statistics API
 *
 * GET /api/content/deliveries/stats - Get delivery statistics
 *
 * Returns aggregated statistics on content delivery and engagement.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';

import { withAuth } from '@/lib/auth/with-auth';
import { getContentDeliveryService } from '@/lib/services/content-delivery';

// Query schema for stats
const statsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

/**
 * GET /api/content/deliveries/stats
 * Get content delivery statistics
 */
export const GET = withAuth(
  async (req: NextRequest, session: Session) => {
    const { searchParams } = new URL(req.url);

    const result = statsQuerySchema.safeParse({
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { startDate, endDate } = result.data;
    const clinicId = session.user.clinicId;

    const service = getContentDeliveryService();
    const stats = await service.getStats(
      clinicId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    return NextResponse.json({
      success: true,
      data: stats,
    });
  },
  { permissions: ['content:view'] }
);
