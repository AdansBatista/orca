/**
 * Password Login API
 *
 * POST /api/portal/auth/login - Login with email and password
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalAuthService } from '@/lib/services/portal';
import { loginSchema } from '@/lib/validations/portal';

/**
 * POST /api/portal/auth/login
 * Login with email and password
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = loginSchema.safeParse(body);
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

    // Debug logging
    console.log('[Portal Login] Attempting login for:', { email, clinicSlug });

    const authService = getPortalAuthService();

    // Get request metadata
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const response = await authService.login(email, password, clinicSlug, ipAddress, userAgent);

    if (!response.success) {
      // Use 401 for authentication failures
      const status = response.error?.code === 'INVALID_CREDENTIALS' ? 401 : 400;
      return NextResponse.json(
        { success: false, error: response.error },
        { status }
      );
    }

    // Create response with session cookie
    const res = NextResponse.json({
      success: true,
      data: {
        account: response.account,
      },
    });

    // Set session cookie (httpOnly for security)
    res.cookies.set('portal_session', response.sessionToken!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return res;
  } catch (error) {
    console.error('[Portal Login] Error:', error);
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
