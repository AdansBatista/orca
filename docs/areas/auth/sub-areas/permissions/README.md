# Permissions

> **Sub-Area**: [Auth & Authorization](../../) | **Status**: 📋 Planned

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Parent Area** | [Auth & Authorization](../../) |
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Functions** | 5 |

---

## Overview

This sub-area defines the permission system for Orca, including permission codes, groups, and the complete role-to-permission matrix. Permissions provide fine-grained access control beyond what roles alone provide.

### Key Capabilities

- **Permission Codes**: Standardized `{area}:{action}` format
- **Permission Groups**: Logical grouping by functional area
- **Permission Levels**: None, View, Edit, Full
- **Role Matrix**: Complete mapping of roles to permissions
- **Custom Assignment**: Override defaults per user

---

## Functions

| # | Function | Description | Priority |
|---|----------|-------------|----------|
| 1 | [Permission Structure](./functions/) | Code format and naming | Critical |
| 2 | [Permission Groups](./functions/) | Logical categorization | Critical |
| 3 | [Permission Matrix](./functions/) | Role-to-permission mapping | Critical |
| 4 | [Permission Levels](./functions/) | None/View/Edit/Full | High |
| 5 | [Custom Assignment](./functions/) | Per-user overrides | Medium |

---

## Permission Structure

### Code Format

```
{area}:{action}

Examples:
- patient:read
- patient:create
- appointment:update
- treatment:delete
- billing:view_financial
```

### Permission Levels

| Level | Actions | Description |
|-------|---------|-------------|
| `none` | [] | No access |
| `view` | ['read'] | Read-only access |
| `edit` | ['create', 'read', 'update'] | Create and modify |
| `full` | ['create', 'read', 'update', 'delete', 'export'] | Complete access |

```typescript
// Permission level definitions
const PERMISSION_LEVELS = {
  none: [],
  view: ['read'],
  edit: ['create', 'read', 'update'],
  full: ['create', 'read', 'update', 'delete', 'export'],
} as const;
```

---

## Permission Groups

### Patient Data Permissions

| Code | Description |
|------|-------------|
| `patient:view_phi` | View protected health information |
| `patient:edit_phi` | Edit protected health information |
| `patient:export` | Export patient data |
| `patient:delete` | Delete patient records (soft delete) |
| `patient:merge` | Merge duplicate patients |

### Appointment Permissions

| Code | Description |
|------|-------------|
| `appointment:read` | View appointments |
| `appointment:create` | Create appointments |
| `appointment:update` | Modify appointments |
| `appointment:delete` | Cancel/delete appointments |

### Clinical Permissions

| Code | Description |
|------|-------------|
| `treatment:read` | View treatment plans |
| `treatment:create` | Create treatment plans |
| `treatment:update` | Modify treatment plans |
| `treatment:delete` | Delete treatment plans |
| `imaging:read` | View images |
| `imaging:create` | Upload images |
| `imaging:delete` | Delete images |
| `lab:read` | View lab orders |
| `lab:create` | Create lab orders |
| `lab:update` | Modify lab orders |

### Financial Permissions

| Code | Description |
|------|-------------|
| `financial:view_rates` | View fee schedules |
| `financial:edit_rates` | Edit fee schedules |
| `financial:process_refunds` | Process refunds |
| `financial:write_off` | Write off balances |
| `financial:override_price` | Override procedure prices |
| `billing:read` | View billing records |
| `billing:create` | Create invoices/claims |
| `billing:update` | Modify billing |
| `billing:delete` | Delete/void billing |

### Report Permissions

| Code | Description |
|------|-------------|
| `reports:view_financial` | View financial reports |
| `reports:view_clinical` | View clinical reports |
| `reports:export` | Export reports |
| `reports:schedule` | Schedule automated reports |

### Administrative Permissions

| Code | Description |
|------|-------------|
| `audit:view_logs` | View audit logs |
| `settings:manage_users` | Create/edit users |
| `settings:manage_roles` | Create/edit roles |
| `settings:manage_clinic` | Manage clinic settings |

### Multi-Clinic Permissions

| Code | Description |
|------|-------------|
| `multi_clinic:switch` | Switch between clinics |
| `multi_clinic:view_all` | View data across all clinics |
| `multi_clinic:report_all` | Run cross-clinic reports |

---

## Role-to-Permission Matrix

### Area Permissions by Role

| Area | Super Admin | Clinic Admin | Doctor | Clinical Staff | Front Desk | Billing | Read Only |
|------|-------------|--------------|--------|----------------|------------|---------|-----------|
| **Booking** | full | full | full | edit | full | view | view |
| **Treatment** | full | full | full | edit | view | view | view |
| **Imaging** | full | full | full | edit | view | none | view |
| **Lab Work** | full | full | full | edit | view | view | view |
| **Patient Comms** | full | full | edit | edit | full | view | view |
| **CRM/Onboarding** | full | full | view | view | full | view | view |
| **Staff Mgmt** | full | full | view | none | none | none | none |
| **Resources** | full | full | view | view | view | none | view |
| **Financial** | full | full | view | none | none | full | view |
| **Billing** | full | full | view | none | view | full | view |
| **Compliance** | full | full | view | view | view | view | view |
| **Vendors** | full | full | view | view | none | edit | view |
| **Practice Orch** | full | full | full | edit | full | view | view |
| **Settings** | full | edit | none | none | none | none | none |

