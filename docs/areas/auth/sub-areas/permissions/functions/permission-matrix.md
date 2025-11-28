# Permission Matrix

> **Sub-Area**: [Permissions](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Defines the complete mapping of roles to permissions. Each role has a default set of permissions that determine access across all areas. The matrix is the authoritative source for role capabilities.

---

## Core Requirements

- [ ] Define default permissions for each role
- [ ] Provide getPermissionsForRole(role) function
- [ ] Support role permission customization per clinic
- [ ] Seed database with default role permissions
- [ ] Display matrix in admin UI for reference

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/roles/[code]/permissions` | `settings:manage_roles` | Get role permissions |
| PUT | `/api/roles/[code]/permissions` | `settings:manage_roles` | Update role permissions |

---

## Data Model

Permissions stored on Role model:

```prisma
model Role {
  id          String   @id
  code        String   @unique
  permissions String[] // Array of permission codes
  // ...
}
```

---

## Business Rules

### Default Role Permissions

```typescript
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleCode, string[]> = {
  super_admin: [
    // All permissions - generated from all defined permissions
    ...ALL_PERMISSIONS,
  ],

  clinic_admin: [
    // Patient
    'patient:view_phi', 'patient:edit_phi', 'patient:export', 'patient:merge',
    // Appointments
    'appointment:read', 'appointment:create', 'appointment:update', 'appointment:delete',
    // Clinical
    'treatment:read', 'treatment:create', 'treatment:update', 'treatment:delete',
    'imaging:read', 'imaging:create', 'imaging:delete',
    'lab:read', 'lab:create', 'lab:update',
    // Financial
    'financial:view_rates', 'financial:edit_rates', 'financial:process_refunds',
    'billing:read', 'billing:create', 'billing:update', 'billing:delete',
    // Reports & Admin
    'reports:view_financial', 'reports:view_clinical', 'reports:export',
    'audit:view_logs', 'settings:manage_users', 'settings:manage_clinic',
    'multi_clinic:switch',
  ],

  doctor: [
    'patient:view_phi', 'patient:edit_phi',
    'appointment:read', 'appointment:create', 'appointment:update',
    'treatment:read', 'treatment:create', 'treatment:update',
    'imaging:read', 'imaging:create',
    'lab:read', 'lab:create',
    'reports:view_clinical',
    'multi_clinic:switch',
  ],

  clinical_staff: [
    'patient:view_phi', 'patient:edit_phi',
    'appointment:read', 'appointment:update',
    'treatment:read',
    'imaging:read', 'imaging:create',
    'lab:read',
  ],

  front_desk: [
    'patient:view_phi',
    'appointment:read', 'appointment:create', 'appointment:update', 'appointment:delete',
  ],

  billing: [
    'patient:view_phi',
    'financial:view_rates', 'financial:process_refunds',
    'billing:read', 'billing:create', 'billing:update',
    'reports:view_financial', 'reports:export',
  ],

  read_only: [
    // No special permissions - view access controlled by area access levels
  ],
};
```

### Matrix Summary Table

| Permission | Super Admin | Clinic Admin | Doctor | Clinical | Front Desk | Billing | Read Only |
|------------|:-----------:|:------------:|:------:|:--------:|:----------:|:-------:|:---------:|
| patient:view_phi | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | - |
| patient:edit_phi | ✓ | ✓ | ✓ | ✓ | - | - | - |
| patient:export | ✓ | ✓ | - | - | - | - | - |
| treatment:create | ✓ | ✓ | ✓ | - | - | - | - |
| billing:create | ✓ | ✓ | - | - | - | ✓ | - |
| settings:manage_users | ✓ | ✓ | - | - | - | - | - |

---

## Dependencies

**Depends On:**
- Role Definitions
- Permission Structure
- Permission Groups

**Required By:**
- withAuth wrapper
- PermissionGate component
- Role assignment

---

## Notes

- Matrix seeded on database initialization
- Can be customized per clinic (stored separately)
- Read Only role relies on area access levels, not individual permissions
