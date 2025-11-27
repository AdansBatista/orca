# Authentication & Authorization Guide

This document defines all authentication, authorization, and data access rules for the Orca project. All features must implement these security patterns.

---

## 1. Authentication Flow

### 1.1 Login Process

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │     │   Next.js   │     │  NextAuth   │     │   MongoDB   │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │                   │
       │  1. Submit login  │                   │                   │
       │──────────────────>│                   │                   │
       │                   │                   │                   │
       │                   │  2. Validate      │                   │
       │                   │──────────────────>│                   │
       │                   │                   │                   │
       │                   │                   │  3. Query user    │
       │                   │                   │──────────────────>│
       │                   │                   │                   │
       │                   │                   │  4. User data     │
       │                   │                   │<──────────────────│
       │                   │                   │                   │
       │                   │  5. Verify pass   │                   │
       │                   │<──────────────────│                   │
       │                   │                   │                   │
       │                   │  6. Create session│                   │
       │                   │──────────────────>│                   │
       │                   │                   │                   │
       │  7. Set cookie    │                   │                   │
       │<──────────────────│                   │                   │
       │                   │                   │                   │
       │  8. Redirect      │                   │                   │
       │<──────────────────│                   │                   │
       │                   │                   │                   │
```

### 1.2 Session Management

#### Session Configuration

```typescript
// lib/auth/config.ts
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Validate credentials
        // Return user object or null
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.clinicId = user.clinicId;
        token.clinicIds = user.clinicIds;
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.clinicId = token.clinicId;
      session.user.clinicIds = token.clinicIds;
      session.user.role = token.role;
      session.user.permissions = token.permissions;
      return session;
    },
  },
};
```

#### Session Duration

| Context | Duration | Notes |
|---------|----------|-------|
| Standard session | 8 hours | Normal workday |
| Remember me | 30 days | Optional, user-selected |
| Session timeout | 30 min inactivity | Auto-logout on idle |
| Absolute timeout | 12 hours | Force re-login |

### 1.3 Token Handling

- **JWT tokens** stored in HTTP-only cookies
- **CSRF token** required for state-changing requests
- **Refresh tokens** not used (session-based)
- Token contains: userId, clinicId, role, permissions

### 1.4 MFA Implementation (Future)

```typescript
// MFA flow (when implemented)
interface MFAFlow {
  // Step 1: Primary authentication
  primaryAuth: {
    method: 'credentials';
    result: 'requires_mfa' | 'authenticated';
  };

  // Step 2: Secondary authentication
  secondaryAuth: {
    method: 'totp' | 'sms' | 'email';
    codeLength: 6;
    expiresIn: 300; // 5 minutes
  };

