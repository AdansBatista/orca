# Role System

> **Sub-Area**: [Auth & Authorization](../../) | **Status**: 📋 Planned

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Parent Area** | [Auth & Authorization](../../) |
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Functions** | 4 |

---

## Overview

This sub-area defines the 7 user roles in Orca, their hierarchy, scope, and default behaviors. Roles provide the foundation for access control and determine what areas and features users can access.

### Key Capabilities

- **Role Hierarchy**: Clear inheritance and precedence
- **Scope Definition**: Global, multi-clinic, and clinic-level access
- **Default Behaviors**: Pre-defined access patterns per role
- **System Roles**: Protected roles that cannot be deleted

---

## Functions

| # | Function | Description | Priority |
|---|----------|-------------|----------|
| 1 | [Role Definitions](./functions/) | Define the 7 system roles | Critical |
| 2 | [Role Hierarchy](./functions/) | Inheritance and precedence | Critical |
| 3 | [Scope Management](./functions/) | Global, multi-clinic, clinic scoping | Critical |
| 4 | [Default Behaviors](./functions/) | Pre-defined role access patterns | High |

---

## Role Hierarchy

```
Super Admin
    │
    ├── Clinic Admin
    │       │
    │       ├── Doctor
    │       │     │
    │       │     └── Clinical Staff
    │       │
    │       ├── Front Desk
    │       │
    │       └── Billing
    │
    └── Read Only
```

### Hierarchy Rules

1. Higher roles can manage lower roles
2. Users can only assign roles at or below their level
3. Super Admin is the only global scope role
4. Clinic Admin can manage all roles within their clinics

---

## Role Definitions

### 1. Super Admin

| Attribute | Value |
|-----------|-------|
| **Code** | `super_admin` |
| **Description** | Full system access across all clinics |
| **Typical Users** | IT Administrator, System Owner |
| **Scope** | Global (all clinics) |

**Capabilities:**
- Access all clinics without switching
- Manage clinic configurations
- Create/delete clinics
- Manage all users across all clinics
- Access system-wide audit logs
- Generate cross-clinic reports
- Configure integrations
- Manage system settings

---

### 2. Clinic Admin

| Attribute | Value |
|-----------|-------|
| **Code** | `clinic_admin` |
| **Description** | Full access within assigned clinic(s) |
| **Typical Users** | Office Manager, Practice Manager |
| **Scope** | Multi-Clinic (assigned clinics only) |

**Capabilities:**
- Full access to assigned clinic data
- Manage staff within clinic
- Configure clinic settings
- Generate clinic reports
- Manage resources and scheduling
- View clinic-level audit logs
- Cannot access other clinics
- Cannot modify system settings

---

### 3. Doctor

| Attribute | Value |
|-----------|-------|
| **Code** | `doctor` |
| **Description** | Clinical access with treatment authority |
| **Typical Users** | Orthodontist, Dentist |
| **Scope** | Clinic (assigned clinics) |

**Capabilities:**
- Full clinical access
- Create/modify treatment plans
- View/add clinical images
- Order lab work
- Sign off on procedures
- View own schedule
- Limited administrative access
- Cannot manage other staff

---

### 4. Clinical Staff

| Attribute | Value |
|-----------|-------|
| **Code** | `clinical_staff` |
| **Description** | Patient care support role |
| **Typical Users** | Dental Assistant, Hygienist, Treatment Coordinator |
| **Scope** | Clinic (assigned clinics) |

**Capabilities:**
- View patient records
- Update clinical notes
- Manage appointments
- View treatment plans (not create)
- Record procedure progress
- Cannot create treatment plans
- Cannot access financial data
- Cannot manage staff

---

### 5. Front Desk

| Attribute | Value |
|-----------|-------|
| **Code** | `front_desk` |
| **Description** | Patient-facing administrative role |
| **Typical Users** | Receptionist, Scheduler |
| **Scope** | Clinic (assigned clinics) |

**Capabilities:**
- Full scheduling access
- Patient check-in/out
- Patient communications
- Basic patient demographics
- Manage waitlist
- Cannot view clinical details
- Cannot access financial details
- Cannot manage staff

---

### 6. Billing

| Attribute | Value |
|-----------|-------|
| **Code** | `billing` |
| **Description** | Financial operations role |
| **Typical Users** | Billing Coordinator, Insurance Specialist |
| **Scope** | Clinic (assigned clinics) |

**Capabilities:**
- Full financial access
- Process insurance claims
- Manage payment plans
- Generate financial reports
- View patient demographics (for billing)
- Manage collections
- Cannot access clinical data
- Cannot manage staff

---

### 7. Read Only

| Attribute | Value |
|-----------|-------|
| **Code** | `read_only` |
| **Description** | View-only access for auditing/training |
| **Typical Users** | Auditor, Trainee, Consultant |
| **Scope** | Clinic (assigned clinics) |

