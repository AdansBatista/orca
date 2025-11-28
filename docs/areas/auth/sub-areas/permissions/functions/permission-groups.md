# Permission Groups

> **Sub-Area**: [Permissions](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Organizes permissions into logical groups by functional area for easier management and display. Groups appear in the role permission editor UI, allowing admins to grant/revoke entire groups at once.

---

## Core Requirements

- [ ] Define permission groups by functional area
- [ ] List all permissions within each group
- [ ] Provide getPermissionsByGroup(group) utility
- [ ] Support group-level grant/revoke in UI
- [ ] Display groups in logical order

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/permissions/groups` | `settings:manage_roles` | List permission groups |

---

## Data Model

Groups defined in TypeScript constants:

```typescript
// lib/auth/permissionGroups.ts
export const PERMISSION_GROUPS = {
  patient: {
    name: 'Patient Data',
    description: 'Access to patient records and PHI',
    permissions: [
      'patient:view_phi',
      'patient:edit_phi',
      'patient:export',
      'patient:delete',
      'patient:merge',
    ],
  },
  appointment: {
    name: 'Appointments',
    description: 'Scheduling and appointment management',
    permissions: [
      'appointment:read',
      'appointment:create',
      'appointment:update',
      'appointment:delete',
    ],
  },
  clinical: {
    name: 'Clinical',
    description: 'Treatment, imaging, and lab work',
    permissions: [
      'treatment:read',
      'treatment:create',
      'treatment:update',
      'treatment:delete',
      'imaging:read',
      'imaging:create',
      'imaging:delete',
      'lab:read',
      'lab:create',
      'lab:update',
    ],
  },
  financial: {
    name: 'Financial',
    description: 'Billing, payments, and financial operations',
    permissions: [
      'financial:view_rates',
      'financial:edit_rates',
      'financial:process_refunds',
      'financial:write_off',
      'financial:override_price',
      'billing:read',
      'billing:create',
      'billing:update',
      'billing:delete',
    ],
  },
  reports: {
    name: 'Reports',
    description: 'Report viewing and export',
    permissions: [
      'reports:view_financial',
      'reports:view_clinical',
      'reports:export',
      'reports:schedule',
    ],
  },
  admin: {
    name: 'Administration',
    description: 'User and system management',
    permissions: [
      'audit:view_logs',
      'settings:manage_users',
      'settings:manage_roles',
      'settings:manage_clinic',
    ],
  },
  multi_clinic: {
    name: 'Multi-Clinic',
    description: 'Cross-clinic access',
    permissions: [
      'multi_clinic:switch',
      'multi_clinic:view_all',
      'multi_clinic:report_all',
    ],
  },
} as const;
```

---

## Business Rules

- Groups are display-only, not enforced
- Individual permissions still checked at runtime
- Group order in UI: Patient → Appointment → Clinical → Financial → Reports → Admin → Multi-Clinic
- Super admin has all permissions (no per-group display needed)

---

## Dependencies

**Depends On:**
- Permission Structure

**Required By:**
- Role permission editor UI
- Permission Matrix

---

## Notes

- Groups help organize UI, don't affect authorization
- Consider: collapsible groups in permission editor
- Consider: search/filter permissions across groups
