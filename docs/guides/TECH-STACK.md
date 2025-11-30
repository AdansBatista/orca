# Tech Stack Guide

This document defines the technology choices, coding patterns, and conventions for the Orca project. All development must follow these standards for consistency and maintainability.

---

## 1. Technology Choices & Versions

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 15+ | React framework with SSR, API routes |
| **React** | 19+ | UI library |
| **TypeScript** | 5+ | Type-safe JavaScript |
| **TailwindCSS** | 3+ | Utility-first CSS framework |
| **shadcn/ui** | Latest | Component library (themed via CSS variables) |
| **React Hook Form** | 7+ | Form state management |
| **Zod** | 4+ | Schema validation |
| **Recharts** | 3+ | Charts and data visualization |
| **Cornerstone.js** | 4+ | DICOM/medical image viewing |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | 15+ | neat API based |
| **Node.js** | 20+ | JavaScript runtime |
| **Prisma** | 5+ | ORM and database toolkit |
| **NextAuth.js** | 4+ | Authentication |
| **Puppeteer** | 21+ | Server-side PDF generation |

### Database & Storage

| Technology | Version | Purpose |
|------------|---------|---------|
| **MongoDB** | 7+ | Primary database |
| **Local File System** | - | Encrypted file storage for images/documents |

### Development Tools

| Technology | Purpose |
|------------|---------|
| **Git** | Version control |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Jest** | Unit testing |
| **Playwright** | E2E testing |

---

## 2. Project Structure & Folder Conventions

```
orca/
├── .claude/                    # Claude Code configuration
│   ├── settings.local.json
│   └── commands/               # Custom slash commands
│
├── docs/                       # Documentation (see MASTER-INDEX.md)
│   ├── guides/                 # Technical foundation documents
│   ├── areas/                  # Feature documentation by area
│   └── templates/              # Document templates
│
├── prisma/                     # Database schema and migrations
│   ├── schema.prisma
│   └── migrations/
│
├── public/                     # Static assets
│   ├── images/
│   └── fonts/
│
├── src/                        # Application source code
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth-required routes (grouped)
│   │   ├── (public)/          # Public routes (grouped)
│   │   ├── api/               # API routes
│   │   └── layout.tsx         # Root layout
│   │
│   ├── components/            # React components
│   │   ├── ui/                # Base UI components (shadcn)
│   │   ├── forms/             # Form components
│   │   ├── layouts/           # Layout components
│   │   └── [feature]/         # Feature-specific components
│   │
│   ├── lib/                   # Shared utilities and helpers
│   │   ├── auth/              # Authentication utilities
│   │   ├── db/                # Database utilities
│   │   ├── utils/             # General utilities
│   │   └── validations/       # Zod schemas
│   │
│   ├── hooks/                 # Custom React hooks
│   │
│   ├── types/                 # TypeScript type definitions
│   │
│   ├── styles/                # Global styles
│   │   └── globals.css
│   │
│   └── config/                # Application configuration
│       ├── constants.ts
│       └── permissions.ts
│
├── tests/                     # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── scripts/                   # Utility scripts
│
├── CLAUDE.md                  # Claude Code instructions
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.ts
```

---

## 3. Coding Patterns & Conventions

### 3.1 TypeScript Patterns

#### Type Definitions
```typescript
// Use interfaces for object shapes
interface Patient {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email?: string;  // Optional fields use ?
  createdAt: Date;
  updatedAt: Date;
}

// Use type for unions, intersections, and aliases
type PatientStatus = 'active' | 'inactive' | 'archived';
type PatientWithTreatment = Patient & { treatment: Treatment };

// Use enums sparingly, prefer const objects
const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

type AppointmentStatus = typeof APPOINTMENT_STATUS[keyof typeof APPOINTMENT_STATUS];
```

#### Generic Types
```typescript
// API response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Paginated response
interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

#### Strict Null Checks
```typescript
// Always handle null/undefined explicitly
function getPatientName(patient: Patient | null): string {
  if (!patient) {
    return 'Unknown';
  }
  return `${patient.firstName} ${patient.lastName}`;
}