**Capabilities:**
- View all accessible data
- Cannot create anything
- Cannot update anything
- Cannot delete anything
- Export limited to allowed reports
- Used for training and auditing

---

## Data Model

### Prisma Schema

```prisma
model Role {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String   // Display name: "Clinic Admin"
  code        String   @unique // System code: "clinic_admin"
  description String?
  isSystem    Boolean  @default(false) // Cannot delete system roles
  scope       RoleScope @default(CLINIC)

  // Permissions assigned to this role
  permissions String[] // Array of permission codes

  // Audit fields
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  createdBy   String?  @db.ObjectId
  updatedBy   String?  @db.ObjectId

  // Relations
  assignments RoleAssignment[]

  @@index([code])
}

enum RoleScope {
  GLOBAL      // Access all clinics (super_admin only)
  MULTI_CLINIC // Access multiple assigned clinics
  CLINIC      // Access single assigned clinic
}

model RoleAssignment {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  userId     String   @db.ObjectId
  roleId     String   @db.ObjectId
  clinicId   String   @db.ObjectId

  // Assignment metadata
  assignedBy String   @db.ObjectId
  assignedAt DateTime @default(now())
  expiresAt  DateTime? // Optional expiration

  // Relations
  user       User     @relation(fields: [userId], references: [id])
  role       Role     @relation(fields: [roleId], references: [id])
  clinic     Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([userId, roleId, clinicId])
  @@index([userId])
  @@index([clinicId])
}
```

### TypeScript Types

```typescript
// types/auth.ts
export type RoleCode =
  | 'super_admin'
  | 'clinic_admin'
  | 'doctor'
  | 'clinical_staff'
  | 'front_desk'
  | 'billing'
  | 'read_only';

export type RoleScope = 'GLOBAL' | 'MULTI_CLINIC' | 'CLINIC';

export interface Role {
  id: string;
  name: string;
  code: RoleCode;
  description?: string;
  isSystem: boolean;
  scope: RoleScope;
  permissions: string[];
}

// Role hierarchy for comparison
export const ROLE_HIERARCHY: Record<RoleCode, number> = {
  super_admin: 100,
  clinic_admin: 80,
  doctor: 60,
  clinical_staff: 40,
  front_desk: 40,
  billing: 40,
  read_only: 20,
};
```

---

## API Endpoints

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/api/roles` | List all roles | `settings:manage_roles` |
| GET | `/api/roles/[code]` | Get role by code | `settings:manage_roles` |
| PUT | `/api/roles/[code]/permissions` | Update role permissions | `settings:manage_roles` |

---

## Business Rules

### Role Assignment Rules

1. **Minimum Role**: Every user must have at least one role
2. **Clinic Scope**: Roles are scoped to clinics (except super_admin)
3. **Assignment Authority**: Users can only assign roles at or below their level
4. **System Protection**: System roles (isSystem=true) cannot be deleted
5. **Expiration**: Role assignments can have optional expiration dates

### Role Modification Rules

1. System roles (super_admin, clinic_admin, etc.) cannot be deleted
2. System role codes cannot be changed
3. System role permissions can be customized per clinic
4. Custom roles can be created at clinic level

### Role Resolution

When determining a user's effective permissions:

```typescript
function getEffectivePermissions(userId: string, clinicId: string): string[] {
  // 1. Get all role assignments for user in this clinic
  const assignments = await getRoleAssignments(userId, clinicId);

  // 2. Collect permissions from all assigned roles
  const permissions = new Set<string>();
  for (const assignment of assignments) {
    for (const permission of assignment.role.permissions) {
      permissions.add(permission);
    }
  }

  // 3. Return unique permissions
  return Array.from(permissions);
}
```

---

## Default Role Permissions

See [Permissions Sub-Area](../permissions/) for the complete permission matrix.

| Role | Area Access Summary |
|------|---------------------|
| Super Admin | Full access to everything |
| Clinic Admin | Full access within assigned clinics |
| Doctor | Full clinical, limited admin |
| Clinical Staff | Clinical read/edit, no financial |
| Front Desk | Scheduling, communications |
| Billing | Financial, patient demographics |
| Read Only | View only, no modifications |

---

## Dependencies

### Internal
- [Authentication](../authentication/) - Session provides role context
- [Permissions](../permissions/) - Role-to-permission mapping
- [Staff Management](../../staff-management/) - Role assignment workflows

### External
- None

---

## Cross-References

- **Staff Management > Roles & Permissions**: For UI workflows to assign roles to staff members
- **Permissions Sub-Area**: For the complete permission matrix

---

## Related Documentation

- [Parent: Auth & Authorization](../../)
- [Permissions](../permissions/) - Permission codes and matrix
- [Staff Management](../../staff-management/sub-areas/roles-permissions/) - Role management UI

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented
