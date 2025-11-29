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
