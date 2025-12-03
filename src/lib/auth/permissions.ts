import type { UserRole } from '@prisma/client';
import { ROLE_PERMISSIONS, ROLE_HIERARCHY, type PermissionCode } from './types';

/**
 * Check if a role has a specific permission
 * Supports:
 * - Wildcard '*' (all permissions)
 * - Resource wildcard 'resource:*' (all actions on resource)
 * - Legacy levels: view < edit < full
 * - CRUD actions: read, create, update, delete, manage
 */
export function hasPermission(
  role: UserRole,
  requiredPermission: PermissionCode
): boolean {
  const permissions = ROLE_PERMISSIONS[role];

  // Super admin has all permissions
  if (permissions.includes('*')) {
    return true;
  }

  // Parse the required permission
  const [area, requiredAction] = requiredPermission.split(':');

  // Check for exact match
  if (permissions.includes(requiredPermission)) {
    return true;
  }

  // Check for resource wildcard (e.g., 'booking:*' grants 'booking:read')
  if (permissions.includes(`${area}:*`)) {
    return true;
  }

  // Check for legacy permission levels (view < edit < full)
  const levelHierarchy = ['view', 'edit', 'full'];
  const requiredLevelIndex = levelHierarchy.indexOf(requiredAction);

  if (requiredLevelIndex !== -1) {
    // Check if user has a higher level for this area
    for (let i = requiredLevelIndex; i < levelHierarchy.length; i++) {
      if (permissions.includes(`${area}:${levelHierarchy[i]}`)) {
        return true;
      }
    }
  }

  // Map CRUD actions to legacy levels for backwards compatibility
  // read -> view, create/update -> edit, delete/manage -> full
  const crudToLegacy: Record<string, string> = {
    read: 'view',
    create: 'edit',
    update: 'edit',
    delete: 'full',
    manage: 'full',
  };

  const mappedLevel = crudToLegacy[requiredAction];
  if (mappedLevel) {
    const mappedIndex = levelHierarchy.indexOf(mappedLevel);
    for (let i = mappedIndex; i < levelHierarchy.length; i++) {
      if (permissions.includes(`${area}:${levelHierarchy[i]}`)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  role: UserRole,
  permissions: PermissionCode[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  role: UserRole,
  permissions: PermissionCode[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if one role is higher than another in the hierarchy
 */
export function isRoleHigherOrEqual(role: UserRole, thanRole: UserRole): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY[thanRole];
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): PermissionCode[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if user can access a specific clinic
 */
export function canAccessClinic(
  userClinicId: string,
  userClinicIds: string[],
  targetClinicId: string,
  role: UserRole
): boolean {
  // Super admin can access all clinics
  if (role === 'super_admin') {
    return true;
  }

  // Check if target clinic is in user's assigned clinics
  return userClinicIds.includes(targetClinicId) || userClinicId === targetClinicId;
}
