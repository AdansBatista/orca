# Permission Assignment

> **Sub-Area**: [Roles & Permissions](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Assign granular permissions to roles for fine-tuned access control. Provides a comprehensive permission registry organized by category, bulk permission assignment, and permission inheritance from parent roles. Enables least-privilege access configuration.

---

## Core Requirements

- [ ] View all available permissions by category
- [ ] Assign permissions to roles
- [ ] Remove permissions from roles
- [ ] Bulk permission assignment
- [ ] Permission inheritance from parent roles
- [ ] Compute effective permissions for users
- [ ] Permission dependency validation

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/permissions` | `permissions:read` | List all permissions |
| GET | `/api/permissions/categories` | `permissions:read` | Get by category |
| GET | `/api/roles/:id/permissions` | `roles:read` | Get role permissions |
| PUT | `/api/roles/:id/permissions` | `permissions:manage` | Update permissions |
| POST | `/api/roles/:id/permissions/bulk` | `permissions:manage` | Bulk assign |
| GET | `/api/users/:userId/permissions` | `permissions:read` | Get user effective permissions |
| POST | `/api/permissions/check` | - | Check permission (system) |

---

## Data Model

```prisma
model RolePermission {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  roleId        String   @db.ObjectId
  permission    String   // e.g., "patient:read"
  granted       Boolean  @default(true)
  conditions    PermissionConditions?

  grantedBy String?  @db.ObjectId
  createdAt DateTime @default(now())

  @@unique([roleId, permission])
  @@index([permission])
}

model Permission {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  code          String   @unique  // e.g., "patient:read"
  name          String
  description   String?
  category      PermissionCategory
  sensitivity   PermissionSensitivity @default(NORMAL)
  requiresAudit Boolean  @default(false)
  module        String
  resource      String
  action        String
  dependsOn     String[]

  @@index([category])
  @@index([module])
}

enum PermissionCategory {
  PATIENT
  TREATMENT
  SCHEDULING
  FINANCIAL
  STAFF
  REPORTS
  ADMIN
  SYSTEM
}
```

---

## Business Rules

- Permissions follow `{resource}:{action}` naming convention
- Permission inheritance: child roles inherit parent permissions
- Explicit deny overrides inherited grant
- Some permissions have dependencies (e.g., update requires read)
- Sensitive permissions require additional audit logging
- Super admin bypasses permission checks
- Permission changes logged for compliance

### Permission Categories

| Category | Examples | Description |
|----------|----------|-------------|
| Patient | `patient:read`, `patient:create` | Patient records |
| Treatment | `treatment:read`, `treatment:approve` | Treatment plans |
| Scheduling | `appointment:create`, `appointment:cancel` | Appointments |
| Financial | `billing:read`, `payment:process` | Billing/payments |
| Staff | `staff:read`, `staff:manage` | Staff management |
| Reports | `reports:clinical`, `reports:financial` | Reporting |
| Admin | `settings:manage`, `roles:manage` | Administration |

### Permission Actions

- `read` - View records
- `create` - Create new records
- `update` - Modify records
- `delete` - Remove records
- `export` - Export data
- `manage` - Full control

---

## Dependencies

**Depends On:**
- Role Management

**Required By:**
- All feature authorization
- Access Audit
- UI component visibility

---

## Notes

- Permission registry seeded on application startup
- New features should register their permissions
- Consider: conditional permissions (time-based, own-records-only)
- Effective permissions computed at runtime from all role assignments
