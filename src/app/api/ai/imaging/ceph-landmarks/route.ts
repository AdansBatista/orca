import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import { z } from 'zod';

import { withAuth } from '@/lib/auth/with-auth';
import { getImagingAIService } from '@/lib/services/ai';

/**
 * Request schema for cephalometric landmark detection
 */
const cephLandmarksRequestSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * POST /api/ai/imaging/ceph-landmarks
 *
 * Detect cephalometric landmarks in a lateral ceph X-ray.
 */
export const POST = withAuth(
  async (req: NextRequest, session: Session) => {
    try {
      const body = await req.json();

      // Validate request
      const validation = cephLandmarksRequestSchema.safeParse(body);
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

      const { imageUrl, metadata } = validation.data;
      const aiService = getImagingAIService();

      const result = await aiService.detectLandmarks(
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
    } catch (error) {
      console.error('[AI Ceph Landmarks API] Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DETECTION_ERROR',
            message: 'Failed to detect landmarks',
          },
        },
        { status: 500 }
      );
    }
  },
  { permissions: ['imaging:view'] }
);
