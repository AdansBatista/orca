'use client';

import { useSession } from 'next-auth/react';
import type { ReactNode } from 'react';

import { hasPermission, hasAnyPermission, hasAllPermissions } from '@/lib/auth';
import type { PermissionCode } from '@/lib/auth';

interface PermissionGateProps {
  /** Single permission to check */
  permission?: PermissionCode;
  /** Multiple permissions - user needs at least one */
  anyOf?: PermissionCode[];
  /** Multiple permissions - user needs all */
  allOf?: PermissionCode[];
  /** Content to show if user has permission */
  children: ReactNode;
  /** Content to show if user doesn't have permission */
  fallback?: ReactNode;
}

/**
 * PermissionGate - Conditionally render content based on user permissions
 *
 * @example
 * // Single permission
 * <PermissionGate permission="patients:write">
 *   <Button>Add Patient</Button>
 * </PermissionGate>
 *
 * @example
 * // Any of multiple permissions
 * <PermissionGate anyOf={['patients:write', 'patients:full']}>
 *   <EditForm />
 * </PermissionGate>
 *
 * @example
 * // With fallback
 * <PermissionGate permission="billing:full" fallback={<ReadOnlyView />}>
 *   <EditableView />
 * </PermissionGate>
 */
export function PermissionGate({
  permission,
  anyOf,
  allOf,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { data: session, status } = useSession();

  // Still loading session
  if (status === 'loading') {
    return null;
  }

  // Not authenticated
  if (!session?.user) {
    return <>{fallback}</>;
  }

  const { role } = session.user;
  let hasAccess = false;

  // Check single permission
  if (permission) {
    hasAccess = hasPermission(role, permission);
  }
  // Check any of permissions
  else if (anyOf && anyOf.length > 0) {
    hasAccess = hasAnyPermission(role, anyOf);
  }
  // Check all of permissions
  else if (allOf && allOf.length > 0) {
    hasAccess = hasAllPermissions(role, allOf);
  }
  // No permission specified - allow
  else {
    hasAccess = true;
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
