/**
 * Permission Definitions
 *
 * Comprehensive list of all valid permissions in the system.
 * Used for validation and permission management.
 */

export type PermissionKey = string;

export interface PermissionDefinition {
  label: string;
  description: string;
  category: string;
}

/**
 * All valid permissions in the system
 */
export const PERMISSION_DEFINITIONS: Record<PermissionKey, PermissionDefinition> = {
  // Patient Management
  'patients:view': {
    label: 'View Patients',
    description: 'View patient records and basic information',
    category: 'Patients',
  },
  'patients:edit': {
    label: 'Edit Patients',
    description: 'Create and modify patient records',
    category: 'Patients',
  },
  'patients:full': {
    label: 'Full Patient Access',
    description: 'Full access including delete and sensitive operations',
    category: 'Patients',
  },

  // Appointments
  'appointments:view': {
    label: 'View Appointments',
    description: 'View appointment schedules',
    category: 'Appointments',
  },
  'appointments:edit': {
    label: 'Edit Appointments',
    description: 'Create and modify appointments',
    category: 'Appointments',
  },
  'appointments:full': {
    label: 'Full Appointment Access',
    description: 'Full access including cancellation and rescheduling',
    category: 'Appointments',
  },

  // Treatments
  'treatments:view': {
    label: 'View Treatments',
    description: 'View treatment plans and records',
    category: 'Treatments',
  },
  'treatments:edit': {
    label: 'Edit Treatments',
    description: 'Create and modify treatment plans',
    category: 'Treatments',
  },
  'treatments:full': {
    label: 'Full Treatment Access',
    description: 'Full access including approvals and clinical decisions',
    category: 'Treatments',
  },

  // Billing
  'billing:view': {
    label: 'View Billing',
    description: 'View invoices and payment information',
    category: 'Billing',
  },
  'billing:edit': {
    label: 'Edit Billing',
    description: 'Create invoices and process payments',
    category: 'Billing',
  },
  'billing:full': {
    label: 'Full Billing Access',
    description: 'Full access including refunds and adjustments',
    category: 'Billing',
  },

  // Reports
  'reports:view': {
    label: 'View Reports',
    description: 'View standard reports',
    category: 'Reports',
  },
  'reports:edit': {
    label: 'Create Reports',
    description: 'Create and customize reports',
    category: 'Reports',
  },
  'reports:full': {
    label: 'Full Report Access',
    description: 'Full access including financial and sensitive reports',
    category: 'Reports',
  },

  // Documents
  'documents:view': {
    label: 'View Documents',
    description: 'View uploaded documents and files',
    category: 'Documents',
  },
  'documents:edit': {
    label: 'Edit Documents',
    description: 'Upload and modify documents',
    category: 'Documents',
  },
  'documents:full': {
    label: 'Full Document Access',
    description: 'Full access including deletion and sensitive documents',
    category: 'Documents',
  },

  // Messages
  'messages:view': {
    label: 'View Messages',
    description: 'View internal and patient messages',
    category: 'Communications',
  },
  'messages:edit': {
    label: 'Send Messages',
    description: 'Send messages to patients and staff',
    category: 'Communications',
  },
  'messages:full': {
    label: 'Full Message Access',
    description: 'Full access including message templates and bulk messaging',
    category: 'Communications',
  },

  // Settings
  'settings:view': {
    label: 'View Settings',
    description: 'View clinic and system settings',
    category: 'Administration',
  },
  'settings:edit': {
    label: 'Edit Settings',
    description: 'Modify clinic settings',
    category: 'Administration',
  },
  'settings:full': {
    label: 'Full Settings Access',
    description: 'Full access including system configuration',
    category: 'Administration',
  },

  // Users
  'users:view': {
    label: 'View Users',
    description: 'View user accounts and profiles',
    category: 'Administration',
  },
  'users:edit': {
    label: 'Edit Users',
    description: 'Create and modify user accounts',
    category: 'Administration',
  },
  'users:full': {
    label: 'Full User Access',
    description: 'Full access including deactivation and role assignment',
    category: 'Administration',
  },

  // Staff
  'staff:view': {
    label: 'View Staff',
    description: 'View staff profiles and schedules',
    category: 'Staff Management',
  },
  'staff:edit': {
    label: 'Edit Staff',
    description: 'Modify staff profiles and assignments',
    category: 'Staff Management',
  },
  'staff:full': {
    label: 'Full Staff Access',
    description: 'Full access including hiring and termination',
    category: 'Staff Management',
  },
  'staff:compensation': {
    label: 'View Compensation',
    description: 'View and edit staff compensation data',
    category: 'Staff Management',
  },

  // Roles
  'roles:view': {
    label: 'View Roles',
    description: 'View role definitions and permissions',
    category: 'Administration',
  },
  'roles:edit': {
    label: 'Edit Roles',
    description: 'Create and modify custom roles',
    category: 'Administration',
  },
  'roles:full': {
    label: 'Full Role Access',
    description: 'Full access including system role modification',
    category: 'Administration',
  },

  // Audit
  'audit:view': {
    label: 'View Audit Logs',
    description: 'View audit trail and activity logs',
    category: 'Administration',
  },
  'audit:edit': {
    label: 'Manage Audit',
    description: 'Configure audit settings',
    category: 'Administration',
  },
  'audit:full': {
    label: 'Full Audit Access',
    description: 'Full access including audit exports and retention',
    category: 'Administration',
  },

  // Schedule
  'schedule:view': {
    label: 'View Schedules',
    description: 'View staff schedules and availability',
    category: 'Scheduling',
  },
  'schedule:edit': {
    label: 'Edit Schedules',
    description: 'Create and modify staff schedules',
    category: 'Scheduling',
  },
  'schedule:full': {
    label: 'Full Schedule Access',
    description: 'Full access including overtime approval and time-off management',
    category: 'Scheduling',
  },

  // PHI (Protected Health Information)
  'phi:view': {
    label: 'View PHI',
    description: 'View protected health information',
    category: 'Compliance',
  },
  'phi:edit': {
    label: 'Edit PHI',
    description: 'Modify protected health information',
    category: 'Compliance',
  },
  'phi:full': {
    label: 'Full PHI Access',
    description: 'Full access to all protected health information',
    category: 'Compliance',
  },
};

/**
 * Get all permission keys
 */
export function getAllPermissionKeys(): PermissionKey[] {
  return Object.keys(PERMISSION_DEFINITIONS);
}

/**
 * Get permissions by category
 */
export function getPermissionsByCategory(): Record<string, PermissionKey[]> {
  const byCategory: Record<string, PermissionKey[]> = {};

  for (const [key, def] of Object.entries(PERMISSION_DEFINITIONS)) {
    if (!byCategory[def.category]) {
      byCategory[def.category] = [];
    }
    byCategory[def.category].push(key);
  }

  return byCategory;
}

/**
 * Validate if a permission key is valid
 */
export function isValidPermission(permission: string): permission is PermissionKey {
  return permission in PERMISSION_DEFINITIONS;
}

/**
 * Validate an array of permissions
 */
export function validatePermissions(permissions: string[]): {
  valid: string[];
  invalid: string[];
} {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const p of permissions) {
    if (isValidPermission(p)) {
      valid.push(p);
    } else {
      invalid.push(p);
    }
  }

  return { valid, invalid };
}