### Default Special Permissions by Role

```typescript
export const DEFAULT_ROLE_PERMISSIONS: Record<RoleCode, string[]> = {
  super_admin: [
    // All permissions
    ...Object.values(ALL_PERMISSIONS),
  ],

  clinic_admin: [
    'patient:view_phi',
    'patient:edit_phi',
    'patient:export',
    'patient:merge',
    'financial:view_rates',
    'financial:edit_rates',
    'financial:process_refunds',
    'reports:view_financial',
    'reports:view_clinical',
    'reports:export',
    'audit:view_logs',
    'settings:manage_users',
    'settings:manage_clinic',
    'multi_clinic:switch',
  ],

  doctor: [
    'patient:view_phi',
    'patient:edit_phi',
    'treatment:read',
    'treatment:create',
    'treatment:update',
    'imaging:read',
    'imaging:create',
    'lab:read',
    'lab:create',
    'reports:view_clinical',
    'multi_clinic:switch',
  ],

  clinical_staff: [
    'patient:view_phi',
    'patient:edit_phi',
    'treatment:read',
    'imaging:read',
    'imaging:create',
    'lab:read',
  ],

  front_desk: [
    'patient:view_phi',
    'appointment:read',
    'appointment:create',
    'appointment:update',
    'appointment:delete',
  ],

  billing: [
    'patient:view_phi',
    'financial:view_rates',
    'financial:process_refunds',
    'billing:read',
    'billing:create',
    'billing:update',
    'reports:view_financial',
    'reports:export',
  ],

  read_only: [],
};
```

---

## Data Model

### Prisma Schema

```prisma
model Permission {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  code        String   @unique // patient:view_phi
  name        String   // "View Patient PHI"
  description String?
  group       String   // patient, financial, clinical, etc.
  isSystem    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([code])
  @@index([group])
}

// Custom permission overrides per user
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

  @@unique([userId, clinicId, permission])
  @@index([userId])
  @@index([clinicId])
}
```

### TypeScript Types

```typescript
// types/permissions.ts
export interface Permission {
  code: string;
  name: string;
  description?: string;
  group: string;
}

export type PermissionLevel = 'none' | 'view' | 'edit' | 'full';

export interface PermissionOverride {
  userId: string;
  clinicId: string;
  permission: string;
  granted: boolean;
  expiresAt?: Date;
}
```

---

## API Endpoints

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/api/permissions` | List all permissions | `settings:manage_roles` |
| GET | `/api/permissions/groups` | List permission groups | `settings:manage_roles` |
| GET | `/api/users/[id]/permissions` | Get user's effective permissions | `settings:manage_users` |
| POST | `/api/users/[id]/permissions` | Grant/revoke permission | `settings:manage_roles` |

---

## Business Rules

### Permission Resolution

When checking if a user has a permission:

```typescript
function hasPermission(
  user: User,
  permission: string,
  clinicId: string
): boolean {
  // 1. Check custom overrides first
  const override = getOverride(user.id, clinicId, permission);
  if (override !== null) {
    return override.granted;
  }

  // 2. Fall back to role-based permissions
  const rolePermissions = getRolePermissions(user.roleId);
  return rolePermissions.includes(permission);
}
```

### Override Rules

1. Overrides take precedence over role permissions
2. Overrides can grant OR revoke permissions
3. Overrides are clinic-scoped
4. Overrides can have expiration dates
5. Only admins can create overrides

### Permission Inheritance

- Permissions do NOT inherit up or down the role hierarchy
- Each role has its own explicit permission set
- Higher roles simply have more permissions assigned

---

## Code Patterns

### Checking Permissions (Server)

```typescript
// Using withAuth wrapper
export const DELETE = withAuth(
  async (req, session) => {
    // Handler code
  },
  { permissions: ['patient:delete'] }
);

// Manual check
if (!session.user.permissions.includes('patient:delete')) {
  return NextResponse.json(
    { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
    { status: 403 }
  );
}
```

### Checking Permissions (Client)

```tsx
// Using PermissionGate component
<PermissionGate permissions={['patient:delete']}>
  <DeleteButton />
</PermissionGate>

// Using usePermissions hook
const { hasPermission } = usePermissions();
if (hasPermission('patient:delete')) {
  // Show delete option
}
```

---

## Dependencies

### Internal
- [Role System](../role-system/) - Roles define default permissions
- [Authentication](../authentication/) - Session contains permissions

### External
- None

---

## Related Documentation

- [Parent: Auth & Authorization](../../)
- [Role System](../role-system/) - Role definitions
- [AUTH-PATTERNS.md](../../../../guides/AUTH-PATTERNS.md) - Code patterns

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented
