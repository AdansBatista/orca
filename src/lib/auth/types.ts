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
 * Supports both legacy levels (view/edit/full) and CRUD actions (read/create/update/delete/manage)
 */
export const ROLE_PERMISSIONS: Record<UserRole, PermissionCode[]> = {
  super_admin: ['*'], // All permissions
  clinic_admin: [
    // Legacy levels
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
    // CRUD actions for new modules
    'patients:*',
    'booking:*',
    'equipment:*',
    'suppliers:*',
    'maintenance:*',
    'rooms:*',
    'sterilization:*',
    'inventory:*',
    // Operations/Orchestration
    'ops:*',
    // Communications
    'comms:*',
    // CRM & Onboarding
    'leads:*',
    'forms:*',
    'records:*',
    // Treatment Management
    'treatment:*',
    // Imaging Management
    'imaging:*',
    // Lab
    'lab:*',
    // Payment Processing (new)
    'payment:*',
    'insurance:*',
    'collections:*',
  ],
  doctor: [
    // Legacy levels
    'patients:full',
    'appointments:full',
    'treatments:full',
    'billing:view',
    'reports:view',
    'documents:full',
    'messages:full',
    'staff:view',
    // CRUD actions
    'patients:*',
    'booking:read',
    'booking:create',
    'booking:update',
    'equipment:read',
    'rooms:read',
    // Operations/Orchestration
    'ops:view_dashboard',
    'ops:read',
    // Communications
    'comms:view_inbox',
    'comms:send_message',
    // Treatment Management (full access for doctors)
    'treatment:*',
    // Imaging Management (full access for doctors)
    'imaging:*',
    // Lab (create/read/update for doctors)
    'lab:create',
    'lab:read',
    'lab:update',
  ],
  clinical_staff: [
    // Legacy levels
    'patients:edit',
    'appointments:edit',
    'treatments:view',
    'documents:edit',
    'messages:view',
    'staff:view',
    // CRUD actions
    'patients:read',
    'patients:update',
    'booking:read',
    'booking:create',
    'booking:update',
    'equipment:read',
    'rooms:read',
    'sterilization:read',
    'sterilization:create',
    'sterilization:update',
    // Operations/Orchestration
    'ops:view_dashboard',
    'ops:read',
    // Communications
    'comms:view_inbox',
    'comms:send_message',
    // Treatment Management (read only for clinical staff)
    'treatment:read',
    // Imaging Management (read/create for clinical staff)
    'imaging:read',
    'imaging:create',
    // Lab (read access)
    'lab:read',
  ],
  front_desk: [
    // Legacy levels
    'patients:edit',
    'appointments:full',
    'billing:view',
    'documents:view',
    'messages:full',
    'staff:view',
    // CRUD actions
    'patients:create',
    'patients:read',
    'patients:update',
    'booking:*',
    'equipment:read',
    'rooms:read',
    // Operations/Orchestration
    'ops:view_dashboard',
    'ops:read',
    'ops:*', // Full ops access for front desk
    // Communications (full access for front desk)
    'comms:*',
    // CRM & Onboarding (full access for front desk)
    'leads:*',
    'forms:*',
    'records:*',
  ],
  billing: [
    // Legacy levels
    'patients:view',
    'appointments:view',
    'billing:full',
    'reports:view',
    'documents:view',
    'staff:view',
    // CRUD actions
    'patients:read',
    'booking:read',
    // Payment Processing (full access for billing role)
    'payment:*',
    'insurance:*',
    'collections:*',
  ],
  read_only: [
    // Legacy levels
    'patients:view',
    'appointments:view',
    'treatments:view',
    'billing:view',
    'reports:view',
    'documents:view',
    'staff:view',
    // CRUD actions
    'patients:read',
    'booking:read',
  ],
};
