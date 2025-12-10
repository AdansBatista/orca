/**
 * Registration API
 *
 * POST /api/portal/auth/register - Register new portal account
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalAuthService } from '@/lib/services/portal';
import { registerSchema } from '@/lib/validations/portal';

/**
 * POST /api/portal/auth/register
 * Register a new portal account with password
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = registerSchema.safeParse(body);
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

    const { email, password, clinicSlug } = result.data;
    const authService = getPortalAuthService();

    const response = await authService.register(email, password, clinicSlug);

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    // In production, don't return the token - it's sent via email
    return NextResponse.json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      // Only include token in development for testing
      ...(process.env.NODE_ENV === 'development' && response.token
        ? { devToken: response.token }
        : {}),
    });
  } catch (error) {
    console.error('[Portal Register] Error:', error);
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
