# Roles & Permissions

> **Area**: [Staff Management](../../)
>
> **Sub-Area**: 2.3 Roles & Permissions
>
> **Purpose**: Define and manage role-based access control with custom roles and multi-location permissions

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | Large |
| **Parent Area** | [Staff Management](../../) |
| **Dependencies** | Authentication |
| **Last Updated** | 2024-11-27 |

---

## Overview

Roles & Permissions provides comprehensive access control for the orthodontic practice management system. This includes pre-defined roles tailored for orthodontic workflows, custom role creation, granular permission assignment, and multi-location access management. The system ensures HIPAA compliance through audit logging of all access and permission changes.

Orthodontic practices have unique role requirements including clinical staff with varying levels of autonomy, treatment coordinators with access to financial discussions, and multi-location providers who need appropriate access across all their working locations.

### Key Capabilities

- Pre-defined orthodontic practice roles
- Custom role creation with granular permissions
- Role hierarchy with inheritance
- Location-specific role assignments
- Permission grouping by functional area
- Complete audit trail of permission changes
- Role templates for quick setup
- Permission conflict detection
- HIPAA-compliant access logging

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 2.3.1 | [Role Management](./functions/role-management.md) | Create and manage roles | 📋 Planned | Critical |
| 2.3.2 | [Permission Assignment](./functions/permission-assignment.md) | Assign permissions to roles | 📋 Planned | Critical |
| 2.3.3 | [Custom Roles](./functions/custom-roles.md) | Create organization-specific roles | 📋 Planned | High |
| 2.3.4 | [Multi-Location Access](./functions/multi-location-access.md) | Manage cross-location permissions | 📋 Planned | High |
| 2.3.5 | [Role Templates](./functions/role-templates.md) | Pre-configured role templates | 📋 Planned | Medium |
| 2.3.6 | [Access Audit](./functions/access-audit.md) | Track permission changes and access | 📋 Planned | Critical |

---

## Function Details

### 2.3.1 Role Management

**Purpose**: Create, modify, and manage roles that define user access levels.

**Key Capabilities**:
- View and manage all roles in the system
- Create new roles based on templates or from scratch
- Modify role permissions
- Activate/deactivate roles
- Role hierarchy management
- Role assignment to users

**System Roles (Pre-defined)**:
| Role | Level | Description | Deletable |
|------|-------|-------------|-----------|
| `super_admin` | 0 | Full system access, all clinics | No |
| `clinic_admin` | 1 | Full access within assigned clinic(s) | No |
| `doctor` | 2 | Clinical access, treatment authority | No |
| `clinical_staff` | 3 | Patient care, limited clinical | No |
| `treatment_coordinator` | 3 | New patients, financial discussions | No |
| `front_desk` | 4 | Scheduling, communications | No |
| `billing` | 4 | Financial operations | No |
| `read_only` | 5 | View-only access | No |

**User Stories**:
- As a **super admin**, I want to create custom roles for unique practice needs
- As a **clinic admin**, I want to assign roles to staff members
- As a **manager**, I want to see what permissions each role grants

---

### 2.3.2 Permission Assignment

**Purpose**: Assign granular permissions to roles for fine-tuned access control.

**Key Capabilities**:
- View all available permissions
- Assign permissions to roles
- Remove permissions from roles
- Permission grouping by category
- Bulk permission assignment
- Permission inheritance management

**Permission Categories**:
| Category | Description | Example Permissions |
|----------|-------------|---------------------|
| Patient | Patient record access | `patient:read`, `patient:create`, `patient:update` |
| Treatment | Treatment management | `treatment:read`, `treatment:create`, `treatment:approve` |
| Scheduling | Appointment access | `appointment:read`, `appointment:create`, `appointment:cancel` |
| Financial | Billing and payments | `billing:read`, `billing:create`, `payment:process` |
| Staff | Staff management | `staff:read`, `staff:create`, `staff:update` |
| Reports | Report access | `reports:clinical`, `reports:financial`, `reports:operational` |
| Admin | Administrative | `settings:manage`, `roles:manage`, `audit:view` |

**Permission Naming Convention**:
```
{resource}:{action}

Examples:
- patient:read
- patient:create
- patient:update
- patient:delete
- patient:export
- patient:view_financial
- patient:view_clinical
```

