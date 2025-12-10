/**
 * Portal Authentication Middleware
 *
 * Wrapper for portal API routes that require authentication.
 * Similar to withAuth but for patient portal routes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPortalAuthService } from '@/lib/services/portal';

/**
 * Portal session data available to authenticated routes
 */
export interface PortalSession {
  accountId: string;
  patientId: string;
  clinicId: string;
  email: string;
  patientName: string;
}

/**
 * Handler type for portal routes
 */
type PortalRouteHandler = (
  req: NextRequest,
  session: PortalSession
) => Promise<NextResponse>;

/**
 * Wrap a portal API route with authentication
 *
 * @example
 * export const GET = withPortalAuth(async (req, session) => {
 *   // session contains accountId, patientId, clinicId, etc.
 *   return NextResponse.json({ success: true, data: session });
 * });
 */
export function withPortalAuth(handler: PortalRouteHandler) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Get session token from cookie
      const sessionToken = req.cookies.get('portal_session')?.value;

      if (!sessionToken) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          },
          { status: 401 }
        );
      }

      // Validate session
      const authService = getPortalAuthService();
      const result = await authService.validateSession(sessionToken);

      if (!result.success || !result.account) {
        // Clear invalid session cookie
        const res = NextResponse.json(
          {
            success: false,
            error: result.error || {
              code: 'UNAUTHORIZED',
              message: 'Session expired or invalid',
            },
          },
          { status: 401 }
        );
        res.cookies.delete('portal_session');
        return res;
      }

      // Build session object
      const session: PortalSession = {
        accountId: result.account.id,
        patientId: result.account.patientId,
        clinicId: result.account.clinicId,
        email: result.account.email,
        patientName: result.account.patientName,
      };

      // Call the handler with session
      return handler(req, session);
    } catch (error) {
      console.error('[Portal Auth Middleware] Error:', error);
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
  };
}

/**
 * Get portal session from request (for use in server components)
 * Returns null if not authenticated
 */
export async function getPortalSession(
  req: NextRequest
): Promise<PortalSession | null> {
  const sessionToken = req.cookies.get('portal_session')?.value;

  if (!sessionToken) {
    return null;
  }

  const authService = getPortalAuthService();
  const result = await authService.validateSession(sessionToken);

  if (!result.success || !result.account) {
    return null;
  }

  return {
    accountId: result.account.id,
    patientId: result.account.patientId,
    clinicId: result.account.clinicId,
    email: result.account.email,
    patientName: result.account.patientName,
  };
}