  // Bypass scenarios
  bypass: {
    trustedDevice: boolean; // Remember this device
    trustedDuration: 30; // Days
  };
}
```

---

## 2. Role Definitions

### 2.1 Role Hierarchy

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

### 2.2 Role Descriptions

#### Super Admin

| Attribute | Value |
|-----------|-------|
| **Code** | `super_admin` |
| **Description** | Full system access across all clinics |
| **Typical Users** | IT Administrator, System Owner |
| **Clinic Access** | All clinics |
| **Can Manage** | Everything including system settings |

**Capabilities:**
- Access all clinics without switching
- Manage clinic configurations
- Create/delete clinics
- Manage all users
- Access audit logs
- System-wide reports
- Configure integrations

#### Clinic Admin

| Attribute | Value |
|-----------|-------|
| **Code** | `clinic_admin` |
| **Description** | Full access within assigned clinic(s) |
| **Typical Users** | Office Manager, Practice Manager |
| **Clinic Access** | Assigned clinics only |
| **Can Manage** | Clinic staff, settings, reports |

**Capabilities:**
- Full access to assigned clinic data
- Manage staff within clinic
- Configure clinic settings
- Generate reports
- Manage resources
- Cannot access other clinics

#### Doctor

| Attribute | Value |
|-----------|-------|
| **Code** | `doctor` |
| **Description** | Clinical access with treatment authority |
| **Typical Users** | Orthodontist, Dentist |
| **Clinic Access** | Assigned clinics |
| **Can Manage** | Treatment plans, clinical decisions |

**Capabilities:**
- Full clinical access
- Create/modify treatment plans
- View/add clinical images
- Order lab work
- Sign off on procedures
- Limited administrative access

#### Clinical Staff

| Attribute | Value |
|-----------|-------|
| **Code** | `clinical_staff` |
| **Description** | Patient care support role |
| **Typical Users** | Dental Assistant, Hygienist, Treatment Coordinator |
| **Clinic Access** | Assigned clinics |
| **Can Manage** | Patient records (limited) |

**Capabilities:**
- View patient records
- Update clinical notes
- Manage appointments
- View treatment plans
- Cannot create treatment plans
- Cannot access financial data

#### Front Desk

| Attribute | Value |
|-----------|-------|
| **Code** | `front_desk` |
| **Description** | Patient-facing administrative role |
| **Typical Users** | Receptionist, Scheduler |
| **Clinic Access** | Assigned clinics |
| **Can Manage** | Appointments, patient communications |

**Capabilities:**
- Manage scheduling
- Patient check-in/out
- Patient communications
- Basic patient demographics
- Cannot view clinical details
- Cannot access financial details

#### Billing

| Attribute | Value |
|-----------|-------|
| **Code** | `billing` |
| **Description** | Financial operations role |
| **Typical Users** | Billing Coordinator, Insurance Specialist |
| **Clinic Access** | Assigned clinics |
| **Can Manage** | Invoices, claims, payments |

**Capabilities:**
- Full financial access
- Process insurance claims
- Manage payment plans
- Generate financial reports
- View patient demographics (for billing)
- Cannot access clinical data

#### Read Only

| Attribute | Value |
|-----------|-------|
| **Code** | `read_only` |
| **Description** | View-only access for auditing/training |
| **Typical Users** | Auditor, Trainee, Consultant |
| **Clinic Access** | Assigned clinics |
| **Can Manage** | Nothing (view only) |

**Capabilities:**
- View all accessible data
- Cannot create, update, or delete
- Used for training and auditing
- Export limited to allowed reports

---

## 3. Permissions Matrix

### 3.1 Permission Structure

```typescript
// types/permissions.ts
type Permission = {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export';
};

type PermissionLevel = 'none' | 'view' | 'edit' | 'full';

// Permission level definitions
const PERMISSION_LEVELS = {
  none: [],
  view: ['read'],
  edit: ['create', 'read', 'update'],
  full: ['create', 'read', 'update', 'delete', 'export'],
} as const;
```

### 3.2 Area Permissions by Role

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

### 3.3 Special Permissions

Beyond area permissions, granular permissions control specific actions:

```typescript
// config/permissions.ts
export const SPECIAL_PERMISSIONS = {
  // Patient data
  'patient:view_phi': 'View protected health information',
  'patient:edit_phi': 'Edit protected health information',
  'patient:export': 'Export patient data',
  'patient:delete': 'Delete patient records',
  'patient:merge': 'Merge duplicate patients',

  // Financial
  'financial:view_rates': 'View fee schedules',
  'financial:edit_rates': 'Edit fee schedules',
  'financial:process_refunds': 'Process refunds',
  'financial:write_off': 'Write off balances',
  'financial:override_price': 'Override procedure prices',

  // Reports
  'reports:view_financial': 'View financial reports',
  'reports:view_clinical': 'View clinical reports',
  'reports:export': 'Export reports',
  'reports:schedule': 'Schedule automated reports',

  // System
  'audit:view_logs': 'View audit logs',
  'settings:manage_users': 'Create/edit users',
  'settings:manage_roles': 'Create/edit roles',
  'settings:manage_clinic': 'Manage clinic settings',

  // Multi-clinic
  'multi_clinic:switch': 'Switch between clinics',
  'multi_clinic:view_all': 'View data across all clinics',
  'multi_clinic:report_all': 'Run cross-clinic reports',
} as const;
```

### 3.4 Default Permissions by Role

```typescript
// config/defaultPermissions.ts
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, string[]> = {
  super_admin: Object.keys(SPECIAL_PERMISSIONS), // All permissions

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
    'reports:view_clinical',
    'multi_clinic:switch',
  ],

  clinical_staff: [
    'patient:view_phi',
    'patient:edit_phi',
  ],

  front_desk: [
    'patient:view_phi',
  ],

  billing: [
    'patient:view_phi',
    'financial:view_rates',
    'financial:process_refunds',
    'reports:view_financial',
    'reports:export',
  ],

  read_only: [],
};
```

---

## 4. Code Patterns

### 4.1 Protecting API Routes

```typescript
// lib/auth/withAuth.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './config';