**User Stories**:
- As a **clinic admin**, I want to customize permissions for specific roles
- As a **compliance officer**, I want to ensure minimum necessary access
- As a **manager**, I want to grant specific permissions without full role change

---

### 2.3.3 Custom Roles

**Purpose**: Create organization-specific roles for unique practice requirements.

**Key Capabilities**:
- Create custom roles from scratch
- Clone existing roles as starting point
- Set role hierarchy level
- Configure role-specific settings
- Role versioning and history
- Role export/import for multi-practice groups

**Custom Role Examples**:
| Custom Role | Base Role | Modifications |
|-------------|-----------|---------------|
| Senior Assistant | Clinical Staff | +appointment:modify, +inventory:order |
| Float Staff | Clinical Staff | Multi-location access |
| Insurance Specialist | Billing | +patient:view_limited |
| Lead TC | Treatment Coordinator | +staff:view, +reports:conversion |

**User Stories**:
- As a **clinic admin**, I want to create a custom role for our senior assistants
- As a **practice group admin**, I want to create consistent roles across locations
- As a **manager**, I want to clone an existing role and modify it slightly

---

### 2.3.4 Multi-Location Access

**Purpose**: Manage staff access across multiple clinic locations.

**Key Capabilities**:
- Assign location-specific roles
- Configure cross-location visibility
- Manage floating staff access
- Provider multi-location access
- Location-restricted permissions
- Cross-location data visibility rules

**Access Patterns**:
| Pattern | Description | Use Case |
|---------|-------------|----------|
| Single Location | Access to one clinic only | Most staff |
| Multi-Location | Same role at multiple locations | Floating staff |
| Primary + Secondary | Full at primary, limited at secondary | Float coverage |
| Organization-Wide | Access to all locations | Executives, IT |
| Location-Specific Roles | Different roles per location | Varied responsibilities |

**Provider Multi-Location Scenarios**:
- Orthodontist works 3 days at Location A, 2 days at Location B
- Provider needs full clinical access at all working locations
- Provider schedule determines which location data is primary

**User Stories**:
- As a **super admin**, I want to grant a provider access to multiple locations
- As a **clinic admin**, I want to see which staff have access to my location
- As a **floating staff**, I want appropriate access when covering other locations

---

### 2.3.5 Role Templates

**Purpose**: Provide pre-configured role templates for common orthodontic practice positions.

**Key Capabilities**:
- Access pre-built role templates
- Apply templates to create new roles
- Customize templates for practice needs
- Template versioning
- Industry-standard templates
- Compliance-oriented templates

**Available Templates**:
| Template | Description | Target Position |
|----------|-------------|-----------------|
| Orthodontist | Full clinical access | Board-certified orthodontist |
| Associate Provider | Clinical access, limited admin | Associate doctors |
| Clinical Lead | Clinical + staff supervision | Senior clinical staff |
| Orthodontic Assistant | Chair-side clinical access | DA, RDA |
| EFDA | Extended function access | Expanded function assistant |
| Treatment Coordinator | Patient conversion focus | TC, New Patient Coordinator |
| Front Office Lead | Front desk + scheduling | Office lead |
| Front Desk | Basic front office | Receptionist |
| Insurance Coordinator | Billing + limited patient | Insurance specialist |
| Office Manager | Operations + staff | Practice manager |

**User Stories**:
- As a **new clinic admin**, I want to quickly set up roles from templates
- As a **practice consultant**, I want to recommend role configurations
- As a **compliance officer**, I want templates that meet HIPAA requirements

---

### 2.3.6 Access Audit

**Purpose**: Track and audit all permission changes and sensitive data access.

**Key Capabilities**:
- Log all permission changes
- Track role assignments
- Monitor sensitive data access (PHI)
- Generate compliance reports
- Alert on suspicious access patterns
- Retention policy compliance

**Audit Events**:
| Event Type | Description | Retention |
|------------|-------------|-----------|
| Role Created | New role added | 7 years |
| Role Modified | Permissions changed | 7 years |
| Role Assigned | User given role | 7 years |
| Role Removed | User role revoked | 7 years |
| Permission Changed | Direct permission change | 7 years |
| PHI Access | Patient data viewed/modified | 7 years |
| Login Event | User authentication | 2 years |
| Failed Access | Unauthorized access attempt | 7 years |

