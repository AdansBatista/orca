# Role Hierarchy

> **Sub-Area**: [Role System](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Defines the hierarchical relationship between roles for determining management authority. Higher roles can manage (assign/revoke) lower roles. Users can only assign roles at or below their own level in the hierarchy.

---

## Core Requirements

- [ ] Define numeric hierarchy level for each role
- [ ] Implement canManageRole(userRole, targetRole) check
- [ ] Prevent users from assigning higher roles than their own
- [ ] Allow same-level assignment only for specific roles
- [ ] Provide getRolesBelow(role) utility

---

## API Endpoints

No dedicated endpoints - hierarchy logic used in role assignment validation.

---

## Data Model

Hierarchy defined in TypeScript constants (not database):

```typescript
// lib/auth/roleHierarchy.ts
export const ROLE_HIERARCHY: Record<RoleCode, number> = {
  super_admin: 100,
  clinic_admin: 80,
  doctor: 60,
  clinical_staff: 40,
  front_desk: 40,
  billing: 40,
  read_only: 20,
};

export function canManageRole(userRole: RoleCode, targetRole: RoleCode): boolean {
  return ROLE_HIERARCHY[userRole] > ROLE_HIERARCHY[targetRole];
}

export function getRolesBelow(role: RoleCode): RoleCode[] {
  const level = ROLE_HIERARCHY[role];
  return Object.entries(ROLE_HIERARCHY)
    .filter(([_, l]) => l < level)
    .map(([code]) => code as RoleCode);
}
```

---

## Business Rules

### Hierarchy Structure

```
Level 100: super_admin
    │
Level 80:  clinic_admin
    │
Level 60:  doctor
    │
Level 40:  clinical_staff, front_desk, billing (same level)
    │
Level 20:  read_only
```

- Super Admin can manage all roles
- Clinic Admin can manage all except super_admin
- Doctor can manage clinical_staff, front_desk, billing, read_only
- Level-40 roles can only manage read_only
- Same-level roles cannot manage each other (doctor cannot demote another doctor)
- Users cannot modify their own role

---

## Dependencies

**Depends On:**
- Role Definitions

**Required By:**
- Role assignment logic (Staff Management)
- User management UI (role dropdown filtering)

---

## Notes

- Hierarchy is code-defined, not database-driven
- Allows fast in-memory checks without DB queries
- Consider: custom hierarchy per clinic in future
