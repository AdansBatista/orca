import { NextResponse } from 'next/server';

import { withAuth } from '@/lib/auth/with-auth';
import { getImagingAIService } from '@/lib/services/ai';

/**
 * GET /api/ai/imaging/health
 *
 * Check AI service health and feature availability.
 */
export const GET = withAuth(
  async () => {
    try {
      const aiService = getImagingAIService();
      const health = await aiService.checkHealth();

      return NextResponse.json({
        success: true,
        data: health,
      });
    } catch (error) {
      console.error('[AI Health API] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'HEALTH_CHECK_ERROR',
            message: 'Failed to check AI health',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:view'] }
);
