# Role Definitions

> **Sub-Area**: [Role System](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Defines the 7 system roles in Orca with their codes, display names, descriptions, and scope. System roles are protected and cannot be deleted. Each role represents a distinct user persona with specific access patterns.

---

## Core Requirements

- [ ] Define 7 system roles with unique codes
- [ ] Store role metadata (name, description, scope)
- [ ] Mark system roles as protected (isSystem=true)
- [ ] Seed database with default roles on initialization
- [ ] Provide role lookup by code
- [ ] Support future custom roles (isSystem=false)

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/roles` | `settings:manage_roles` | List all roles |
| GET | `/api/roles/[code]` | `settings:manage_roles` | Get role by code |

---

## Data Model

```prisma
model Role {
  id          String    @id @default(auto()) @map("_id") @db.ObjectId
  name        String    // Display name: "Clinic Admin"
  code        String    @unique // System code: "clinic_admin"
  description String?
  isSystem    Boolean   @default(false)
  scope       RoleScope @default(CLINIC)
  permissions String[]  // Permission codes assigned

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@index([code])
}

enum RoleScope {
  GLOBAL       // All clinics (super_admin)
  MULTI_CLINIC // Multiple assigned clinics
  CLINIC       // Single clinic
}
```

---

## Business Rules

### System Role Definitions

| Code | Name | Scope | Description |
|------|------|-------|-------------|
| `super_admin` | Super Admin | GLOBAL | Full system access, all clinics |
| `clinic_admin` | Clinic Admin | MULTI_CLINIC | Full access within assigned clinics |
| `doctor` | Doctor | CLINIC | Clinical access with treatment authority |
| `clinical_staff` | Clinical Staff | CLINIC | Patient care support |
| `front_desk` | Front Desk | CLINIC | Scheduling and communications |
| `billing` | Billing | CLINIC | Financial operations |
| `read_only` | Read Only | CLINIC | View-only access |

- System roles (isSystem=true) cannot be deleted
- System role codes cannot be modified
- System role permissions can be customized per clinic
- Custom roles can be created at clinic level (isSystem=false)

---

## Dependencies

**Depends On:**
- Database seed script

**Required By:**
- Role Hierarchy
- Role Assignment (Staff Management)
- Permission Matrix

---

## Notes

- Roles seeded in database initialization
- TypeScript enum for type safety: `type RoleCode = 'super_admin' | 'clinic_admin' | ...`
- Role hierarchy defined separately (see Role Hierarchy function)
