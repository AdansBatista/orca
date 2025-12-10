# Quick Reference

> **Purpose**: One-page cheat sheet for common patterns and rules
>
> **For detailed documentation**: See individual guides in `docs/guides/`

---

## Critical Rules (Must Follow)

### 1. Multi-Clinic Data Isolation

**EVERY database query MUST include `clinicId` filter.**

```typescript
// ✅ CORRECT
const patients = await db.patient.findMany({
  where: { clinicId: session.user.clinicId },
});

// ❌ WRONG - Security vulnerability!
const patients = await db.patient.findMany({});
```

### 2. Always Use withAuth Wrapper

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

### 3. Never Log PHI

```typescript
// ✅ CORRECT
console.log('Patient updated', { patientId: patient.id });

// ❌ WRONG - Logs PHI!
console.log('Patient updated', patient);
```

---

## Response Formats

### Success Response
```typescript
{ success: true, data: {...} }
```

### Error Response
```typescript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'Human readable message'
  }
}
```

### Paginated Response
```typescript
{
  success: true,
  data: {
    items: [...],
    total: 100,
    page: 1,
    pageSize: 20,
    totalPages: 5
  }
}
```

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `PatientCard.tsx` |
| Utilities | camelCase | `formatDate.ts` |
| API Routes | kebab-case | `api/patient-records/route.ts` |
| Hooks | camelCase + use | `usePatients.ts` |
| Types | PascalCase | `Patient.ts` |
| Constants | SCREAMING_SNAKE | `MAX_FILE_SIZE` |

---

## Import Order

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { z } from 'zod';
import { format } from 'date-fns';

// 3. Internal imports (@/)
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { withAuth } from '@/lib/auth';

// 4. Relative imports
import { schema } from './schemas';
import { helper } from '../utils';

// 5. Type imports
import type { Patient } from '@/types';
```

---

## Common Zod Schemas

```typescript
// MongoDB ObjectId
const objectId = z.string().regex(/^[a-f\d]{24}$/i);

// Pagination params
const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});

// Date range
const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

// Phone number
const phoneSchema = z.string().regex(/^\+?[\d\s-()]+$/);

// Email
const emailSchema = z.string().email();
```

---

## Audit Logging

```typescript
await logAudit(session, {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
  entity: 'Patient' | 'Appointment' | 'Treatment' | etc,
  entityId: record.id,
  details: { field: 'value' }, // What changed
});
```

---

## Permission Codes Pattern

```
{area}:{action}

Examples:
- patient:read
- patient:create
- appointment:update
- treatment:delete
- billing:view_financial
```

---

## User Roles Quick Reference

| Role | Scope | Typical Use |
|------|-------|-------------|
| `super_admin` | All clinics | System administration |
| `clinic_admin` | Assigned clinics | Practice management |
| `doctor` | Clinical data | Treatment decisions |
| `clinical_staff` | Patient care | Chairside assistance |
| `front_desk` | Scheduling | Reception duties |
| `billing` | Financial | Claims & payments |
| `read_only` | View only | Reporting access |

---

## Component Pattern

```typescript
interface Props {
  patient: Patient;
  onSelect?: (patient: Patient) => void;
}

export function PatientCard({ patient, onSelect }: Props) {
  return (
    <Card onClick={() => onSelect?.(patient)}>
      <CardHeader>
        <CardTitle>{patient.name}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Content */}
      </CardContent>
    </Card>
  );
}
```

---

## API Route Pattern

```typescript
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth';
import { db } from '@/lib/db';

const createSchema = z.object({
  name: z.string().min(1),
  // ... other fields
});

export const POST = withAuth(
  async (req, session) => {
    const body = await req.json();
    const data = createSchema.parse(body);

    const record = await db.model.create({
      data: {
        ...data,
        clinicId: session.user.clinicId,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({ success: true, data: record });
  },
  { permissions: ['resource:create'] }
);
```

---

## Soft Delete Pattern

```typescript
// Delete (soft)
await db.patient.update({
  where: { id: patientId },
  data: {
    deletedAt: new Date(),
    deletedBy: session.user.id,
  },
});

// Query (exclude deleted)
const patients = await db.patient.findMany({
  where: {
    clinicId: session.user.clinicId,
    deletedAt: null,  // Always filter out soft-deleted
  },
});
```

---

## Quick Links

| Need | Document |
|------|----------|
| Full coding standards | [TECH-STACK.md](guides/TECH-STACK.md) |
| UI components & styles | [STYLING-GUIDE.md](guides/STYLING-GUIDE.md) |
| Auth architecture | [Auth Area](areas/auth/) |
| Auth code patterns | [AUTH-PATTERNS.md](guides/AUTH-PATTERNS.md) |
| AI features | [AI-INTEGRATION.md](guides/AI-INTEGRATION.md) |
| Project status | [MASTER-INDEX.md](MASTER-INDEX.md) |
| What to work on | [CURRENT-FOCUS.md](CURRENT-FOCUS.md) |
| Doc conventions | [DOCUMENTATION-STANDARDS.md](DOCUMENTATION-STANDARDS.md) |

---

**Last Updated**: 2025-12-09
