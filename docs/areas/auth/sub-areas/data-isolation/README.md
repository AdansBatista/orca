# Data Isolation

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

This sub-area defines the multi-clinic data isolation rules for Orca. Data isolation is the most critical security control in the system - every database query MUST include clinic scope to prevent data leakage between clinics.

### Key Capabilities

- **Clinic ID Enforcement**: Mandatory clinicId on all queries
- **Query Patterns**: Safe patterns for single and multi-clinic queries
- **Clinic Switching**: Controlled context switching for multi-clinic users
- **Row-Level Security**: Prisma middleware for automatic filtering

---

## Functions

| # | Function | Description | Priority |
|---|----------|-------------|----------|
| 1 | [Clinic ID Enforcement](./functions/) | Mandatory query filtering | Critical |
| 2 | [Query Patterns](./functions/) | Safe single/multi-clinic patterns | Critical |
| 3 | [Clinic Switching](./functions/) | Context switching for users | High |
| 4 | [Row-Level Security](./functions/) | Automatic Prisma middleware | High |

---

## Critical Rule

> **EVERY database query MUST include `clinicId` filter.**

This is the most important security rule in the entire system. Failure to include clinicId allows cross-clinic data access, which is a critical security vulnerability and HIPAA violation.

```typescript
// ✅ CORRECT - Always filter by clinicId
const patients = await db.patient.findMany({
  where: {
    clinicId: session.user.clinicId, // REQUIRED
    deletedAt: null,
  },
});

// ❌ WRONG - Security vulnerability!
const patients = await db.patient.findMany({
  where: {
    deletedAt: null,
    // Missing clinicId = can see ALL patients in system!
  },
});
```

---

## Query Patterns

### Single Clinic Query (Standard)

The most common pattern - query within the current clinic:

```typescript
// Standard query - single clinic
async function getPatients(session: Session) {
  return db.patient.findMany({
    where: {
      clinicId: session.user.clinicId,
      deletedAt: null,
    },
    orderBy: { lastName: 'asc' },
  });
}
```

### Multi-Clinic Query (Admin Only)

For users with multi-clinic access:

```typescript
// Multi-clinic query - requires special permission
async function getAllPatientsAcrossClinics(
  session: Session,
  clinicIds?: string[]
) {
  // Check permission first
  if (!session.user.permissions.includes('multi_clinic:view_all')) {
    throw new ForbiddenError('Cannot access multi-clinic data');
  }

  // If clinicIds provided, filter to those
  // Otherwise use user's assigned clinics
  const targetClinicIds = clinicIds ?? session.user.clinicIds;

  // Verify user has access to all requested clinics
  const unauthorizedClinics = targetClinicIds.filter(
    id => !session.user.clinicIds.includes(id)
  );
  if (unauthorizedClinics.length > 0) {
    throw new ForbiddenError('Unauthorized clinic access');
  }

  return db.patient.findMany({
    where: {
      clinicId: { in: targetClinicIds },
      deletedAt: null,
    },
    orderBy: { lastName: 'asc' },
  });
}
```

### Super Admin Query (Cross-Clinic)

For super admins who can access all clinics:

```typescript
// Super admin cross-clinic query
async function getSystemWidePatients(session: Session) {
  // Verify super admin role
  if (session.user.role !== 'super_admin') {
    throw new ForbiddenError('Super admin access required');
  }

  // Super admin can query without clinicId filter
  // But should still be explicit about intent
  return db.patient.findMany({
    where: {
      deletedAt: null,
    },
    include: {
      clinic: true, // Include clinic for context
    },
    orderBy: { lastName: 'asc' },
  });
}
```

### Create with Clinic ID

When creating records, always set clinicId:

```typescript
// Creating a record - always include clinicId
async function createPatient(
  session: Session,
  data: CreatePatientInput
) {
  return db.patient.create({
    data: {
      ...data,
      clinicId: session.user.clinicId, // REQUIRED
      createdBy: session.user.id,
    },
  });
}
```

### Update with Clinic Verification

When updating, verify clinic ownership:

```typescript
// Update - verify clinicId in WHERE clause
async function updatePatient(
  session: Session,
  patientId: string,
  data: UpdatePatientInput
) {
  // The where clause ensures we can only update our clinic's patients
  return db.patient.update({
    where: {
      id: patientId,
      clinicId: session.user.clinicId, // Prevents cross-clinic update
    },
    data: {
      ...data,
      updatedBy: session.user.id,
    },
  });
}
```

---

## Clinic Switching

For users with access to multiple clinics:

### React Context Provider

```typescript
// lib/auth/clinicContext.tsx
'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

interface ClinicContextType {
  currentClinicId: string;
  currentClinic: Clinic | null;
  availableClinics: Clinic[];
  switchClinic: (clinicId: string) => Promise<void>;
  canSwitchClinics: boolean;
}

const ClinicContext = createContext<ClinicContextType | null>(null);

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession();
  const [currentClinicId, setCurrentClinicId] = useState(
    session?.user?.clinicId ?? ''
  );

  const switchClinic = useCallback(async (clinicId: string) => {
    // Verify user has access to this clinic
    if (!session?.user?.clinicIds.includes(clinicId)) {
      throw new Error('Not authorized for this clinic');
    }

    // Update local state
    setCurrentClinicId(clinicId);

    // Update session (triggers server-side update)
    await update({ clinicId });

    // Optionally: Refresh page data
    window.location.reload();
  }, [session, update]);

  const canSwitchClinics = (session?.user?.clinicIds?.length ?? 0) > 1;

  return (
    <ClinicContext.Provider
      value={{
        currentClinicId,
        currentClinic: session?.user?.clinics?.find(c => c.id === currentClinicId) ?? null,
        availableClinics: session?.user?.clinics ?? [],
        switchClinic,
        canSwitchClinics,
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

### Clinic Switcher Component

```tsx
// components/auth/ClinicSwitcher.tsx
'use client';

