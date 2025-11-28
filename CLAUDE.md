# Orca - Claude Code Instructions

> **Project**: Orca - Orthodontic Practice Management System
>
> **Type**: Healthcare/Medical Software (HIPAA/PIPEDA Compliant)

---

## Quick Orientation

**Orca** is an orthodontic practice management system with **13 functional areas** across **5 implementation phases**. All areas are currently in **Planning phase** - documentation is complete, code implementation has not started.

### LLM Task Routing

| Task Type | Read First | Then Check |
|-----------|------------|------------|
| **Implement Feature** | Area README → Sub-Area README | TECH-STACK.md, AUTH-PATTERNS.md |
| **Add UI Component** | STYLING-GUIDE.md | Area's UI Components section |
| **Add API Endpoint** | AUTH-PATTERNS.md | TECH-STACK.md |
| **Database Changes** | TECH-STACK.md | Area's Data Models section |
| **Understand System** | MASTER-INDEX.md | Specific area README |
| **Auth/Permissions** | [Auth Area](docs/areas/auth/) | AUTH-PATTERNS.md |

### If You're Stuck

| Problem | Solution |
|---------|----------|
| Don't know where to start | Read [docs/CURRENT-FOCUS.md](docs/CURRENT-FOCUS.md) |
| Can't find patterns | Check [docs/QUICK-REFERENCE.md](docs/QUICK-REFERENCE.md) |
| Confused about permissions | Read [docs/areas/auth/](docs/areas/auth/) |
| Need auth code patterns | Read [docs/guides/AUTH-PATTERNS.md](docs/guides/AUTH-PATTERNS.md) |
| Need domain context | Check area README's orthodontic-specific sections |
| Understanding documentation structure | Read [docs/DOCUMENTATION-STANDARDS.md](docs/DOCUMENTATION-STANDARDS.md) |

### Documentation Pyramid

```
CLAUDE.md (You are here - entry point)
    ↓
docs/MASTER-INDEX.md (Project status & area index)
    ↓
docs/guides/ (Technical standards - ALWAYS consult)
├── TECH-STACK.md       → All code patterns
├── STYLING-GUIDE.md    → All UI work
├── AUTH-PATTERNS.md    → Auth code patterns
└── AI-INTEGRATION.md   → AI features
    ↓
docs/areas/{area}/README.md (Feature specifications)
    ↓
docs/areas/{area}/sub-areas/{sub-area}/README.md (Detailed specs)
    ↓
docs/areas/{area}/sub-areas/{sub-area}/functions/{function}.md (Implementation details)
```

---

## Project Overview

Orca is a modern comprehensive, secure, AI-powered practice management system for orthodontic clinics. It features on-premises deployment with minimal internet exposure, multi-clinic support, and full regulatory compliance.

**Read the Master Index for full context:** [docs/MASTER-INDEX.md](docs/MASTER-INDEX.md)

---

## Before Any Task

### 1. Check Project Status
Read [docs/MASTER-INDEX.md](docs/MASTER-INDEX.md) to understand:
- Current implementation phase
- What areas are ready for development
- Dependencies between features

### 2. Consult Technical Standards
Before writing ANY code, review the relevant guide:

| Guide | When to Consult |
|-------|-----------------|
| [TECH-STACK.md](docs/guides/TECH-STACK.md) | All code - patterns, conventions, structure |
| [STYLING-GUIDE.md](docs/guides/STYLING-GUIDE.md) | All UI - components, colors, spacing |
| [Auth Area](docs/areas/auth/) | Auth architecture, roles, permissions |
| [AUTH-PATTERNS.md](docs/guides/AUTH-PATTERNS.md) | Auth code patterns (withAuth, PermissionGate) |
| [AI-INTEGRATION.md](docs/guides/AI-INTEGRATION.md) | AI features |

### 3. Check Existing Patterns
Before implementing something new, search for existing patterns in the codebase that do similar things.

---

## Technical Standards Summary

### Technology Stack
- **Frontend**: Next.js 15+, React 19+, TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma, NextAuth.js
- **Database**: MongoDB
- **Testing**: Jest, Playwright

### File Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `PatientCard.tsx` |
| Utilities | camelCase | `formatDate.ts` |
| API Routes | kebab-case | `api/patient-records/route.ts` |
| Hooks | camelCase + use | `usePatients.ts` |

### Key Patterns

#### API Routes
```typescript
// Always use withAuth wrapper
export const GET = withAuth(
  async (req, session) => {
    // Always filter by clinicId
    const data = await db.model.findMany({
      where: { clinicId: session.user.clinicId },
    });
    return NextResponse.json({ success: true, data });
  },
  { permissions: ['resource:read'] }
);
```

#### Components
```typescript
// Use TypeScript interfaces for props
interface Props {
  patient: Patient;
  onSelect?: (patient: Patient) => void;
}

export function PatientCard({ patient, onSelect }: Props) {
  // Component implementation
}
```

---

