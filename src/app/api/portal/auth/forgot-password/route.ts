/**
 * Forgot Password API
 *
 * POST /api/portal/auth/forgot-password - Request password reset
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalAuthService } from '@/lib/services/portal';
import { requestPasswordResetSchema } from '@/lib/validations/portal';

/**
 * POST /api/portal/auth/forgot-password
 * Request a password reset link
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = requestPasswordResetSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: result.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { email, clinicSlug } = result.data;
    const authService = getPortalAuthService();

    const response = await authService.requestPasswordReset(email, clinicSlug);

    // Always return success to prevent email enumeration
    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, a password reset link has been sent.',
      // Only include token in development for testing
      ...(process.env.NODE_ENV === 'development' && response.token
        ? { devToken: response.token }
        : {}),
    });
  } catch (error) {
    console.error('[Portal Forgot Password] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}
