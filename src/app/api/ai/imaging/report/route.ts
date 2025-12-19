import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';

import { withAuth } from '@/lib/auth/with-auth';
import { getImagingAIService } from '@/lib/services/ai';

/**
 * Request schema for AI report generation
 */
const reportRequestSchema = z.object({
  imageUrls: z.array(z.string().url('Invalid image URL')).min(1).max(10),
  context: z
    .object({
      treatmentType: z.string().optional(),
      patientAge: z.number().optional(),
      reportType: z.string().optional(),
    })
    .optional(),
});

/**
 * POST /api/ai/imaging/report
 *
 * Generate an AI-assisted clinical report from dental images.
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    try {
      const body = await req.json();

      // Validate request
      const validation = reportRequestSchema.safeParse(body);
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

      const { imageUrls, context } = validation.data;
      const aiService = getImagingAIService();

      const result = await aiService.generateImageReport(
        imageUrls,
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
      console.error('[AI Report API] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'REPORT_ERROR',
            message: 'Failed to generate report',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:view'] }
);