type AuthOptions = {
  permissions?: string[];
  roles?: string[];
};

export function withAuth(
  handler: (req: NextRequest, session: Session) => Promise<NextResponse>,
  options: AuthOptions = {}
) {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    // Check role requirement
    if (options.roles && !options.roles.includes(session.user.role)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient role' } },
        { status: 403 }
      );
    }

    // Check permission requirements
    if (options.permissions) {
      const hasPermission = options.permissions.every(
        (p) => session.user.permissions.includes(p)
      );
      if (!hasPermission) {
        return NextResponse.json(
          { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
          { status: 403 }
        );
      }
    }

    return handler(req, session);
  };
}
```

#### Usage in API Routes

```typescript
// app/api/patients/route.ts
import { withAuth } from '@/lib/auth/withAuth';

export const GET = withAuth(
  async (req, session) => {
    const patients = await db.patient.findMany({
      where: { clinicId: session.user.clinicId },
    });
    return NextResponse.json({ success: true, data: patients });
  },
  { permissions: ['patient:view_phi'] }
);

export const DELETE = withAuth(
  async (req, session) => {
    // Delete logic
  },
  {
    roles: ['super_admin', 'clinic_admin'],
    permissions: ['patient:delete'],
  }
);
```

### 4.2 Protecting React Components

```typescript
// components/auth/PermissionGate.tsx
'use client';

import { useSession } from 'next-auth/react';
import { ReactNode } from 'react';

interface PermissionGateProps {
  children: ReactNode;
  permissions?: string[];
  roles?: string[];
  fallback?: ReactNode;
}

export function PermissionGate({
  children,
  permissions = [],
  roles = [],
  fallback = null,
}: PermissionGateProps) {
  const { data: session } = useSession();

  if (!session?.user) {
    return fallback;
  }

  // Check role
  if (roles.length > 0 && !roles.includes(session.user.role)) {
    return fallback;
  }

  // Check permissions
  if (permissions.length > 0) {
    const hasAllPermissions = permissions.every(
      (p) => session.user.permissions.includes(p)
    );
    if (!hasAllPermissions) {
      return fallback;
    }
  }

  return <>{children}</>;
}
```

#### Usage in Components

```tsx
// Example: Show delete button only for admins
<PermissionGate
  roles={['super_admin', 'clinic_admin']}
  permissions={['patient:delete']}
>
  <Button variant="destructive" onClick={handleDelete}>
    Delete Patient
  </Button>
</PermissionGate>

// Example: Show financial data only to billing
<PermissionGate permissions={['financial:view_rates']}>
  <FinancialSummary patientId={patientId} />
</PermissionGate>
```

### 4.3 Custom Hook for Permissions

```typescript
// hooks/usePermissions.ts
'use client';

import { useSession } from 'next-auth/react';

export function usePermissions() {
  const { data: session, status } = useSession();

  const hasPermission = (permission: string): boolean => {
    if (!session?.user) return false;
    return session.user.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!session?.user) return false;
    return permissions.some((p) => session.user.permissions.includes(p));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!session?.user) return false;
    return permissions.every((p) => session.user.permissions.includes(p));
  };

  const hasRole = (role: string): boolean => {
    if (!session?.user) return false;
    return session.user.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    if (!session?.user) return false;
    return roles.includes(session.user.role);
  };

  const isAdmin = (): boolean => {
    return hasAnyRole(['super_admin', 'clinic_admin']);
  };

  return {
    user: session?.user,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
  };
}
```

#### Usage

```tsx
function PatientActions({ patientId }: { patientId: string }) {
  const { hasPermission, isAdmin } = usePermissions();

  return (
    <div className="flex gap-2">
      <Button onClick={handleView}>View</Button>

      {hasPermission('patient:edit_phi') && (
        <Button onClick={handleEdit}>Edit</Button>
      )}

      {isAdmin() && hasPermission('patient:delete') && (
        <Button variant="destructive" onClick={handleDelete}>
          Delete
        </Button>
      )}
    </div>
  );
}
```

---

## 5. Multi-Clinic Data Isolation

### 5.1 Clinic ID Enforcement

**CRITICAL**: Every database query MUST include `clinicId` filter.

```typescript
// CORRECT: Always filter by clinicId
const patients = await db.patient.findMany({
  where: {
    clinicId: session.user.clinicId, // REQUIRED
    deletedAt: null,
  },
});

