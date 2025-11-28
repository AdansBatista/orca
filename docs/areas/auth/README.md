# Auth & Authorization

> **Area Overview**: System-level authentication, authorization infrastructure, and security policies for the Orca practice management system.

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Phase** | 1 - Foundation |
| **Dependencies** | None (this is the foundation) |
| **Last Updated** | 2024-11-27 |

---

## Before Implementing This Area

> **For LLMs**: Complete this checklist before writing any code for this area.

- [ ] Read [AUTH-PATTERNS.md](../../guides/AUTH-PATTERNS.md) for code patterns
- [ ] Read [TECH-STACK.md](../../guides/TECH-STACK.md) for coding standards
- [ ] Check [QUICK-REFERENCE.md](../../QUICK-REFERENCE.md) for common patterns
- [ ] Review **Data Models** section below for Prisma schema
- [ ] Review **API Endpoints** section for route structure

---

## Goals

What this area aims to achieve:

1. **Secure Authentication**: Implement secure login, session management, and token handling
2. **Role-Based Access Control**: Define and enforce the 7 user roles with proper permission hierarchy
3. **Multi-Clinic Data Isolation**: Ensure data boundaries are never crossed between clinics
4. **Regulatory Compliance**: Meet HIPAA and PIPEDA requirements for access control and audit logging

---

## Sub-Areas

| # | Sub-Area | Status | Functions | Priority |
|---|----------|--------|-----------|----------|
| 1 | [Authentication](./sub-areas/authentication/) | 📋 Planned | 6 | Critical |
| 2 | [Role System](./sub-areas/role-system/) | 📋 Planned | 4 | Critical |
| 3 | [Permissions](./sub-areas/permissions/) | 📋 Planned | 5 | Critical |
| 4 | [Data Isolation](./sub-areas/data-isolation/) | 📋 Planned | 4 | Critical |
| 5 | [Audit & Compliance](./sub-areas/audit-compliance/) | 📋 Planned | 5 | High |

---

## Sub-Area Details

### 1. Authentication
*Login, sessions, tokens, and password management*

**Key Functions:**
- User Login Flow (NextAuth.js + CredentialsProvider)
- Session Management (JWT in HTTP-only cookies)
- Password Policy Enforcement
- Session Duration & Timeout Rules
- Token Refresh & Validation
- MFA Implementation (Future)

**Documentation:** [sub-areas/authentication/](./sub-areas/authentication/)

---

### 2. Role System
*Definition and hierarchy of the 7 user roles*

**Key Functions:**
- Role Definitions & Hierarchy
- Role Scope (Global, Multi-Clinic, Clinic)
- Role Inheritance Rules
- Default Role Behaviors

**Roles:**
- `super_admin` - Full system access, all clinics
- `clinic_admin` - Full access within assigned clinics
- `doctor` - Clinical access with treatment authority
- `clinical_staff` - Patient care support
- `front_desk` - Scheduling and communications
- `billing` - Financial operations
- `read_only` - View-only access

**Documentation:** [sub-areas/role-system/](./sub-areas/role-system/)

**Cross-Reference:** See [Staff Management > Roles & Permissions](../staff-management/sub-areas/roles-permissions/) for role assignment workflows.

---

### 3. Permissions
*Permission codes, groups, and role-to-permission mapping*

**Key Functions:**
- Permission Code Format (`{area}:{action}`)
- Permission Groups (patients, appointments, clinical, financial, etc.)
- Role-to-Permission Matrix
- Permission Inheritance Rules
- Custom Permission Assignment

**Permission Levels:**
- `none` - No access
- `view` - Read only
- `edit` - Create, read, update
- `full` - Create, read, update, delete, export

**Documentation:** [sub-areas/permissions/](./sub-areas/permissions/)

---

### 4. Data Isolation
*Multi-clinic security and data boundary enforcement*

**Key Functions:**
- Clinic ID Enforcement (CRITICAL)
- Query Patterns for Single/Multi Clinic
- Clinic Switching Logic
- Row-Level Security Middleware

**Critical Rule:**
```typescript
// EVERY database query MUST include clinicId
const patients = await db.patient.findMany({
  where: { clinicId: session.user.clinicId }, // REQUIRED
});
```

**Documentation:** [sub-areas/data-isolation/](./sub-areas/data-isolation/)

---

### 5. Audit & Compliance
*Security logging, PHI access tracking, and regulatory compliance*

