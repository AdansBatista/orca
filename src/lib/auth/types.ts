import type { UserRole } from '@prisma/client';

/**
 * Extended user type for session
 */
export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string; // Full name
  role: UserRole;
  clinicId: string;
  clinicIds: string[];
  avatar?: string | null;
}

/**
 * Permission code format: {area}:{action}
 * Examples: "patients:read", "appointments:write", "billing:full"
 */
export type PermissionCode = string;

/**
 * Permission levels
 */
export type PermissionLevel = 'none' | 'view' | 'edit' | 'full';

/**
 * Audit log action types
 */
export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'LOGIN_FAILED'
  | 'PASSWORD_CHANGE'
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'IMPORT'
  | 'APPROVE'
  | 'REJECT';

/**
 * Role hierarchy for permission checking
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 100,
  clinic_admin: 80,
  doctor: 60,
  clinical_staff: 40,
  front_desk: 30,
  billing: 30,
  read_only: 10,
};

/**
 * Default permissions by role
 */
export const ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
  super_admin: ['*'], // All permissions
  clinic_admin: [
    'patients:full',
    'appointments:full',
    'treatments:full',
    'billing:full',
    'reports:full',
    'documents:full',
    'messages:full',
    'settings:full',
    'users:full',
    'staff:full',
    'staff:compensation', // Access to view/edit compensation data
    'roles:full',
    'audit:view',
    'schedule:full',
  ],
  doctor: [
    'patients:full',
    'appointments:full',
    'treatments:full',
    'billing:view',
    'reports:view',
    'documents:full',
    'messages:full',
    'staff:view',
  ],
  clinical_staff: [
    'patients:edit',
    'appointments:edit',
    'treatments:view',
    'documents:edit',
    'messages:view',
    'staff:view',
  ],
  front_desk: [
    'patients:edit',
    'appointments:full',
    'billing:view',
    'documents:view',
    'messages:full',
    'staff:view',
  ],
  billing: [
    'patients:view',
    'appointments:view',
    'billing:full',
    'reports:view',
    'documents:view',
    'staff:view',
  ],
  read_only: [
    'patients:view',
    'appointments:view',
    'treatments:view',
    'billing:view',
    'reports:view',
    'documents:view',
    'staff:view',
  ],
};
