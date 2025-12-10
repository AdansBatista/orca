/**
 * Magic Link Authentication API
 *
 * POST /api/portal/auth/magic-link - Request magic link
 * GET /api/portal/auth/magic-link?token=xxx - Verify magic link
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalAuthService } from '@/lib/services/portal';
import { requestMagicLinkSchema, verifyMagicLinkSchema } from '@/lib/validations/portal';

/**
 * POST /api/portal/auth/magic-link
 * Request a magic link for passwordless login
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // Validate input
    const result = requestMagicLinkSchema.safeParse(body);
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

    const response = await authService.requestMagicLink(email, clinicSlug);

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
      );
    }

    // In production, don't return the token - it's sent via email
    // For development, we return it for testing
    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email, a login link has been sent.',
      // Only include token in development
      ...(process.env.NODE_ENV === 'development' && response.token
        ? { devToken: response.token }
        : {}),
    });
  } catch (error) {
    console.error('[Portal Magic Link] Error:', error);
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

/**
 * GET /api/portal/auth/magic-link?token=xxx
 * Verify magic link and create session
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');

    // Validate input
    const result = verifyMagicLinkSchema.safeParse({ token });
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

    // Get request metadata
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || undefined;
    const userAgent = req.headers.get('user-agent') || undefined;

    const response = await authService.verifyMagicLink(result.data.token, ipAddress, userAgent);

    if (!response.success) {
      return NextResponse.json(
        { success: false, error: response.error },
        { status: 400 }
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
    console.error('[Portal Magic Link Verify] Error:', error);
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