// Use optional chaining and nullish coalescing
const email = patient?.email ?? 'No email provided';
```

### 3.2 React Component Patterns

#### Functional Components with TypeScript
```typescript
// Component props interface
interface PatientCardProps {
  patient: Patient;
  onSelect?: (patient: Patient) => void;
  isSelected?: boolean;
  className?: string;
}

// Component definition
export function PatientCard({
  patient,
  onSelect,
  isSelected = false,
  className,
}: PatientCardProps) {
  const handleClick = () => {
    onSelect?.(patient);
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        isSelected && 'border-primary bg-primary/5',
        className
      )}
      onClick={handleClick}
    >
      <h3 className="font-semibold">
        {patient.firstName} {patient.lastName}
      </h3>
      <p className="text-sm text-muted-foreground">{patient.email}</p>
    </div>
  );
}
```

#### Server Components (Default in App Router)
```typescript
// app/patients/page.tsx - Server Component
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { PatientList } from '@/components/patients/PatientList';

export default async function PatientsPage() {
  const user = await getCurrentUser();

  const patients = await db.patient.findMany({
    where: { clinicId: user.clinicId },
    orderBy: { lastName: 'asc' },
  });

  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Patients</h1>
      <PatientList patients={patients} />
    </div>
  );
}
```

#### Client Components
```typescript
// components/patients/PatientSearch.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { searchPatients } from '@/app/actions/patients';

export function PatientSearch() {
  const [query, setQuery] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSearch = (value: string) => {
    setQuery(value);
    startTransition(() => {
      router.push(`/patients?search=${encodeURIComponent(value)}`);
    });
  };

  return (
    <Input
      value={query}
      onChange={(e) => handleSearch(e.target.value)}
      placeholder="Search patients..."
      className={isPending ? 'opacity-50' : ''}
    />
  );
}
```

### 3.3 API Route Patterns

#### Route Handler Structure
```typescript
// app/api/patients/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPermission } from '@/lib/auth/permissions';

// Validation schema
const createPatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().datetime(),
  email: z.string().email().optional(),
});

// GET /api/patients
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(user, 'patients', 'read')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') ?? '1');
    const pageSize = parseInt(searchParams.get('pageSize') ?? '20');

    const patients = await db.patient.findMany({
      where: { clinicId: user.clinicId },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { lastName: 'asc' },
    });

    const total = await db.patient.count({
      where: { clinicId: user.clinicId },
    });

    return NextResponse.json({
      success: true,
      data: {
        items: patients,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}

// POST /api/patients
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },
        { status: 401 }
      );
    }

    if (!hasPermission(user, 'patients', 'create')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = createPatientSchema.parse(body);

    const patient = await db.patient.create({
      data: {
        ...validated,
        clinicId: user.clinicId,
        createdBy: user.id,
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'patient',
        entityId: patient.id,
        userId: user.id,
        clinicId: user.clinicId,
        details: { patientName: `${patient.firstName} ${patient.lastName}` },
      },
    });

    return NextResponse.json({ success: true, data: patient }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: error.errors } },
        { status: 400 }
      );
    }
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    );
  }
}
```

### 3.4 Prisma/Database Patterns

#### Schema Conventions
```prisma
// prisma/schema.prisma

// Base fields for all models
model Patient {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId  String   @db.ObjectId

  // Core fields
  firstName String
  lastName  String
  email     String?

  // Timestamps (always include)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime? // Soft delete

  // Audit fields
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  // Indexes
  @@index([clinicId])
  @@index([lastName, firstName])
  @@index([email])
}
```

#### Query Patterns
```typescript
// Always include clinicId in queries
const patients = await db.patient.findMany({
  where: {
    clinicId: user.clinicId,  // REQUIRED: Multi-tenant isolation
    deletedAt: null,           // Exclude soft-deleted records
  },
});

// Use transactions for related operations
const result = await db.$transaction(async (tx) => {
  const patient = await tx.patient.create({ data: patientData });
  await tx.treatment.create({
    data: { ...treatmentData, patientId: patient.id }
  });
  return patient;
});

// Select only needed fields for performance
const patientNames = await db.patient.findMany({
  where: { clinicId: user.clinicId },
  select: {
    id: true,
    firstName: true,
    lastName: true,
  },
});
```

---

## 4. File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **React Components** | PascalCase | `PatientCard.tsx`, `AppointmentForm.tsx` |
| **Utility Functions** | camelCase | `formatDate.ts`, `validateEmail.ts` |
| **API Routes** | kebab-case folders | `api/patient-records/route.ts` |
| **Hooks** | camelCase with `use` prefix | `usePatients.ts`, `useDebounce.ts` |
| **Types/Interfaces** | PascalCase | `Patient.ts`, `ApiResponse.ts` |
| **Constants** | SCREAMING_SNAKE_CASE | `constants.ts` with `MAX_FILE_SIZE` |
| **Test Files** | Same as source + `.test` | `PatientCard.test.tsx` |
| **CSS Modules** | camelCase | `patientCard.module.css` |

---

## 5. Import/Export Patterns

### Import Order
```typescript
// 1. React/Next.js imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { z } from 'zod';
import { format } from 'date-fns';

// 3. Internal aliases (@/)
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { PatientCard } from '@/components/patients/PatientCard';

// 4. Relative imports (same feature)
import { patientSchema } from './schemas';
import type { PatientFormData } from './types';

// 5. Types (always last, with `type` keyword)
import type { Patient, Treatment } from '@/types';
```

### Export Patterns
```typescript
// Named exports for utilities and components
export function formatPatientName(patient: Patient): string {
  return `${patient.lastName}, ${patient.firstName}`;
}

export function PatientCard({ patient }: PatientCardProps) {
  // ...
}

// Default export for page components
export default function PatientsPage() {
  // ...
}

// Re-export from index files for cleaner imports
// components/patients/index.ts
export { PatientCard } from './PatientCard';
export { PatientList } from './PatientList';
export { PatientForm } from './PatientForm';
```

---

## 6. Error Handling Patterns

### API Error Handling
```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Not authenticated') {
    super('UNAUTHORIZED', message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super('FORBIDDEN', message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string) {
    super('NOT_FOUND', `${entity} not found`, 404);
  }
}
```

### Client Error Handling
```typescript
// hooks/useApiMutation.ts
import { useState } from 'react';
import { toast } from '@/components/ui/toast';

export function useApiMutation<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = async (variables: TVariables) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, isLoading, error };
}
```

---

## 7. Logging Conventions

### Log Levels
```typescript
// lib/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  clinicId?: string;
  requestId?: string;
  [key: string]: unknown;
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
  };

  // In development, use console
  // In production, send to logging service
  if (process.env.NODE_ENV === 'development') {
    console[level](JSON.stringify(logEntry, null, 2));
  } else {
    // Send to logging service
    console.log(JSON.stringify(logEntry));
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
};
```

### Logging Best Practices
```typescript
// DO: Log meaningful context
logger.info('Patient created', {
  userId: user.id,
  clinicId: user.clinicId,
  patientId: patient.id,
});

// DO: Log errors with stack traces
logger.error('Failed to create appointment', {
  error: error.message,
  stack: error.stack,
  userId: user.id,
  appointmentData: { patientId, date, providerId },
});

// DON'T: Log sensitive data
// WRONG: logger.info('User logged in', { password: user.password });
// WRONG: logger.info('Payment processed', { creditCard: card.number });
```

---

## 8. Testing Patterns

### Unit Tests
```typescript
// tests/unit/utils/formatDate.test.ts
import { describe, it, expect } from '@jest/globals';
import { formatDate, formatRelativeDate } from '@/lib/utils/formatDate';

describe('formatDate', () => {
  it('formats date in default format', () => {
    const date = new Date('2024-01-15T10:30:00');
    expect(formatDate(date)).toBe('Jan 15, 2024');
  });

  it('handles invalid date', () => {
    expect(formatDate(null)).toBe('N/A');
  });
});
```

### Component Tests
```typescript
// tests/unit/components/PatientCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientCard } from '@/components/patients/PatientCard';