**Compliance Requirements**:
- HIPAA audit trail requirements
- State dental board requirements
- PIPEDA requirements (Canadian clinics)
- Insurance audit requirements

**User Stories**:
- As a **compliance officer**, I want to review who accessed patient records
- As a **super admin**, I want to see all permission changes
- As a **auditor**, I want to generate compliance reports

---

## Data Model

```prisma
// Roles
model Role {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String?  @db.ObjectId  // null for system roles

  // Role Details
  name          String
  code          String
  description   String?
  isSystemRole  Boolean  @default(false)
  isActive      Boolean  @default(true)

  // Hierarchy
  level         Int      @default(0)
  parentRoleId  String?  @db.ObjectId

  // Template Reference
  templateId    String?  @db.ObjectId

  // Settings
  settings      RoleSettings?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Audit
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic        Clinic?   @relation(fields: [clinicId], references: [id])
  parentRole    Role?     @relation("RoleHierarchy", fields: [parentRoleId], references: [id])
  childRoles    Role[]    @relation("RoleHierarchy")
  permissions   RolePermission[]
  assignments   RoleAssignment[]
  history       RoleHistory[]

  @@unique([clinicId, code])
  @@index([clinicId])
  @@index([code])
  @@index([isSystemRole])
  @@index([isActive])
}

type RoleSettings {
  canViewAllLocations    Boolean @default(false)
  canAccessFinancial     Boolean @default(false)
  canAccessClinical      Boolean @default(false)
  canManageStaff         Boolean @default(false)
  canModifySettings      Boolean @default(false)
  requiresMFA            Boolean @default(false)
  sessionTimeout         Int?    // Minutes, null = use default
  dataExportAllowed      Boolean @default(false)
}

// Role Permissions
model RolePermission {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  roleId        String   @db.ObjectId

  // Permission Details
  permission    String   // e.g., "patient:read"
  granted       Boolean  @default(true)

  // Conditions (optional)
  conditions    PermissionConditions?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  grantedBy String?  @db.ObjectId

  // Relations
  role          Role      @relation(fields: [roleId], references: [id])

  @@unique([roleId, permission])
  @@index([roleId])
  @@index([permission])
}

type PermissionConditions {
  ownRecordsOnly   Boolean?  // Only own patient records
  clinicIdRequired Boolean?  // Must be in assigned clinic
  timeRestriction  TimeRestriction?
}

type TimeRestriction {
  allowedDays    Int[]     // 0-6 (Sunday-Saturday)
  startTime      String?   // "HH:mm"
  endTime        String?   // "HH:mm"
}

// Role Assignments
model RoleAssignment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  userId        String   @db.ObjectId
  roleId        String   @db.ObjectId

  // Location-Specific (optional)
  clinicId      String?  @db.ObjectId  // If set, role only applies to this clinic

  // Primary Assignment
  isPrimary     Boolean  @default(false)

  // Dates
  effectiveFrom DateTime @default(now())
  effectiveUntil DateTime?

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Audit
  assignedBy    String?  @db.ObjectId
  revokedBy     String?  @db.ObjectId
  revokedAt     DateTime?

  // Relations
  user          User      @relation(fields: [userId], references: [id])
  role          Role      @relation(fields: [roleId], references: [id])
  clinic        Clinic?   @relation(fields: [clinicId], references: [id])

  @@unique([userId, roleId, clinicId])
  @@index([userId])
  @@index([roleId])
  @@index([clinicId])
  @@index([isActive])
}

// Role Templates
model RoleTemplate {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId

  // Template Details
  name          String
  code          String   @unique
  description   String?
  category      RoleTemplateCategory

  // Default Level
  defaultLevel  Int

  // Permissions
  permissions   String[] // Default permissions for this template

  // Settings
  defaultSettings RoleSettings?

  // Status
  isActive      Boolean  @default(true)
  isCustom      Boolean  @default(false)

  // Organization (for custom templates)
  organizationId String?  @db.ObjectId

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
  @@index([isActive])
}

enum RoleTemplateCategory {
  PROVIDER
  CLINICAL
  ADMINISTRATIVE
  FINANCIAL
  MANAGEMENT
  CUSTOM
}

// Role History (Audit)
model RoleHistory {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  roleId        String   @db.ObjectId

  // Change Details
  changeType    RoleChangeType
  fieldChanged  String?
  previousValue String?
  newValue      String?

  // Context
  reason        String?

  // Timestamps
  changedAt     DateTime @default(now())
  changedBy     String   @db.ObjectId

  // Relations
  role          Role      @relation(fields: [roleId], references: [id])

  @@index([roleId])
  @@index([changeType])
  @@index([changedAt])
}

enum RoleChangeType {
  CREATED
  UPDATED
  DELETED
  PERMISSION_ADDED
  PERMISSION_REMOVED
  ASSIGNED
  UNASSIGNED
  ACTIVATED
  DEACTIVATED
}

// Permission Registry
model Permission {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId

  // Permission Details
  code          String   @unique  // e.g., "patient:read"
  name          String
  description   String?
  category      PermissionCategory

  // Classification
  sensitivity   PermissionSensitivity @default(NORMAL)
  requiresAudit Boolean  @default(false)

  // Grouping
  module        String   // e.g., "patient-management"
  resource      String   // e.g., "patient"
  action        String   // e.g., "read"

  // Dependencies
  dependsOn     String[] // Other permissions required

  // Status
  isActive      Boolean  @default(true)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([category])
  @@index([module])
  @@index([resource])
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

enum PermissionSensitivity {
  LOW        // General access
  NORMAL     // Standard business operations
  HIGH       // Sensitive data (financial, HR)
  CRITICAL   // PHI, system configuration
}

// Access Audit Log
model AccessLog {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String?  @db.ObjectId

  // User
  userId        String   @db.ObjectId
  sessionId     String?

  // Access Details
  action        String   // Permission code or action
  resource      String   // Resource type
  resourceId    String?  // Specific resource ID

  // Result
  granted       Boolean
  denialReason  String?

  // Context
  ipAddress     String?
  userAgent     String?
  requestPath   String?

  // PHI Indicator
  involvesPHI   Boolean  @default(false)
  phiFields     String[]  // Which PHI fields were accessed

  // Timestamps
  accessedAt    DateTime @default(now())

  // Relations
  clinic        Clinic?   @relation(fields: [clinicId], references: [id])
  user          User      @relation(fields: [userId], references: [id])

  @@index([clinicId])
  @@index([userId])
  @@index([action])
  @@index([resource])
  @@index([accessedAt])
  @@index([involvesPHI])
}
```

