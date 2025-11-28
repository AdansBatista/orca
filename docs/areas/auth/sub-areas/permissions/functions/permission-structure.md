# Permission Structure

> **Sub-Area**: [Permissions](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Defines the standardized permission code format `{area}:{action}` used throughout Orca. All permission codes follow this pattern for consistency and predictability. Provides utilities for parsing and validating permission codes.

---

## Core Requirements

- [ ] Define permission code format: `{area}:{action}`
- [ ] Validate permission code format on creation
- [ ] Provide parsePermission(code) utility
- [ ] Provide buildPermission(area, action) utility
- [ ] Maintain list of valid areas and actions
- [ ] Support wildcard permissions for admin roles

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/permissions` | `settings:manage_roles` | List all permissions |

---

## Data Model

```prisma
model Permission {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  code        String   @unique  // "patient:view_phi"
  name        String   // "View Patient PHI"
  description String?
  group       String   // "patient"
  isSystem    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([code])
  @@index([group])
}
```

---

## Business Rules

### Code Format

```typescript
// Pattern: {area}:{action}
const PERMISSION_PATTERN = /^[a-z_]+:[a-z_]+$/;

// Examples
"patient:read"      // Read patient records
"patient:create"    // Create patients
"treatment:update"  // Update treatments
"billing:delete"    // Delete billing records
"audit:view_logs"   // View audit logs
```

### Valid Areas

```typescript
const PERMISSION_AREAS = [
  'patient',
  'appointment',
  'treatment',
  'imaging',
  'lab',
  'billing',
  'financial',
  'reports',
  'settings',
  'audit',
  'multi_clinic',
] as const;
```

### Valid Actions

```typescript
const PERMISSION_ACTIONS = [
  'create',
  'read',
  'update',
  'delete',
  'export',
  'view_phi',
  'edit_phi',
  'manage_users',
  'manage_roles',
  'view_logs',
  'switch',
  'view_all',
] as const;
```

### Utilities

```typescript
function parsePermission(code: string): { area: string; action: string } {
  const [area, action] = code.split(':');
  return { area, action };
}

function buildPermission(area: string, action: string): string {
  return `${area}:${action}`;
}

function isValidPermission(code: string): boolean {
  return PERMISSION_PATTERN.test(code);
}
```

---

## Dependencies

**Depends On:**
- Database seed script

**Required By:**
- Permission Groups
- Permission Matrix
- withAuth wrapper

---

## Notes

- Permissions seeded in database initialization
- TypeScript types generated from permission codes
- Consider: permission inheritance (patient:* for all patient actions)