describe('PatientCard', () => {
  const mockPatient = {
    id: '1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  };

  it('renders patient name', () => {
    render(<PatientCard patient={mockPatient} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<PatientCard patient={mockPatient} onSelect={onSelect} />);

    fireEvent.click(screen.getByText('John Doe'));
    expect(onSelect).toHaveBeenCalledWith(mockPatient);
  });
});
```

### Integration Tests
```typescript
// tests/integration/api/patients.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/patients/route';

describe('/api/patients', () => {
  it('returns 401 when not authenticated', async () => {
    const { req } = createMocks({ method: 'GET' });
    const response = await GET(req);

    expect(response.status).toBe(401);
  });

  it('creates patient with valid data', async () => {
    // Setup authenticated request
    const { req } = createMocks({
      method: 'POST',
      body: {
        firstName: 'Jane',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01T00:00:00Z',
      },
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.firstName).toBe('Jane');
  });
});
```

---

## 9. Environment Configuration

### Environment Files
```
.env                 # Default values (committed)
.env.local           # Local overrides (not committed)
.env.development     # Development environment
.env.production      # Production environment
.env.test            # Test environment
```

### Environment Variables
```bash
# .env.example (template for required variables)

# Application
NEXT_PUBLIC_APP_NAME=Orca
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=mongodb://localhost:27017/orca

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# File Storage
FILE_STORAGE_PATH=/var/orca/files
FILE_ENCRYPTION_KEY=your-encryption-key

# AI Services (optional)
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=
```

### Accessing Environment Variables
```typescript
// config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Add all required variables
});

export const env = envSchema.parse(process.env);

// Usage
import { env } from '@/config/env';
const dbUrl = env.DATABASE_URL;
```

---

## 10. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Practice Network                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Client Browsers (Desktop)                  │ │
│  │              Chrome, Edge, Firefox, Safari              │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │ HTTPS                                │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │           On-Premises Application Server                │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │         Next.js Application                       │  │ │
│  │  │  - Server-Side Rendering (SSR)                    │  │ │
│  │  │  - API Routes                                     │  │ │
│  │  │  - Authentication & Authorization                 │  │ │
│  │  │  - Business Logic                                 │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  │                                                          │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │         Prisma ORM                                │  │ │
│  │  │  - Database Abstraction                           │  │ │
│  │  │  - Query Builder                                  │  │ │
│  │  │  - Migrations                                     │  │ │
│  │  └──────────────────┬───────────────────────────────┘  │ │
│  └────────────────────┼───────────────────────────────────┘ │
│                       │                                      │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │           MongoDB Database Server                       │ │
│  │  - Patient Records                                      │ │
│  │  - Treatment Data                                       │ │
│  │  - Financial Records                                    │ │
│  │  - Images & Documents                                   │ │
│  │  - Encrypted at Rest                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │              Network Security Layer                       ││
│  │  - Firewall                                               ││
│  │  - MAC Address Whitelist                                  ││
│  │  - IP Address Whitelist                                   ││
│  │  - VPN (Multi-Location Sync)                              ││
│  └──────────────────┬───────────────────────────────────────┘│
└────────────────────┼────────────────────────────────────────┘
                     │ Outbound Only
                     │ (AI Services)
          ┌──────────▼──────────┐
          │   Internet Cloud    │
          │   - AI/ML APIs      │
          │   - OCR Services    │
          │   - NLP Services    │
          └─────────────────────┘
```

---

## 11. Security Checklist

Before deploying any code, verify:

- [ ] All API routes check authentication
- [ ] All API routes verify permissions
- [ ] All queries include `clinicId` filter
- [ ] All user inputs validated with Zod
- [ ] No sensitive data in logs
- [ ] No hardcoded credentials
- [ ] PHI access is audited
- [ ] File uploads are validated and sanitized
- [ ] SQL/NoSQL injection prevented (use Prisma)
- [ ] XSS prevented (React auto-escaping)
- [ ] CSRF tokens implemented
- [ ] Rate limiting in place

---

**Status**: Active
**Last Updated**: 2024-11-26
**Owner**: Development Team