**Key Functions:**
- Audit Event Logging
- PHI Access Tracking
- Security Checklist Enforcement
- HIPAA/PIPEDA Compliance
- Data Retention Rules

**Events to Log:**
- Authentication events (login, logout, failed attempts)
- Patient data access (view PHI, create, update, delete, export)
- Financial operations (invoices, payments, refunds)
- Administrative changes (user, role, settings changes)
- Security events (API errors, anomalies)

**Documentation:** [sub-areas/audit-compliance/](./sub-areas/audit-compliance/)

---

## User Roles & Permissions

| Role | Scope | System Access | Notes |
|------|-------|---------------|-------|
| Super Admin | All clinics | Full | System administration |
| Clinic Admin | Assigned clinics | Full | Practice management |
| Doctor | Assigned clinics | Clinical | Treatment decisions |
| Clinical Staff | Assigned clinics | Limited clinical | Chairside assistance |
| Front Desk | Assigned clinics | Scheduling | Reception duties |
| Billing | Assigned clinics | Financial | Claims & payments |
| Read Only | Assigned clinics | View only | Reporting access |

See [AUTH-PATTERNS.md](../../guides/AUTH-PATTERNS.md) for implementation patterns.

---

## Data Models

### Core Auth Entities

```
┌─────────────────┐       ┌─────────────────┐
│      User       │       │      Role       │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ email           │──┐    │ name            │
│ passwordHash    │  │    │ code            │
│ clinicId        │  │    │ isSystem        │
│ clinicIds[]     │  │    │ permissions[]   │
│ isActive        │  │    └────────┬────────┘
└─────────────────┘  │             │
                     │    ┌────────┴────────┐
                     │    │ RoleAssignment  │
                     └───►├─────────────────┤
                          │ userId          │
                          │ roleId          │
                          │ clinicId        │
                          │ assignedBy      │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│   Permission    │       │    AuditLog     │
├─────────────────┤       ├─────────────────┤
│ id              │       │ id              │
│ code            │       │ userId          │
│ name            │       │ action          │
│ description     │       │ entity          │
│ group           │       │ entityId        │
└─────────────────┘       │ clinicId        │
                          │ details         │
                          │ timestamp       │
                          └─────────────────┘
```

### Prisma Schema

```prisma
model User {
  id           String   @id @default(auto()) @map("_id") @db.ObjectId
  email        String   @unique
  passwordHash String
  name         String
  isActive     Boolean  @default(true)

  // Multi-clinic support
  clinicId     String   @db.ObjectId  // Primary/current clinic
  clinicIds    String[] @db.ObjectId  // All assigned clinics

  // Auth metadata
  lastLoginAt    DateTime?
  failedAttempts Int       @default(0)
  lockedUntil    DateTime?
  passwordChangedAt DateTime?

  // Audit fields
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  deletedAt    DateTime?

  // Relations
  clinic       Clinic   @relation(fields: [clinicId], references: [id])
  roleAssignments RoleAssignment[]
  auditLogs    AuditLog[]

  @@index([email])
  @@index([clinicId])
}

model Role {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  name        String   // Display name
  code        String   @unique // super_admin, clinic_admin, etc.
  description String?
  isSystem    Boolean  @default(false) // System roles cannot be deleted

  // Permissions assigned to this role
  permissions String[] // Array of permission codes

  // Audit fields
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  assignments RoleAssignment[]

  @@index([code])
}

model RoleAssignment {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  userId     String   @db.ObjectId
  roleId     String   @db.ObjectId
  clinicId   String   @db.ObjectId  // Role applies to this clinic

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

model AuditLog {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  timestamp DateTime @default(now())

  // Who
  userId    String   @db.ObjectId
  userName  String
  userRole  String
  userIp    String?

  // What
  action    String   // CREATE, READ, UPDATE, DELETE, LOGIN, etc.
  entity    String   // Patient, Appointment, Invoice, etc.
  entityId  String?  @db.ObjectId

  // Where
  clinicId  String   @db.ObjectId

  // Details
  details   Json?    // Action-specific details
  before    Json?    // State before change
  after     Json?    // State after change

  // Relations
  user      User     @relation(fields: [userId], references: [id])
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([userId])
  @@index([clinicId])
  @@index([entity, entityId])
  @@index([timestamp])
  @@index([action])
}
```

---

## API Endpoints

