/**
 * Content Recommendations API
 *
 * GET /api/content/recommendations - Get personalized content recommendations
 *
 * Returns content recommendations based on patient context.
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { db } from '@/lib/db';
import { withAuth } from '@/lib/auth/with-auth';
import { getContentDeliveryService } from '@/lib/services/content-delivery';

// Query schema for recommendations
const recommendationsQuerySchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  limit: z.coerce.number().min(1).max(20).default(5),
});

/**
 * GET /api/content/recommendations
 * Get personalized content recommendations for a patient
 */
export const GET = withAuth(
  async (req, session) => {
    const { searchParams } = new URL(req.url);

    const result = recommendationsQuerySchema.safeParse({
      patientId: searchParams.get('patientId') || '',
      limit: searchParams.get('limit') || 5,
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

    const { patientId, limit } = result.data;
    const clinicId = session.user.clinicId;

    // Verify patient exists
    const patient = await db.patient.findFirst({
      where: {
        id: patientId,
        clinicId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PATIENT_NOT_FOUND',
            message: 'Patient not found',
          },
        },
        { status: 404 }
      );
    }

    const service = getContentDeliveryService();
    const recommendations = await service.getRecommendations(
      clinicId,
      patientId,
      limit
    );

    return NextResponse.json({
      success: true,
      data: {
        patientId,
        recommendations,
      },
    });
  },
  { permissions: ['content:view', 'patients:view'] }
);
