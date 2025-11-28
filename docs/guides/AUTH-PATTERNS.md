# Auth Patterns Reference

> **Purpose**: Code implementation patterns for authentication and authorization in Orca.
>
> **For full documentation**: See [Auth & Authorization Area](../areas/auth/)

---

## Quick Links

| Documentation | Location |
|---------------|----------|
| **Full Auth Documentation** | [Auth & Authorization Area](../areas/auth/) |
| **Role Definitions** | [Role System Sub-Area](../areas/auth/sub-areas/role-system/) |
| **Permissions Matrix** | [Permissions Sub-Area](../areas/auth/sub-areas/permissions/) |
| **Data Isolation Rules** | [Data Isolation Sub-Area](../areas/auth/sub-areas/data-isolation/) |
| **Audit Logging** | [Audit & Compliance Sub-Area](../areas/auth/sub-areas/audit-compliance/) |

---

## Critical Rules Summary

### 1. Always Use withAuth Wrapper

```typescript
// ✅ CORRECT - Protected route
export const GET = withAuth(
  async (req, session) => {
    const data = await db.model.findMany({
      where: { clinicId: session.user.clinicId },
    });
    return NextResponse.json({ success: true, data });
  },
  { permissions: ['resource:read'] }
);

// ❌ WRONG - Unprotected route
export async function GET(req: Request) {
  // No auth check!
}
```

### 2. Always Include clinicId

```typescript
// ✅ CORRECT
const patients = await db.patient.findMany({
  where: { clinicId: session.user.clinicId },
});

// ❌ WRONG - Security vulnerability!
const patients = await db.patient.findMany({});
```

### 3. Never Log PHI

```typescript
// ✅ CORRECT
console.log('Patient updated', { patientId: patient.id });

// ❌ WRONG - Logs PHI!
console.log('Patient updated', patient);
```

---

## Code Patterns

### Protecting API Routes (withAuth)

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

#### Usage Examples

```typescript
// app/api/patients/route.ts
import { withAuth } from '@/lib/auth/withAuth';

// GET - requires patient:view_phi permission
export const GET = withAuth(
  async (req, session) => {
    const patients = await db.patient.findMany({
      where: { clinicId: session.user.clinicId },
    });
    return NextResponse.json({ success: true, data: patients });
  },
  { permissions: ['patient:view_phi'] }
);

// DELETE - requires admin role AND patient:delete permission
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

---

### Protecting React Components (PermissionGate)

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

#### Usage Examples

```tsx
// Show delete button only for admins with permission
<PermissionGate
  roles={['super_admin', 'clinic_admin']}
  permissions={['patient:delete']}
>
  <Button variant="destructive" onClick={handleDelete}>
    Delete Patient
  </Button>
</PermissionGate>

// Show financial data only to billing
<PermissionGate permissions={['financial:view_rates']}>
  <FinancialSummary patientId={patientId} />
</PermissionGate>

// Show admin menu only to admins
<PermissionGate roles={['super_admin', 'clinic_admin']}>
  <AdminMenu />
</PermissionGate>
```

---

### Permission Hook (usePermissions)

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

#### Usage Examples

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

### Server-Side Permission Check (hasPermission)

```typescript
// lib/auth/hasPermission.ts
import { Session } from 'next-auth';

export function hasPermission(session: Session, permission: string): boolean {
  return session.user.permissions.includes(permission);
}

export function hasAnyPermission(session: Session, permissions: string[]): boolean {
  return permissions.some((p) => session.user.permissions.includes(p));
}

export function hasAllPermissions(session: Session, permissions: string[]): boolean {
  return permissions.every((p) => session.user.permissions.includes(p));
}

export function hasRole(session: Session, role: string): boolean {
  return session.user.role === role;
}

export function isAdmin(session: Session): boolean {
  return ['super_admin', 'clinic_admin'].includes(session.user.role);
}
```

---

### Audit Logging Pattern

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

---

## Type Definitions

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
  clinicId: string;      // Current active clinic
  clinicIds: string[];   // All assigned clinics
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

## NextAuth Configuration

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

---

## Password Validation

```typescript
// lib/validations/password.ts
import { z } from 'zod';

export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Must contain at least one number')
  .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Must contain at least one special character');
```

---

## Related Documentation

- [Auth & Authorization Area](../areas/auth/) - Full documentation
- [TECH-STACK.md](./TECH-STACK.md) - Technology standards
- [QUICK-REFERENCE.md](../QUICK-REFERENCE.md) - Pattern cheat sheet

---

**Status**: Active
**Last Updated**: 2024-11-27
