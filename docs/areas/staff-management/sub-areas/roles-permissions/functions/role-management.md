# Role Management

> **Sub-Area**: [Roles & Permissions](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Create, modify, and manage roles that define user access levels within the practice management system. Provides system-defined roles for orthodontic practices, role hierarchy management, and role assignment to users. Integrates with the Auth area for enforcement.

---

## Core Requirements

- [ ] View and manage all roles in the system
- [ ] Create new custom roles
- [ ] Modify role properties and settings
- [ ] Activate/deactivate roles
- [ ] Manage role hierarchy and inheritance
- [ ] Assign/unassign roles to users
- [ ] Prevent deletion of system roles

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/roles` | `roles:read` | List all roles |
| GET | `/api/roles/:id` | `roles:read` | Get role details |
| POST | `/api/roles` | `roles:create` | Create role |
| PUT | `/api/roles/:id` | `roles:update` | Update role |
| DELETE | `/api/roles/:id` | `roles:delete` | Delete role |
| GET | `/api/roles/:id/users` | `roles:read` | Get users with role |
| PUT | `/api/roles/:id/activate` | `roles:update` | Activate role |
| PUT | `/api/roles/:id/deactivate` | `roles:update` | Deactivate role |

---

## Data Model

```prisma
model Role {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String?  @db.ObjectId  // null for system roles

  name          String
  code          String
  description   String?
  isSystemRole  Boolean  @default(false)
  isActive      Boolean  @default(true)

  level         Int      @default(0)  // Hierarchy level
  parentRoleId  String?  @db.ObjectId

  settings      RoleSettings?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  @@unique([clinicId, code])
  @@index([code])
  @@index([isSystemRole])
}

type RoleSettings {
  canViewAllLocations    Boolean @default(false)
  canAccessFinancial     Boolean @default(false)
  canAccessClinical      Boolean @default(false)
  requiresMFA            Boolean @default(false)
  sessionTimeout         Int?
}
```

---

## Business Rules

- System roles (isSystemRole=true) cannot be deleted
- System roles can only be deactivated, not modified
- Custom roles must have unique code per clinic
- Role hierarchy: lower level = higher privilege (0 = highest)
- Users can only create/assign roles at or below their level
- Role deletion requires no active users assigned
- All role changes must be audit logged

### System Roles (Pre-defined)

| Role | Code | Level | Description |
|------|------|-------|-------------|
| Super Admin | `super_admin` | 0 | Full system access |
| Clinic Admin | `clinic_admin` | 1 | Full clinic access |
| Doctor | `doctor` | 2 | Clinical authority |
| Clinical Staff | `clinical_staff` | 3 | Patient care |
| Treatment Coordinator | `treatment_coordinator` | 3 | New patient focus |
| Front Desk | `front_desk` | 4 | Reception/scheduling |
| Billing | `billing` | 4 | Financial operations |
| Read Only | `read_only` | 5 | View-only access |

---

## Dependencies

**Depends On:**
- Authentication (user context)

**Required By:**
- Permission Assignment
- Custom Roles
- Multi-Location Access
- All feature access control

---

## Notes

- Super admin role has implicit full access (cannot be restricted)
- Consider: role cloning for creating similar custom roles
- Role changes take effect on next session/request
- Audit all role operations for compliance
