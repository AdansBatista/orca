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
 * Handler for routes WITHOUT dynamic params
 */
type SimpleHandler = (
  req: NextRequest,
  session: Session
) => Promise<NextResponse>;

/**
 * Handler for routes WITH dynamic params (Next.js 15 async params)
 */
type ParamsHandler<T extends Record<string, string>> = (
  req: NextRequest,
  session: Session,
  context: { params: Promise<T> }
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
 * // Basic auth check (no dynamic params)
 * export const GET = withAuth(async (req, session) => {
 *   return NextResponse.json({ success: true, data: { user: session.user } });
 * });
 *
 * @example
 * // With dynamic params (Next.js 15)
 * export const GET = withAuth<{ id: string }>(
 *   async (req, session, context) => {
 *     const { id } = await context.params;
 *     // Handler logic
 *   },
 *   { permissions: ['resource:read'] }
 * );
 */
// Overload for routes WITHOUT dynamic params
export function withAuth(
  handler: SimpleHandler,
  options?: WithAuthOptions
): (req: NextRequest) => Promise<NextResponse>;

// Overload for routes WITH dynamic params
export function withAuth<T extends Record<string, string>>(
  handler: ParamsHandler<T>,
  options?: WithAuthOptions
): (req: NextRequest, context: { params: Promise<T> }) => Promise<NextResponse>;

// Implementation
export function withAuth<T extends Record<string, string>>(
  handler: SimpleHandler | ParamsHandler<T>,
  options: WithAuthOptions = {}
): (req: NextRequest, context?: { params: Promise<T> }) => Promise<NextResponse> {
  return async (req: NextRequest, context?: { params: Promise<T> }) => {
    try {
      // Get session
      const session = await auth();

      // Check authentication
      if (!session?.user) {
        if (options.allowUnauthenticated) {
          // Allow through without session
          if (context) {
            return (handler as ParamsHandler<T>)(req, session as Session, context);
          }
          return (handler as SimpleHandler)(req, session as Session);
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
      if (context) {
        return (handler as ParamsHandler<T>)(req, session, context);
      }
      return (handler as SimpleHandler)(req, session);
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