import { useClinic } from '@/lib/auth/clinicContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ClinicSwitcher() {
  const {
    currentClinicId,
    availableClinics,
    switchClinic,
    canSwitchClinics,
  } = useClinic();

  if (!canSwitchClinics) {
    return null;
  }

  return (
    <Select value={currentClinicId} onValueChange={switchClinic}>
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select clinic" />
      </SelectTrigger>
      <SelectContent>
        {availableClinics.map((clinic) => (
          <SelectItem key={clinic.id} value={clinic.id}>
            {clinic.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

---

## Row-Level Security Middleware

Prisma middleware to automatically enforce clinic filtering:

```typescript
// lib/db/clinicFilterMiddleware.ts
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

// Models that require clinic filtering
const CLINIC_SCOPED_MODELS = [
  'Patient',
  'Appointment',
  'Treatment',
  'Invoice',
  'Payment',
  'LabOrder',
  'Image',
  'Communication',
  'Lead',
  // Add all clinic-scoped models
];

export const clinicFilterMiddleware: Prisma.Middleware = async (
  params,
  next
) => {
  const session = await getServerSession(authOptions);

  // Skip if no session (public routes) or super admin
  if (!session?.user || session.user.role === 'super_admin') {
    return next(params);
  }

  const model = params.model;
  if (!model || !CLINIC_SCOPED_MODELS.includes(model)) {
    return next(params);
  }

  const clinicId = session.user.clinicId;

  // Add clinic filter to queries
  if (['findMany', 'findFirst', 'findUnique', 'count'].includes(params.action)) {
    params.args = params.args || {};
    params.args.where = {
      ...params.args.where,
      clinicId,
    };
  }

  // Add clinicId to create operations
  if (params.action === 'create') {
    params.args = params.args || {};
    params.args.data = {
      ...params.args.data,
      clinicId,
    };
  }

  // Add clinic filter to update/delete operations
  if (['update', 'updateMany', 'delete', 'deleteMany'].includes(params.action)) {
    params.args = params.args || {};
    params.args.where = {
      ...params.args.where,
      clinicId,
    };
  }

  return next(params);
};
```

### Applying the Middleware

```typescript
// lib/db/index.ts
import { PrismaClient } from '@prisma/client';
import { clinicFilterMiddleware } from './clinicFilterMiddleware';

const prisma = new PrismaClient();

// Apply middleware
prisma.$use(clinicFilterMiddleware);

export const db = prisma;
```

---

## Data Model

### Clinic-Scoped Model Pattern

Every clinic-scoped model should include:

```prisma
model Patient {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId

  // Clinic scope - REQUIRED
  clinicId  String   @db.ObjectId
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  // Other fields...
  firstName String
  lastName  String

  // Audit fields
  createdAt DateTime @default(now())
  createdBy String   @db.ObjectId
  updatedAt DateTime @updatedAt
  updatedBy String?  @db.ObjectId
  deletedAt DateTime?
  deletedBy String?  @db.ObjectId

  // IMPORTANT: Index on clinicId for performance
  @@index([clinicId])
}
```

---

## Business Rules

### Clinic Access Rules

| Role | Clinic Access |
|------|---------------|
| Super Admin | All clinics (global scope) |
| Clinic Admin | Multiple assigned clinics |
| All other roles | Single assigned clinic |

### Query Requirements

1. **All queries** must include clinicId (except super admin cross-clinic queries)
2. **All creates** must set clinicId from session
3. **All updates/deletes** must verify clinicId in WHERE clause
4. **Multi-clinic queries** require `multi_clinic:view_all` permission

### Audit Requirements

- Log all cross-clinic data access
- Log all clinic switches
- Alert on unusual cross-clinic patterns

---

## Security Considerations

### Common Mistakes to Avoid

```typescript
// ❌ WRONG: Forgetting clinicId
const patients = await db.patient.findMany({});

// ❌ WRONG: Using user-provided clinicId without validation
const patients = await db.patient.findMany({
  where: { clinicId: req.body.clinicId }, // User could provide any clinic!
});

// ✅ CORRECT: Always use session clinicId
const patients = await db.patient.findMany({
  where: { clinicId: session.user.clinicId },
});

// ✅ CORRECT: Validate against user's authorized clinics
if (!session.user.clinicIds.includes(requestedClinicId)) {
  throw new ForbiddenError('Unauthorized clinic');
}
```

### Code Review Checklist

When reviewing code, verify:

- [ ] All findMany/findFirst include clinicId filter
- [ ] All create operations set clinicId from session
- [ ] All update/delete include clinicId in WHERE
- [ ] Cross-clinic queries check permissions
- [ ] No user-provided clinicId without validation

---

## Dependencies

### Internal
- [Authentication](../authentication/) - Session provides clinicId
- [Role System](../role-system/) - Role determines clinic access

### External
- Prisma - Database ORM with middleware support

---

## Related Documentation

- [Parent: Auth & Authorization](../../)
- [AUTH-PATTERNS.md](../../../../guides/AUTH-PATTERNS.md) - Code patterns
- [QUICK-REFERENCE.md](../../../../QUICK-REFERENCE.md) - Critical rules

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented
