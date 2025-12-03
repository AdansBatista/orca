/**
 * Permission definitions for Orca
 * Format: resource:action
 */

export const PERMISSION_RESOURCES = [
  'patients',
  'appointments',
  'treatment',
  'billing',
  'insurance',
  'staff',
  'settings',
  'reports',
  'communications',
  'leads',
  'imaging',
  'lab',
  'inventory',
  'audit',
  'compliance',
  // Resources Management
  'equipment',
  'suppliers',
  'maintenance',
  'rooms',
  'sterilization',
  // Booking & Scheduling
  'booking',
] as const;

export const PERMISSION_ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'manage', // Full CRUD + admin actions
] as const;

export type PermissionResource = (typeof PERMISSION_RESOURCES)[number];
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

/**
 * Role-to-permission mappings
 */
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'], // Full access to everything

  clinic_admin: [
    'patients:*',
    'appointments:*',
    'treatment:*',
    'billing:*',
    'insurance:*',
    'staff:read',
    'staff:update',
    'settings:manage',
    'reports:*',
    'communications:*',
    'leads:*',
    'imaging:*',
    'lab:*',
    'inventory:*',
    'audit:read',
    // Resources Management
    'equipment:*',
    'suppliers:*',
    'maintenance:*',
    'rooms:*',
    'sterilization:*',
    // Booking & Scheduling
    'booking:*',
  ],

  doctor: [
    'patients:*',
    'appointments:*',
    'treatment:*',
    'imaging:*',
    'lab:create',
    'lab:read',
    'lab:update',
    'communications:read',
    'reports:read',
    // Resources Management (read + request maintenance)
    'equipment:read',
    'suppliers:read',
    'maintenance:read',
    'maintenance:create',
    'rooms:read',
    'sterilization:read',
    // Booking & Scheduling (view, create, modify)
    'booking:read',
    'booking:create',
    'booking:update',
  ],

  clinical_staff: [
    'patients:read',
    'patients:update',
    'appointments:read',
    'appointments:update',
    'treatment:read',
    'imaging:read',
    'imaging:create',
    'lab:read',
    'inventory:read',
    'inventory:update',
    // Resources Management (read access + sterilization for clinical duties)
    'equipment:read',
    'suppliers:read',
    'maintenance:read',
    'rooms:read',
    'sterilization:read',
    'sterilization:create',
    'sterilization:update',
    // Booking & Scheduling (view, create, modify for clinical duties)
    'booking:read',
    'booking:create',
    'booking:update',
  ],

  front_desk: [
    'patients:create',
    'patients:read',
    'patients:update',
    'appointments:*',
    'communications:*',
    'leads:*',
    'billing:read',
    // Resources Management (read access for scheduling rooms/equipment)
    'equipment:read',
    'rooms:read',
    // Booking & Scheduling (full access for scheduling duties)
    'booking:*',
  ],

  billing: [
    'patients:read',
    'billing:*',
    'insurance:*',
    'reports:read',
    'appointments:read',
    // Booking & Scheduling (view only for billing context)
    'booking:read',
  ],

  read_only: [
    'patients:read',
    'appointments:read',
    'treatment:read',
    'reports:read',
    // Booking & Scheduling (view only)
    'booking:read',
  ],
};

/**
 * Get permissions for a role
 */
export function getPermissionsForRole(roleCode: string): string[] {
  return ROLE_PERMISSIONS[roleCode] ?? [];
}

/**
 * Generate all possible permission codes
 */
export function generateAllPermissions(): string[] {
  const permissions: string[] = [];
  for (const resource of PERMISSION_RESOURCES) {
    for (const action of PERMISSION_ACTIONS) {
      permissions.push(`${resource}:${action}`);
    }
    permissions.push(`${resource}:*`); // Wildcard for resource
  }
  return permissions;
}