---

## API Endpoints

### Roles

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/roles` | List all roles | `roles:read` |
| GET | `/api/roles/:id` | Get role details | `roles:read` |
| POST | `/api/roles` | Create role | `roles:create` |
| PUT | `/api/roles/:id` | Update role | `roles:update` |
| DELETE | `/api/roles/:id` | Delete role | `roles:delete` |
| GET | `/api/roles/:id/permissions` | Get role permissions | `roles:read` |
| PUT | `/api/roles/:id/permissions` | Update permissions | `permissions:manage` |
| GET | `/api/roles/:id/users` | Get users with role | `roles:read` |

### Role Templates

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/role-templates` | List templates | `roles:read` |
| GET | `/api/role-templates/:id` | Get template | `roles:read` |
| POST | `/api/role-templates` | Create template | `roles:create` |
| POST | `/api/role-templates/:id/apply` | Create role from template | `roles:create` |

### Permissions

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/permissions` | List all permissions | `permissions:read` |
| GET | `/api/permissions/categories` | Get by category | `permissions:read` |
| GET | `/api/permissions/user/:userId` | Get user permissions | `permissions:read` |
| POST | `/api/permissions/check` | Check permission | System |

### Role Assignments

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/users/:userId/roles` | Get user roles | `roles:read` |
| POST | `/api/users/:userId/roles` | Assign role | `roles:assign` |
| DELETE | `/api/users/:userId/roles/:assignmentId` | Remove role | `roles:assign` |
| GET | `/api/staff/:id/effective-permissions` | Get effective permissions | `roles:read` |

