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
| **Add UI/Page** | `src/components/ui/` → `src/components/layout/` | `/ui-showcase`, STYLING-GUIDE.md |
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
| **Continue documentation work** | Read [docs/DOCUMENTATION-PROGRESS.md](docs/DOCUMENTATION-PROGRESS.md) |
| **After implementing a feature** | Run through [docs/IMPLEMENTATION-CHECKLIST.md](docs/IMPLEMENTATION-CHECKLIST.md) |
| **Build/type errors or compatibility issues** | Check [docs/guides/KNOWN-ISSUES.md](docs/guides/KNOWN-ISSUES.md) |

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
├── AI-INTEGRATION.md   → AI features
└── KNOWN-ISSUES.md     → Compatibility fixes & lessons learned
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

### 4. PHI Display Protection (MANDATORY)
**ALL rendered PHI data MUST be wrapped with `<PhiProtected>`.**

```typescript
import { PhiProtected } from '@/components/ui/phi-protected';
import { getFakeName, getFakeEmail, getFakePhone } from '@/lib/fake-data';

// ✅ CORRECT - Always wrap PHI with PhiProtected
<PhiProtected fakeData={getFakeName()}>{patient.name}</PhiProtected>
<PhiProtected fakeData={getFakeEmail()}>{patient.email}</PhiProtected>
<PhiProtected fakeData={getFakePhone()}>{patient.phone}</PhiProtected>

// ❌ WRONG - Never render PHI directly
<span>{patient.name}</span>
<p>{patient.email}</p>
```

**PHI fields that MUST be protected:**
- Patient names (first, last, full)
- Email addresses
- Phone numbers
- Physical addresses
- SSN/ID numbers
- Dates of birth
- Medical record numbers
- Treatment notes and details
- Insurance information
- Emergency contact information

**Best practices:**
- Always provide `fakeData` prop with appropriate fake data generator
- Use `getFakeData(type)` or specific generators (`getFakeName()`, `getFakeEmail()`, etc.)
- For input fields, use `<PhiProtectedInput>` component

See [PHI-FOG-USAGE.md](docs/guides/PHI-FOG-USAGE.md) for complete documentation.

### 5. Follow the Guides
- Code patterns: [TECH-STACK.md](docs/guides/TECH-STACK.md)
- UI/UX standards: [STYLING-GUIDE.md](docs/guides/STYLING-GUIDE.md)
- Auth patterns: [AUTH-PATTERNS.md](docs/guides/AUTH-PATTERNS.md)

### 6. Update Documentation
After completing features, update:
- Status in [MASTER-INDEX.md](docs/MASTER-INDEX.md)
- Feature documentation in `docs/areas/`

### 7. Database Seeding (MANDATORY)
**When creating or modifying Prisma models, ALWAYS create seed data.**

```typescript
// After adding a new model to schema.prisma:
// 1. Create/update factory in prisma/seed/factories/{model}.factory.ts
// 2. Add fixtures for reference data in prisma/seed/fixtures/
// 3. Register in area seed file (prisma/seed/areas/{area}.seed.ts)
// 4. Update area registry if adding new dependencies
```

**Commands:**
```bash
npm run db:seed                    # Seed with standard profile
npm run db:seed -- --profile minimal  # Quick dev reset
npm run db:seed -- --area auth:users  # Seed specific area
npm run db:dump -- --name "checkpoint" # Export to snapshot
npm run db:reset                   # Drop + seed fresh
```

See [SEEDING-GUIDE.md](docs/guides/SEEDING-GUIDE.md) for detailed patterns.

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
1. **FIRST: Check `src/components/ui/`** for existing components with variants
2. **SECOND: Check `src/components/layout/`** for layout patterns (grids, master-detail, etc.)
3. **Reference `/ui-showcase`** to see all available components and their variants
4. Check [STYLING-GUIDE.md](docs/guides/STYLING-GUIDE.md) for design tokens
5. Use component variants (e.g., `<Card variant="ghost">`) NOT raw Tailwind classes
6. Ensure accessibility compliance

**NEVER create raw divs with Tailwind when a component exists!**

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

## CRITICAL: UI Component Standards

### ⚠️ MANDATORY: Always Use Predefined Components

**BEFORE writing ANY UI code**, you MUST:

1. **Check `src/components/ui/`** for existing components
2. **Use component variants** instead of raw Tailwind classes
3. **Reference the UI Showcase** at `/ui-showcase` to see available patterns

### Available UI Components (ALWAYS USE THESE)

| Need | Use Component | NOT Raw Classes |
|------|---------------|-----------------|
| **Container/Box** | `<Card variant="...">` | ❌ `<div className="rounded-2xl bg-...">` |
| **Button** | `<Button variant="..." size="...">` | ❌ `<button className="...">` |
| **Text Input** | `<Input>` with `<FormField>` | ❌ `<input className="...">` |
| **Select** | `<Select>` components | ❌ `<select className="...">` |
| **Status Indicator** | `<Badge variant="...">` | ❌ `<span className="rounded-full...">` |
| **Form Layout** | `<FormField label="..." error="...">` | ❌ `<div><label>...<input>` |
| **Feedback Message** | `<Alert variant="...">` | ❌ `<div className="bg-red-100...">` |
| **Modal** | `<Dialog>` | ❌ Custom modal div |
| **Side Panel** | `<Sheet>` | ❌ Custom slide-out div |
| **Stats Display** | `<StatCard accentColor="...">` | ❌ `<div className="border-l-4...">` |
| **Table** | `<Table>` components | ❌ `<table className="...">` |
| **Layout Grid** | `<DashboardGrid>`, `<CardGrid>` | ❌ `<div className="grid grid-cols...">` |
| **List Item** | `<ListItem>`, `<ListActivity>` | ❌ `<div className="flex items-center gap-3 p-3 rounded-xl...">` |