// WRONG: Missing clinicId (security vulnerability!)
const patients = await db.patient.findMany({
  where: {
    deletedAt: null,
  },
});
```

### 5.2 Query Patterns

#### Single Clinic Query

```typescript
// Standard query - single clinic
async function getPatients(clinicId: string) {
  return db.patient.findMany({
    where: { clinicId },
    orderBy: { lastName: 'asc' },
  });
}
```

#### Multi-Clinic Query (Admin Only)

```typescript
// Multi-clinic query - requires special permission
async function getAllPatientsAcrossClinics(
  session: Session,
  clinicIds?: string[]
) {
  // Check permission
  if (!session.user.permissions.includes('multi_clinic:view_all')) {
    throw new ForbiddenError('Cannot access multi-clinic data');
  }

  // If clinicIds provided, filter to those; otherwise use user's assigned clinics
  const targetClinicIds = clinicIds ?? session.user.clinicIds;

  return db.patient.findMany({
    where: {
      clinicId: { in: targetClinicIds },
    },
    orderBy: { lastName: 'asc' },
  });
}
```

### 5.3 Clinic Switching

```typescript
// lib/auth/clinicContext.ts
'use client';

import { createContext, useContext, useState } from 'react';

interface ClinicContextType {
  currentClinicId: string;
  availableClinics: Clinic[];
  switchClinic: (clinicId: string) => void;
}

const ClinicContext = createContext<ClinicContextType | null>(null);

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const [currentClinicId, setCurrentClinicId] = useState(
    session?.user?.clinicId ?? ''
  );

  const switchClinic = (clinicId: string) => {
    // Verify user has access to this clinic
    if (!session?.user?.clinicIds.includes(clinicId)) {
      throw new Error('Not authorized for this clinic');
    }
    setCurrentClinicId(clinicId);
    // Optionally: Update session, refresh data
  };

  return (
    <ClinicContext.Provider
      value={{
        currentClinicId,
        availableClinics: session?.user?.clinics ?? [],
        switchClinic,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinic() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within ClinicProvider');
  }
  return context;
}
```

### 5.4 Row-Level Security Pattern

```typescript
// middleware/clinicFilter.ts
import { Prisma } from '@prisma/client';

// Prisma middleware to enforce clinic filtering
export const clinicFilterMiddleware: Prisma.Middleware = async (
  params,
  next
) => {
  const session = getCurrentSession(); // Get from context

  // Models that require clinic filtering
  const clinicScopedModels = [
    'Patient',
    'Appointment',
    'Treatment',
    'Invoice',
    // ... all clinic-scoped models
  ];

  if (clinicScopedModels.includes(params.model ?? '')) {
    // For find operations, add clinic filter
    if (params.action === 'findMany' || params.action === 'findFirst') {
      params.args.where = {
        ...params.args.where,
        clinicId: session.user.clinicId,
      };
    }

    // For create operations, ensure clinicId is set
    if (params.action === 'create') {
      params.args.data.clinicId = session.user.clinicId;
    }
  }

  return next(params);
};
```

---

## 6. Audit Logging Requirements

### 6.1 Events to Log

| Category | Events |
|----------|--------|
| **Authentication** | Login, logout, failed login, password reset, MFA events |
| **Patient Data** | View PHI, create, update, delete, export |
| **Financial** | Create invoice, process payment, refund, write-off |
| **Clinical** | Treatment plan changes, procedure completion |
| **Administrative** | User changes, role changes, settings changes |
| **System** | API errors, security events, configuration changes |

### 6.2 Audit Log Schema

```prisma
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
  before    Json?    // State before change (for updates)
  after     Json?    // State after change (for updates)

  // Indexes
  @@index([userId])
  @@index([clinicId])
  @@index([entity, entityId])
  @@index([timestamp])
  @@index([action])
}
```

### 6.3 Logging Implementation

```typescript
// lib/audit.ts
import { db } from '@/lib/db';
import { Session } from 'next-auth';