### Audit

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/audit/access-logs` | Get access logs | `audit:view` |
| GET | `/api/audit/role-history` | Get role changes | `audit:view` |
| GET | `/api/audit/permission-changes` | Get permission changes | `audit:view` |
| GET | `/api/audit/phi-access` | Get PHI access logs | `audit:view_phi` |
| POST | `/api/audit/reports` | Generate audit report | `audit:export` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `RoleList` | List/manage roles | `components/staff/roles/` |
| `RoleEditor` | Create/edit role | `components/staff/roles/` |
| `RoleCard` | Role summary card | `components/staff/roles/` |
| `PermissionMatrix` | Visual permission grid | `components/staff/roles/` |
| `PermissionPicker` | Select permissions | `components/staff/roles/` |
| `PermissionCategory` | Grouped permissions | `components/staff/roles/` |
| `RoleHierarchyTree` | Visual role hierarchy | `components/staff/roles/` |
| `RoleAssignmentForm` | Assign role to user | `components/staff/roles/` |
| `UserRolesList` | User's assigned roles | `components/staff/roles/` |
| `RoleTemplateList` | Available templates | `components/staff/roles/` |
| `RoleTemplatePreview` | Preview template | `components/staff/roles/` |
| `LocationAccessManager` | Multi-location access | `components/staff/roles/` |
| `EffectivePermissions` | Show computed permissions | `components/staff/roles/` |
| `AuditLogViewer` | View audit logs | `components/staff/audit/` |
| `AccessLogFilter` | Filter audit logs | `components/staff/audit/` |
| `PHIAccessReport` | PHI access summary | `components/staff/audit/` |
| `RoleHistoryTimeline` | Role change timeline | `components/staff/audit/` |
| `ComplianceReport` | Compliance dashboard | `components/staff/audit/` |

---

## Business Rules

1. **System Roles**: System roles cannot be deleted, only deactivated
2. **Super Admin**: Super admin role always has full access, cannot be restricted
3. **Role Hierarchy**: Users can only assign roles at or below their level
4. **Permission Inheritance**: Child roles inherit parent role permissions
5. **Location Scoping**: Location-specific assignments override general assignments
6. **Minimum Permissions**: All users must have basic login and profile view permissions
7. **Audit Requirements**: All permission changes must be logged
8. **PHI Access Logging**: All PHI access must be logged with field-level detail
9. **Role Conflicts**: System warns on conflicting permission assignments
10. **Active Assignment**: Users must have at least one active role assignment
11. **Revocation**: Role revocation takes effect immediately
12. **Effective Permissions**: Computed from all role assignments with highest privilege wins

---

## System Roles Permission Matrix

| Permission | Super Admin | Clinic Admin | Doctor | Clinical Staff | TC | Front Desk | Billing | Read Only |
|------------|-------------|--------------|--------|----------------|-------|------------|---------|-----------|
| patient:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| patient:create | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | - |
| patient:update | ✅ | ✅ | ✅ | ✅ | ✅ | Limited | - | - |
| patient:delete | ✅ | ✅ | - | - | - | - | - | - |
| patient:view_financial | ✅ | ✅ | - | - | ✅ | - | ✅ | - |
| treatment:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | ✅ |
| treatment:create | ✅ | ✅ | ✅ | Limited | - | - | - | - |
| treatment:approve | ✅ | ✅ | ✅ | - | - | - | - | - |
| appointment:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| appointment:create | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | - | - |
| appointment:cancel | ✅ | ✅ | ✅ | - | ✅ | ✅ | - | - |
| billing:read | ✅ | ✅ | - | - | ✅ | - | ✅ | - |
| billing:create | ✅ | ✅ | - | - | - | - | ✅ | - |
| payment:process | ✅ | ✅ | - | - | - | ✅ | ✅ | - |
| staff:read | ✅ | ✅ | Limited | Limited | - | Limited | - | - |
| staff:manage | ✅ | ✅ | - | - | - | - | - | - |
| roles:manage | ✅ | ✅ | - | - | - | - | - | - |
| settings:manage | ✅ | ✅ | - | - | - | - | - | - |
| audit:view | ✅ | ✅ | - | - | - | - | - | - |

---

## Dependencies

### Internal Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Authentication | Required | User authentication |
| User Management | Required | User accounts |

### External Dependencies

| Dependency | Type | Description |
|------------|------|-------------|
| Audit Storage | Required | Audit log storage |

---

## Related Documentation

- [Parent: Staff Management](../../)
- [Staff Profiles & HR](../staff-profiles-hr/)
- [Scheduling & Time Management](../scheduling-time-management/)
- [Performance & Training](../performance-training/)
- [AUTH-GUIDE](../../../../guides/AUTH-GUIDE.md) - Authorization patterns

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-27
**Owner**: Development Team
