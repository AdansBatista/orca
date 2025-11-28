# Custom Roles

> **Sub-Area**: [Roles & Permissions](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Create organization-specific roles for unique practice requirements beyond the system-defined roles. Supports creating roles from scratch, cloning existing roles, and importing role configurations for multi-practice groups.

---

## Core Requirements

- [ ] Create custom roles from scratch
- [ ] Clone existing roles as starting point
- [ ] Set role hierarchy level appropriately
- [ ] Configure role-specific settings
- [ ] Role versioning and change history
- [ ] Export/import roles for practice groups
- [ ] Validate role configuration before activation

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/roles` | `roles:create` | Create custom role |
| POST | `/api/roles/:id/clone` | `roles:create` | Clone existing role |
| GET | `/api/roles/:id/history` | `roles:read` | Get role change history |
| POST | `/api/roles/export` | `roles:manage` | Export role config |
| POST | `/api/roles/import` | `roles:manage` | Import role config |
| POST | `/api/roles/:id/validate` | `roles:read` | Validate role config |

---

## Data Model

Uses `Role` model with custom role fields:

```prisma
model Role {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String?  @db.ObjectId  // Non-null for custom roles

  name          String
  code          String
  description   String?
  isSystemRole  Boolean  @default(false)  // false for custom

  level         Int      @default(0)
  parentRoleId  String?  @db.ObjectId
  templateId    String?  @db.ObjectId  // If created from template

  @@unique([clinicId, code])
}

model RoleHistory {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  roleId        String   @db.ObjectId

  changeType    RoleChangeType
  fieldChanged  String?
  previousValue String?
  newValue      String?
  reason        String?

  changedAt     DateTime @default(now())
  changedBy     String   @db.ObjectId

  @@index([roleId])
}

enum RoleChangeType {
  CREATED
  UPDATED
  PERMISSION_ADDED
  PERMISSION_REMOVED
  ACTIVATED
  DEACTIVATED
}
```

---

## Business Rules

- Custom roles have clinicId set (not system-wide)
- Custom role code must be unique within clinic
- Role level determines who can assign it (lower = higher privilege)
- Cloning copies permissions but creates new identity
- Cannot set custom role level lower than user's highest role
- Role export excludes sensitive clinic-specific data
- Role changes tracked in history for audit

### Custom Role Examples

| Custom Role | Base | Modifications |
|-------------|------|---------------|
| Senior Assistant | Clinical Staff | +appointment:modify, +inventory:order |
| Float Staff | Clinical Staff | Multi-location access |
| Insurance Specialist | Billing | +patient:view_limited |
| Lead TC | Treatment Coordinator | +staff:view, +reports:conversion |

---

## Dependencies

**Depends On:**
- Role Management
- Permission Assignment

**Required By:**
- Specialized access control needs
- Multi-practice standardization

---

## Notes

- Consider: role approval workflow for sensitive custom roles
- Custom roles should not exceed creator's privilege level
- Export format should be version-aware for compatibility
- Imported roles may need permission mapping if systems differ
