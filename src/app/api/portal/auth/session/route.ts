/**
 * Session Validation API
 *
 * GET /api/portal/auth/session - Validate session and get account info
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalAuthService } from '@/lib/services/portal';

/**
 * GET /api/portal/auth/session
 * Validate current session and return account info
 */
export async function GET(req: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = req.cookies.get('portal_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NO_SESSION',
            message: 'No session found',
          },
        },
        { status: 401 }
      );
    }

    const authService = getPortalAuthService();
    const response = await authService.validateSession(sessionToken);

    if (!response.success) {
      // Clear invalid session cookie
      const res = NextResponse.json(
        { success: false, error: response.error },
        { status: 401 }
      );
      res.cookies.delete('portal_session');
      return res;
    }

    return NextResponse.json({
      success: true,
      data: {
        account: response.account,
      },
    });
  } catch (error) {
    console.error('[Portal Session] Error:', error);
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