## Critical Rules

### 1. Multi-Clinic Data Isolation
**EVERY database query MUST include `clinicId` filter.**

```typescript
// CORRECT
const patients = await db.patient.findMany({
  where: { clinicId: session.user.clinicId }, // REQUIRED
});

// WRONG - Security vulnerability!
const patients = await db.patient.findMany({});
```

### 2. Authentication & Authorization
- All API routes must check authentication
- All routes must verify permissions before operations
- Use `withAuth` wrapper (see AUTH-GUIDE.md)

### 3. HIPAA/PIPEDA Compliance
- Never log PHI (Protected Health Information)
- Audit log all PHI access
- Use soft deletes for patient data
- Encrypt sensitive data at rest

### 4. Follow the Guides
- Code patterns: [TECH-STACK.md](docs/guides/TECH-STACK.md)
- UI/UX standards: [STYLING-GUIDE.md](docs/guides/STYLING-GUIDE.md)
- Auth patterns: [AUTH-PATTERNS.md](docs/guides/AUTH-PATTERNS.md)

### 5. Update Documentation
After completing features, update:
- Status in [MASTER-INDEX.md](docs/MASTER-INDEX.md)
- Feature documentation in `docs/areas/`

---

## Documentation Structure

```
docs/
├── MASTER-INDEX.md          # Project overview & status
├── CURRENT-FOCUS.md         # What to work on now
├── QUICK-REFERENCE.md       # Pattern cheat sheet
├── DOCUMENTATION-STANDARDS.md # Documentation conventions
├── guides/                  # Technical foundation documents
│   ├── TECH-STACK.md       # Technology & coding standards
│   ├── STYLING-GUIDE.md    # Design system & UI patterns
│   ├── AUTH-PATTERNS.md    # Auth code patterns
│   └── AI-INTEGRATION.md   # AI capabilities
├── templates/               # Document templates
└── areas/                   # Feature documentation by area
    └── {area-name}/
        ├── README.md        # Area overview & specifications
        └── sub-areas/
            └── {sub-area}/
                ├── README.md    # Sub-area details
                └── functions/   # Function-level specs
```

---

## User Roles

| Role | Description |
|------|-------------|
| `super_admin` | Full system access, all clinics |
| `clinic_admin` | Full access within assigned clinic(s) |
| `doctor` | Clinical access, treatment authority |
| `clinical_staff` | Patient care, limited clinical |
| `front_desk` | Scheduling, communications |
| `billing` | Financial operations |
| `read_only` | View-only access |

See [Auth Area](docs/areas/auth/) for full permission matrix.

---

## Common Tasks

### Creating a New Feature
1. Check [MASTER-INDEX.md](docs/MASTER-INDEX.md) for dependencies
2. Review existing patterns in similar features
3. Follow [function-template.md](docs/templates/function-template.md) for documentation
4. Implement following [TECH-STACK.md](docs/guides/TECH-STACK.md) patterns
5. Update MASTER-INDEX.md status when complete

### Adding UI Components
1. Check [STYLING-GUIDE.md](docs/guides/STYLING-GUIDE.md) for design tokens
2. Use shadcn/ui components where possible
3. Follow component patterns in the guide
4. Ensure accessibility compliance

### Adding API Endpoints
1. Use `withAuth` wrapper
2. Validate input with Zod schemas
3. Always include `clinicId` filter
4. Log audit events for PHI access
5. Return consistent response format

### Database Changes
1. Update Prisma schema
2. Include `clinicId` field on clinic-scoped models
3. Add soft delete support (`deletedAt`)
4. Add audit fields (`createdBy`, `updatedBy`)
5. Create appropriate indexes

---

## What NOT to Do

- ❌ Query database without `clinicId` filter
- ❌ Skip authentication/authorization checks
- ❌ Log PHI or sensitive data
- ❌ Hardcode credentials or secrets
- ❌ Use inline styles instead of Tailwind
- ❌ Create new components without checking shadcn/ui first
- ❌ Ignore TypeScript errors
- ❌ Skip input validation
- ❌ Create files without following naming conventions

---

## Quick Reference

### Import Order
```typescript
// 1. React/Next.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party
import { z } from 'zod';

// 3. Internal (@/)
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';

// 4. Relative
import { schema } from './schemas';

// 5. Types
import type { Patient } from '@/types';
```

### Response Format
```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: { code: 'ERROR_CODE', message: 'Human readable' } }

// Paginated
{ success: true, data: { items: [], total, page, pageSize, totalPages } }
```

### Audit Logging
```typescript
await logAudit(session, {
  action: 'UPDATE',
  entity: 'Patient',
  entityId: patient.id,
  details: { field: 'email' },
});
```

---

## Getting Help

- **Project Documentation**: `docs/` folder
- **Technical Standards**: `docs/guides/`
- **Feature Specs**: `docs/areas/{area}/`
- **Templates**: `docs/templates/`

---

**Last Updated**: 2024-11-26
