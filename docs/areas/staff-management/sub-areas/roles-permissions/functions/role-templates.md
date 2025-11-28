# Role Templates

> **Sub-Area**: [Roles & Permissions](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Provide pre-configured role templates for common orthodontic practice positions. Enables quick role setup for new clinics, ensures consistent access patterns, and provides industry-standard role configurations based on best practices.

---

## Core Requirements

- [ ] Access pre-built role templates
- [ ] Apply templates to create new roles
- [ ] Customize templates for practice needs
- [ ] Support template versioning
- [ ] Industry-standard compliance templates
- [ ] Custom template creation and sharing
- [ ] Template preview before application

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/role-templates` | `roles:read` | List templates |
| GET | `/api/role-templates/:id` | `roles:read` | Get template |
| POST | `/api/role-templates` | `roles:create` | Create template |
| POST | `/api/role-templates/:id/apply` | `roles:create` | Create role from template |
| GET | `/api/role-templates/:id/preview` | `roles:read` | Preview template |
| PUT | `/api/role-templates/:id` | `roles:update` | Update template |

---

## Data Model

```prisma
model RoleTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId

  name          String
  code          String   @unique
  description   String?
  category      RoleTemplateCategory

  defaultLevel  Int
  permissions   String[]  // Default permissions
  defaultSettings RoleSettings?

  isActive      Boolean  @default(true)
  isCustom      Boolean  @default(false)
  organizationId String?  @db.ObjectId  // For custom templates

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
}

enum RoleTemplateCategory {
  PROVIDER
  CLINICAL
  ADMINISTRATIVE
  FINANCIAL
  MANAGEMENT
  CUSTOM
}
```

---

## Business Rules

- System templates are read-only and maintained by platform
- Custom templates scoped to organization/practice group
- Template application creates a new role, doesn't modify existing
- Template permissions can be modified after role creation
- Template updates don't affect previously created roles
- Templates should cover common orthodontic practice positions

### Available Templates

| Template | Category | Target Position |
|----------|----------|-----------------|
| Orthodontist | Provider | Board-certified orthodontist |
| Associate Provider | Provider | Associate doctors |
| Clinical Lead | Clinical | Senior clinical staff |
| Orthodontic Assistant | Clinical | DA, RDA |
| EFDA | Clinical | Expanded function assistant |
| Treatment Coordinator | Administrative | TC, NPC |
| Front Office Lead | Administrative | Office lead |
| Front Desk | Administrative | Receptionist |
| Insurance Coordinator | Financial | Insurance specialist |
| Office Manager | Management | Practice manager |

### Template Permissions Example (Treatment Coordinator)

```javascript
{
  category: "ADMINISTRATIVE",
  permissions: [
    "patient:read",
    "patient:create",
    "patient:update",
    "patient:view_financial",
    "treatment:read",
    "appointment:read",
    "appointment:create",
    "appointment:cancel",
    "reports:conversion",
    "contract:create"
  ]
}
```

---

## Dependencies

**Depends On:**
- Permission Registry
- Role Management

**Required By:**
- Quick clinic setup
- Consistent role standardization
- Custom Roles (as starting point)

---

## Notes

- Consider: template recommendations based on practice size
- Templates should follow HIPAA minimum necessary principle
- Template updates may prompt review of existing roles
- Custom templates useful for practice groups with standardization needs
