import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';

import { withAuth } from '@/lib/auth/with-auth';
import { getImagingAIService } from '@/lib/services/ai';

/**
 * Request schema for image analysis
 */
const analyzeRequestSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  analysisType: z.enum(['quality', 'categorization', 'all']),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/ai/imaging/analyze
 *
 * Analyze a dental image for quality and/or categorization.
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    try {
      const body = await req.json();

      // Validate request
      const validation = analyzeRequestSchema.safeParse(body);
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

      const { imageUrl, analysisType, metadata } = validation.data;
      const aiService = getImagingAIService();

      // Perform requested analysis
      if (analysisType === 'all') {
        const results = await aiService.analyzeOnUpload(
          imageUrl,
          session.user.clinicId,
          metadata
        );

        return NextResponse.json({
          success: true,
          data: results,
        });
      }

      if (analysisType === 'quality') {
        const result = await aiService.analyzeQuality(
          imageUrl,
          session.user.clinicId,
          metadata
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
      }

      if (analysisType === 'categorization') {
        const result = await aiService.categorize(
          imageUrl,
          session.user.clinicId,
          metadata
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
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_ANALYSIS_TYPE',
            message: 'Unknown analysis type',
          },
        },
        { status: 400 }
      );
    } catch (error) {
      console.error('[AI Analyze API] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ANALYSIS_ERROR',
            message: 'Failed to analyze image',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:view'] }
);
