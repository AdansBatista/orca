/**
 * Logout API
 *
 * POST /api/portal/auth/logout - Logout and revoke session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalAuthService } from '@/lib/services/portal';

/**
 * POST /api/portal/auth/logout
 * Logout and revoke current session
 */
export async function POST(req: NextRequest) {
  try {
    // Get session token from cookie
    const sessionToken = req.cookies.get('portal_session')?.value;

    if (sessionToken) {
      const authService = getPortalAuthService();

      // Get request metadata for logging
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || undefined;
      const userAgent = req.headers.get('user-agent') || undefined;

      await authService.logout(sessionToken, ipAddress, userAgent);
    }

    // Always clear cookie and return success
    const res = NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });

    res.cookies.delete('portal_session');

    return res;
  } catch (error) {
    console.error('[Portal Logout] Error:', error);
    // Still clear cookie even on error
    const res = NextResponse.json({
      success: true,
      message: 'Logged out',
    });
    res.cookies.delete('portal_session');
    return res;
  }
}