### Authentication Endpoints

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/logout` | User logout | Yes |
| GET | `/api/auth/session` | Get current session | Yes |
| POST | `/api/auth/refresh` | Refresh session | Yes |
| POST | `/api/auth/password/reset-request` | Request password reset | No |
| POST | `/api/auth/password/reset` | Complete password reset | No |
| POST | `/api/auth/password/change` | Change password (logged in) | Yes |

### User & Role Endpoints

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/api/users` | List users | `settings:manage_users` |
| GET | `/api/users/[id]` | Get user details | `settings:manage_users` |
| POST | `/api/users` | Create user | `settings:manage_users` |
| PATCH | `/api/users/[id]` | Update user | `settings:manage_users` |
| DELETE | `/api/users/[id]` | Deactivate user | `settings:manage_users` |
| GET | `/api/roles` | List roles | `settings:manage_roles` |
| POST | `/api/users/[id]/roles` | Assign role | `settings:manage_roles` |
| DELETE | `/api/users/[id]/roles/[roleId]` | Remove role | `settings:manage_roles` |

### Audit Endpoints

| Method | Path | Description | Permission |
|--------|------|-------------|------------|
| GET | `/api/audit-logs` | List audit logs | `audit:view_logs` |
| GET | `/api/audit-logs/[id]` | Get audit log detail | `audit:view_logs` |
| GET | `/api/audit-logs/user/[userId]` | User activity | `audit:view_logs` |
| GET | `/api/audit-logs/entity/[entity]/[id]` | Entity history | `audit:view_logs` |

---

## Business Rules

### Authentication Rules

1. **Password Requirements**
   - Minimum 12 characters
   - At least 1 uppercase, 1 lowercase, 1 number, 1 special character
   - Cannot reuse last 5 passwords
   - Maximum age: 90 days

2. **Session Rules**
   - Standard session: 8 hours
   - Remember me: 30 days
   - Idle timeout: 30 minutes
   - Absolute timeout: 12 hours

3. **Failed Login Handling**
   - Track failed attempts per user
   - Lock account after 5 failed attempts
   - Lock duration: 15 minutes
   - Alert admin after repeated lockouts

### Authorization Rules

1. **Role Assignment**
   - Users must have at least one role
   - Roles are clinic-scoped (except super_admin)
   - Only admins can assign roles equal or lower than their own
   - System roles cannot be deleted

2. **Permission Checking**
   - Check authentication first
   - Then check role
   - Then check permissions
   - Always check clinic access

3. **Data Isolation**
   - Every query MUST include clinicId
   - Users can only see their assigned clinics
   - Super admin can access all clinics
   - Clinic admin can access multiple assigned clinics

### Audit Rules

1. **Events to Log**
   - All authentication events
   - All PHI access (view, export, print)
   - All data modifications
   - All role/permission changes
   - All security events

2. **Log Retention**
   - Minimum 7 years (HIPAA requirement)
   - Never delete audit logs
   - Archive to cold storage after 1 year

---

## Integration Points

### Internal Integrations

| Area | Integration Type | Description |
|------|------------------|-------------|
| [Staff Management](../staff-management/) | Data dependency | Role assignment workflows |
| All Areas | Service | withAuth wrapper for API protection |
| All Areas | Component | PermissionGate for UI protection |

### External Integrations

| System | Integration Type | Description |
|--------|------------------|-------------|
| NextAuth.js | Library | Authentication framework |
| MongoDB | Database | User and session storage |

---

## AI Integration

This area has minimal AI integration needs:

- [ ] Anomaly detection in login patterns
- [ ] Risk scoring for authentication attempts

---

## Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Authentication Success Rate | > 99.9% | Login success / attempts |
| Session Security | 0 breaches | Security audit |
| Audit Log Coverage | 100% | Events logged / events required |
| HIPAA Compliance | 100% | Compliance audit |

---

## Related Documentation

- [AUTH-PATTERNS.md](../../guides/AUTH-PATTERNS.md) - Code implementation patterns
- [MASTER-INDEX.md](../../MASTER-INDEX.md) - Project overview
- [CURRENT-FOCUS.md](../../CURRENT-FOCUS.md) - Development priorities
- [TECH-STACK.md](../../guides/TECH-STACK.md) - Coding standards
- [Staff Management](../staff-management/) - Role management workflows

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- 👀 Review - Under review
- 🧪 Testing - In testing
- ✅ Completed - Fully implemented
- 🚫 Blocked - Blocked by dependency
