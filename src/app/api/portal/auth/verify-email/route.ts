/**
 * Email Verification API
 *
 * GET /api/portal/auth/verify-email?token=xxx - Verify email
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalAuthService } from '@/lib/services/portal';
import { verifyEmailSchema } from '@/lib/validations/portal';

/**
 * GET /api/portal/auth/verify-email?token=xxx
 * Verify email address with token
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    // Validate input
    const result = verifyEmailSchema.safeParse({ token });
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid or missing token',
          },
        },
        { status: 400 }
      );
    }

    const authService = getPortalAuthService();
    const response = await authService.verifyEmail(result.data.token);

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (error) {
    console.error('[Portal Verify Email] Error:', error);
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
