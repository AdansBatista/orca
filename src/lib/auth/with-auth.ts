import { NextRequest, NextResponse } from 'next/server';
import type { Session } from 'next-auth';

import { auth } from './index';
import { hasAnyPermission, hasAllPermissions } from './permissions';
import type { PermissionCode } from './types';

/**
 * API response format
 */
interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Options for withAuth wrapper
 */
interface WithAuthOptions {
  /** Required permissions (user needs at least one) */
  permissions?: PermissionCode[];
  /** Required permissions (user needs all) */
  allPermissions?: PermissionCode[];
  /** Allow unauthenticated access (for public endpoints) */
  allowUnauthenticated?: boolean;
}

/**
 * Handler function type with session
 */
type AuthenticatedHandler = (
  req: NextRequest,
  session: Session,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse>;

/**
 * Create an error response
 */
function errorResponse(
  code: string,
  message: string,
  status: number
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error: { code, message },
    },
    { status }
  );
}

/**
 * withAuth wrapper for API routes
 *
 * Provides authentication and authorization checks for API endpoints.
 *
 * @example
 * // Basic auth check
 * export const GET = withAuth(async (req, session) => {
 *   return NextResponse.json({ success: true, data: { user: session.user } });
 * });
 *
 * @example
 * // With permission check
 * export const POST = withAuth(
 *   async (req, session) => {
 *     // Handler logic
 *   },
 *   { permissions: ['patients:write'] }
 * );
 */
export function withAuth(
  handler: AuthenticatedHandler,
  options: WithAuthOptions = {}
): (req: NextRequest, context?: { params?: Record<string, string> }) => Promise<NextResponse> {
  return async (req: NextRequest, context?: { params?: Record<string, string> }) => {
    try {
      // Get session
      const session = await auth();

      // Check authentication
      if (!session?.user) {
        if (options.allowUnauthenticated) {
          // Allow through without session
          return handler(req, session as Session, context);
        }
        return errorResponse('UNAUTHORIZED', 'Authentication required', 401);
      }

      // Check permissions (any of)
      if (options.permissions && options.permissions.length > 0) {
        if (!hasAnyPermission(session.user.role, options.permissions)) {
          return errorResponse(
            'FORBIDDEN',
            'You do not have permission to perform this action',
            403
          );
        }
      }

      // Check permissions (all of)
      if (options.allPermissions && options.allPermissions.length > 0) {
        if (!hasAllPermissions(session.user.role, options.allPermissions)) {
          return errorResponse(
            'FORBIDDEN',
            'You do not have permission to perform this action',
            403
          );
        }
      }

      // Call the handler
      return handler(req, session, context);
    } catch (error) {
      console.error('API Error:', error);

      // Handle known errors
      if (error instanceof Error) {
        if (error.message === 'ACCOUNT_DISABLED') {
          return errorResponse('ACCOUNT_DISABLED', 'Your account has been disabled', 403);
        }
        if (error.message === 'ACCOUNT_LOCKED') {
          return errorResponse(
            'ACCOUNT_LOCKED',
            'Your account is temporarily locked due to too many failed login attempts',
            403
          );
        }
        if (error.message === 'CLINIC_DISABLED') {
          return errorResponse('CLINIC_DISABLED', 'This clinic has been disabled', 403);
        }
      }

      return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred', 500);
    }
  };
}

/**
 * Helper to get clinicId filter for queries
 * Ensures data isolation - EVERY query must use this
 */
export function getClinicFilter(session: Session): { clinicId: string } {
  return { clinicId: session.user.clinicId };
}

/**
 * Validate that a user can access a specific clinic
 */
export function validateClinicAccess(
  session: Session,
  targetClinicId: string
): boolean {
  // Super admin can access all
  if (session.user.role === 'super_admin') {
    return true;
  }

  // Check if user has access to target clinic
  return (
    session.user.clinicId === targetClinicId ||
    session.user.clinicIds.includes(targetClinicId)
  );
}
