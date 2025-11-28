# Row-Level Security

> **Sub-Area**: [Data Isolation](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Implements automatic clinic filtering via Prisma middleware. Acts as a safety net to ensure clinicId is always applied to queries, even if developers forget. Provides defense-in-depth for the critical data isolation requirement.

---

## Core Requirements

- [ ] Create Prisma middleware for automatic filtering
- [ ] Apply clinicId to find, update, delete operations
- [ ] Apply clinicId to create operations
- [ ] Skip filtering for global-scoped models
- [ ] Skip filtering for super admin
- [ ] Log middleware activity for debugging

---

## API Endpoints

No endpoints - middleware operates automatically on all database operations.

---

## Data Model

No additional models - middleware modifies existing query parameters.

---

## Business Rules

### Middleware Implementation

```typescript
// lib/db/clinicFilterMiddleware.ts
import { Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const CLINIC_SCOPED_MODELS = [
  'Patient', 'Appointment', 'Treatment', 'Invoice',
  'Payment', 'LabOrder', 'Image', 'Communication',
  'Lead', 'Staff', 'Equipment', 'InventoryItem', 'Room',
];

const GLOBAL_MODELS = ['User', 'Role', 'Permission', 'Clinic'];

export const clinicFilterMiddleware: Prisma.Middleware = async (params, next) => {
  const session = await getServerSession(authOptions);

  // Skip if no session (public routes handled by route protection)
  if (!session?.user) {
    return next(params);
  }

  // Skip for super admin (can access all clinics)
  if (session.user.role === 'super_admin') {
    return next(params);
  }

  // Skip for global models
  if (!params.model || GLOBAL_MODELS.includes(params.model)) {
    return next(params);
  }

  // Skip if not a clinic-scoped model
  if (!CLINIC_SCOPED_MODELS.includes(params.model)) {
    return next(params);
  }

  const clinicId = session.user.clinicId;

  // Apply filter based on operation type
  switch (params.action) {
    case 'findMany':
    case 'findFirst':
    case 'findUnique':
    case 'count':
    case 'aggregate':
      params.args = params.args || {};
      params.args.where = { ...params.args.where, clinicId };
      break;

    case 'create':
      params.args = params.args || {};
      params.args.data = { ...params.args.data, clinicId };
      break;

    case 'createMany':
      params.args = params.args || {};
      params.args.data = params.args.data.map((item: any) => ({
        ...item,
        clinicId,
      }));
      break;

    case 'update':
    case 'updateMany':
    case 'delete':
    case 'deleteMany':
      params.args = params.args || {};
      params.args.where = { ...params.args.where, clinicId };
      break;
  }

  return next(params);
};
```

### Applying Middleware

```typescript
// lib/db/index.ts
import { PrismaClient } from '@prisma/client';
import { clinicFilterMiddleware } from './clinicFilterMiddleware';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma || new PrismaClient();

// Apply clinic filter middleware
db.$use(clinicFilterMiddleware);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
```

### Limitations

- Middleware cannot access request context directly (uses getServerSession)
- Raw queries bypass middleware - avoid using db.$queryRaw for clinic data
- Middleware adds slight overhead - acceptable for security benefit

---

## Dependencies

**Depends On:**
- Prisma ORM
- Session Management
- NextAuth getServerSession

**Required By:**
- All database operations (automatically)

---

## Notes

- Middleware is safety net, not replacement for explicit clinicId
- Developers should still include clinicId in code (defense in depth)
- Consider: logging when middleware adds missing clinicId (indicates code issue)
