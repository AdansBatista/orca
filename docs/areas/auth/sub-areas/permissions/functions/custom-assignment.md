# Custom Assignment

> **Sub-Area**: [Permissions](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Allows administrators to grant or revoke specific permissions for individual users, overriding their role defaults. Useful for temporary access, special cases, or when a user needs slightly different permissions than their role provides.

---

## Core Requirements

- [ ] Grant individual permission to user
- [ ] Revoke individual permission from user
- [ ] Support optional expiration date
- [ ] Track who granted/revoked and why
- [ ] Check overrides before role permissions
- [ ] List all overrides for a user
- [ ] Audit log all override changes

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/users/[id]/permissions` | `settings:manage_users` | List user's effective permissions |
| GET | `/api/users/[id]/permission-overrides` | `settings:manage_roles` | List user's permission overrides |
| POST | `/api/users/[id]/permissions` | `settings:manage_roles` | Grant/revoke permission |
| DELETE | `/api/users/[id]/permissions/[code]` | `settings:manage_roles` | Remove override |

### Grant/Revoke Request

```typescript
// POST /api/users/[id]/permissions
{
  permission: string;     // Permission code
  granted: boolean;       // true = grant, false = revoke
  reason?: string;        // Why this override
  expiresAt?: string;     // Optional expiration (ISO date)
}
```

---

## Data Model

```prisma
model UserPermissionOverride {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  userId       String   @db.ObjectId
  clinicId     String   @db.ObjectId
  permission   String   // Permission code
  granted      Boolean  // true = grant, false = revoke

  // Metadata
  grantedBy    String   @db.ObjectId
  grantedAt    DateTime @default(now())
  expiresAt    DateTime?
  reason       String?

  user         User     @relation(fields: [userId], references: [id])

  @@unique([userId, clinicId, permission])
  @@index([userId])
  @@index([clinicId])
  @@index([expiresAt])
}
```

---

## Business Rules

### Permission Resolution Order

```typescript
function hasPermission(user: User, permission: string, clinicId: string): boolean {
  // 1. Check for user-specific override
  const override = getOverride(user.id, clinicId, permission);
  if (override !== null) {
    // Check expiration
    if (override.expiresAt && override.expiresAt < new Date()) {
      // Expired override - delete and fall through
      deleteOverride(override.id);
    } else {
      return override.granted;
    }
  }

  // 2. Fall back to role-based permissions
  return user.permissions.includes(permission);
}
```

### Override Rules

- Overrides are clinic-scoped
- Only admins can create overrides
- Cannot override to higher than admin's own permissions
- Expired overrides automatically cleaned up
- All override changes logged for audit
- Reason required for grants (documentation)

### Use Cases

| Scenario | Override Type |
|----------|---------------|
| Temp access for project | Grant with expiration |
| Remove sensitive access | Revoke |
| Cover for absent staff | Grant with expiration |
| Special reporting need | Grant reports:export |

---

## Dependencies

**Depends On:**
- Permission Matrix
- User model

**Required By:**
- Permission checking (hasPermission)
- User management UI

---

## Notes

- Overrides add complexity - use sparingly
- Consider: require approval for sensitive permissions
- Consider: notification when override expires