### Card Variants (USE THESE!)

```tsx
// ✅ CORRECT - Use Card with variant
<Card variant="ghost">
  <CardContent>Demo info here</CardContent>
</Card>

<Card variant="bento" interactive>
  <CardHeader compact>
    <CardTitle size="sm">Title</CardTitle>
  </CardHeader>
  <CardContent compact>Content</CardContent>
</Card>

// ❌ WRONG - Raw Tailwind classes
<div className="rounded-2xl bg-muted/50 border border-border/50 p-4">
  <p>Demo info here</p>
</div>
```

**Available Card Variants:**
- `default` - Standard card with border and shadow
- `elevated` - More shadow emphasis
- `glass` - Frosted glass effect
- `gradient` - Subtle gradient background
- `ghost` - Minimal styling (info boxes, subtle containers)
- `bento` - Bento-style layout cards
- `compact` - Smaller rounded corners

### Button Variants

```tsx
// ✅ CORRECT
<Button variant="default">Primary Action</Button>
<Button variant="accent">Accent Action</Button>
<Button variant="soft">Subtle Action</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Dangerous</Button>

// ❌ WRONG - Custom button styling
<button className="bg-primary-600 hover:bg-primary-700 rounded-full px-4 py-2">
```

### Badge Variants

```tsx
// ✅ CORRECT
<Badge variant="success" dot>Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="info">New</Badge>
<Badge variant="soft-primary">Category</Badge>

// ❌ WRONG
<span className="rounded-full bg-green-100 text-green-800 px-2 py-1 text-xs">
```

### Form Fields

```tsx
// ✅ CORRECT - Use FormField wrapper
<FormField label="Email" required error={errors.email}>
  <Input type="email" placeholder="you@example.com" />
</FormField>

// ❌ WRONG - Manual label/input/error assembly
<div className="space-y-2">
  <label className="text-sm font-medium">Email *</label>
  <input className="rounded-md border p-2 w-full" />
  <p className="text-sm text-red-500">{error}</p>
</div>
```

### List Items

```tsx
// ✅ CORRECT - Use ListItem for interactive list items
import { ListItem, ListItemTitle, ListItemDescription, ListActivity } from '@/components/ui/list-item';

<ListItem
  showArrow
  leading={<Avatar>...</Avatar>}
  trailing={<Badge variant="success">Active</Badge>}
>
  <ListItemTitle>John Doe</ListItemTitle>
  <ListItemDescription>Next appointment: Feb 15</ListItemDescription>
</ListItem>

// For activity/notification lists with color indicators
<ListActivity indicatorColor="success">
  <p className="text-sm">Payment received</p>
  <p className="text-xs text-muted-foreground">5 min ago</p>
</ListActivity>

// ❌ WRONG - Manual list item styling
<div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 cursor-pointer">
```

**ListItem Variants:** `default`, `ghost`, `bordered`, `elevated`
**ListItem Sizes:** `sm`, `default`, `lg`

### Layout Components

```tsx
// ✅ CORRECT - Use layout components from @/components/layout
import { DashboardGrid, StatsRow, CardGrid, MasterDetail, DataTableLayout } from '@/components/layout';

<StatsRow>
  <StatCard accentColor="primary">...</StatCard>
  <StatCard accentColor="accent">...</StatCard>
</StatsRow>

<DashboardGrid>
  <DashboardGrid.TwoThirds>Main content</DashboardGrid.TwoThirds>
  <DashboardGrid.OneThird>Sidebar</DashboardGrid.OneThird>
</DashboardGrid>

// ❌ WRONG - Manual grid classes everywhere
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
```

### Pre-Implementation Checklist

Before writing UI code, answer these questions:

1. ✅ Did I check `src/components/ui/` for existing components?
2. ✅ Did I check `src/components/layout/` for layout patterns?
3. ✅ Am I using component props/variants instead of custom Tailwind?
4. ✅ Did I reference `/ui-showcase` for the correct pattern?
5. ✅ Am I using semantic tokens (`text-muted-foreground`) not raw colors (`text-gray-500`)?

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
- ❌ **Use raw Tailwind classes when a UI component exists**
- ❌ **Create card-like containers without using `<Card>` component**
- ❌ **Build custom buttons instead of using `<Button>` variants**
- ❌ **Assemble form fields manually instead of using `<FormField>`**
- ❌ **Create list items with raw divs instead of using `<ListItem>` or `<ListActivity>`**
- ❌ **Render PHI data without wrapping in `<PhiProtected>` component**

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
