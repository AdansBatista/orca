/**
 * System roles for Orca
 * Matches the 7 roles defined in docs/areas/auth/README.md
 */
export const SYSTEM_ROLES = [
  {
    code: 'super_admin',
    name: 'Super Admin',
    description: 'Full system access across all clinics',
    isSystem: true,
    level: 100,
  },
  {
    code: 'clinic_admin',
    name: 'Clinic Admin',
    description: 'Full access within assigned clinic(s)',
    isSystem: true,
    level: 90,
  },
  {
    code: 'doctor',
    name: 'Doctor',
    description: 'Clinical access with treatment authority',
    isSystem: true,
    level: 80,
  },
  {
    code: 'clinical_staff',
    name: 'Clinical Staff',
    description: 'Patient care support',
    isSystem: true,
    level: 60,
  },
  {
    code: 'front_desk',
    name: 'Front Desk',
    description: 'Scheduling and communications',
    isSystem: true,
    level: 50,
  },
  {
    code: 'billing',
    name: 'Billing',
    description: 'Financial operations',
    isSystem: true,
    level: 50,
  },
  {
    code: 'read_only',
    name: 'Read Only',
    description: 'View-only access',
    isSystem: true,
    level: 10,
  },
] as const;

export type RoleCode = (typeof SYSTEM_ROLES)[number]['code'];

/**
 * Get role by code
 */
export function getRoleByCode(code: RoleCode) {
  return SYSTEM_ROLES.find((r) => r.code === code);
}

/**
 * Custom roles for demo/testing purposes
 * These are examples of organization-specific roles
 */
export const CUSTOM_ROLES = [
  {
    code: 'senior_assistant',
    name: 'Senior Assistant',
    description: 'Experienced clinical assistant with additional responsibilities',
    isSystem: false,
    permissions: [
      'patients:read',
      'patients:update',
      'appointments:read',
      'appointments:update',
      'treatment:read',
      'imaging:read',
      'imaging:create',
      'inventory:read',
      'inventory:update',
    ],
  },
  {
    code: 'treatment_coordinator',
    name: 'Treatment Coordinator',
    description: 'Handles new patient consultations and financial discussions',
    isSystem: false,
    permissions: [
      'patients:create',
      'patients:read',
      'patients:update',
      'appointments:*',
      'treatment:read',
      'billing:read',
      'communications:*',
      'leads:*',
      'reports:read',
    ],
  },
  {
    code: 'office_manager',
    name: 'Office Manager',
    description: 'Manages day-to-day operations and staff coordination',
    isSystem: false,
    permissions: [
      'patients:read',
      'patients:update',
      'appointments:*',
      'staff:read',
      'staff:update',
      'billing:read',
      'reports:*',
      'communications:*',
      'leads:*',
      'inventory:*',
    ],
  },
  {
    code: 'insurance_specialist',
    name: 'Insurance Specialist',
    description: 'Handles insurance claims, verification, and billing coordination',
    isSystem: false,
    permissions: [
      'patients:read',
      'billing:*',
      'insurance:*',
      'reports:read',
      'appointments:read',
    ],
  },
];