interface AuditLogData {
  action: string;
  entity: string;
  entityId?: string;
  details?: Record<string, unknown>;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
}

export async function logAudit(
  session: Session,
  data: AuditLogData,
  request?: Request
) {
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      userIp: request?.headers.get('x-forwarded-for') ?? undefined,
      clinicId: session.user.clinicId,
      ...data,
    },
  });
}

// Usage
await logAudit(session, {
  action: 'UPDATE',
  entity: 'Patient',
  entityId: patient.id,
  details: { field: 'email', reason: 'Patient request' },
  before: { email: oldEmail },
  after: { email: newEmail },
});
```

### 6.4 PHI Access Logging

For HIPAA compliance, all PHI access must be logged:

```typescript
// lib/audit/phiAccess.ts
export async function logPhiAccess(
  session: Session,
  patientId: string,
  accessType: 'view' | 'export' | 'print',
  fields?: string[]
) {
  await db.auditLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      clinicId: session.user.clinicId,
      action: `PHI_${accessType.toUpperCase()}`,
      entity: 'Patient',
      entityId: patientId,
      details: {
        accessType,
        fieldsAccessed: fields ?? ['full_record'],
        timestamp: new Date().toISOString(),
      },
    },
  });
}
```

---

## 7. Security Checklist

### 7.1 Pre-Deployment Checklist

- [ ] All API routes use `withAuth` wrapper
- [ ] All routes check appropriate permissions
- [ ] All queries include `clinicId` filter
- [ ] PHI access is logged
- [ ] Session timeout is configured
- [ ] CSRF protection is enabled
- [ ] Password requirements enforced
- [ ] Failed login attempts are rate-limited
- [ ] Audit logging is functioning
- [ ] Role assignments reviewed

### 7.2 Code Review Checklist

When reviewing code, verify:

```
Authentication:
- [ ] Route requires authentication
- [ ] Session is validated

Authorization:
- [ ] Correct role check
- [ ] Correct permission check
- [ ] No privilege escalation possible

Data Access:
- [ ] clinicId filter present
- [ ] User can only access own clinic data
- [ ] Soft delete respected (deletedAt: null)

Audit:
- [ ] PHI access logged
- [ ] State changes logged
- [ ] User context captured
```

---

## 8. Password Policy

### 8.1 Requirements

| Requirement | Value |
|-------------|-------|
| Minimum length | 12 characters |
| Uppercase letters | At least 1 |
| Lowercase letters | At least 1 |
| Numbers | At least 1 |
| Special characters | At least 1 |
| Password history | Cannot reuse last 5 passwords |
| Maximum age | 90 days |

### 8.2 Validation Schema

```typescript
// lib/validations/password.ts
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    'Password must contain at least one special character'
  );
```

---

## 9. Type Definitions

```typescript
// types/auth.ts
export type Role =
  | 'super_admin'
  | 'clinic_admin'
  | 'doctor'
  | 'clinical_staff'
  | 'front_desk'
  | 'billing'
  | 'read_only';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  permissions: string[];
  clinicId: string; // Current active clinic
  clinicIds: string[]; // All assigned clinics
}

export interface Session {
  user: User;
  expires: string;
}

// Extend NextAuth types
declare module 'next-auth' {
  interface Session {
    user: User;
  }

  interface User {
    id: string;
    role: Role;
    permissions: string[];
    clinicId: string;
    clinicIds: string[];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    permissions: string[];
    clinicId: string;
    clinicIds: string[];
  }
}
```

---

**Status**: Active
**Last Updated**: 2024-11-26
**Owner**: Security Team
