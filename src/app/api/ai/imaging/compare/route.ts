import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';

import { withAuth } from '@/lib/auth/with-auth';
import { getImagingAIService } from '@/lib/services/ai';

/**
 * Request schema for progress comparison
 */
const compareRequestSchema = z.object({
  beforeImageUrl: z.string().url('Invalid before image URL'),
  afterImageUrl: z.string().url('Invalid after image URL'),
  context: z
    .object({
      treatmentType: z.string().optional(),
      patientAge: z.number().optional(),
    })
    .optional(),
});

/**
 * POST /api/ai/imaging/compare
 *
 * Compare before/after images to analyze treatment progress.
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    try {
      const body = await req.json();

      // Validate request
      const validation = compareRequestSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request',
              details: validation.error.flatten(),
            },
          },
          { status: 400 }
        );
      }

      const { beforeImageUrl, afterImageUrl, context } = validation.data;
      const aiService = getImagingAIService();

      const result = await aiService.compareImages(
        beforeImageUrl,
        afterImageUrl,
        session.user.clinicId,
        context
      );

      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: result.error,
          },
          { status: result.error?.code === 'FEATURE_DISABLED' ? 403 : 500 }
        );
      }

      return NextResponse.json({
        success: true,
        data: result.data,
        meta: {
          processingTime: result.processingTime,
          model: result.model,
          tokensUsed: result.tokensUsed,
        },
      });
    } catch (error) {
      console.error('[AI Compare API] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'COMPARISON_ERROR',
            message: 'Failed to compare images',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:view'] }
);
