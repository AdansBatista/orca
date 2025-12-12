# Known Issues & Lessons Learned

> Solutions to common issues encountered during Orca development. Check here before debugging.

---

## Next.js 15 Compatibility

### Dynamic Route Parameters are Async

**Problem:** Next.js 15 changed route params to be async (`Promise<T>`).

**Error:**
```
Type '{ params: { id: string } }' does not satisfy the constraint 'ParamCheck<RouteContext>'
```

**Solution:** The `withAuth` wrapper supports typed params via generics:

```typescript
// ✅ CORRECT - Use typed withAuth for dynamic routes
export const GET = withAuth<{ id: string }>(
  async (req, session, context) => {
    const { id } = await context.params;  // Must await params
    // ...
  },
  { permissions: ['resource:view'] }
);

// ✅ CORRECT - No generic needed for routes without params
export const GET = withAuth(
  async (req, session) => {
    // ...
  },
  { permissions: ['resource:view'] }
);
```

### useSearchParams Requires Suspense Boundary

**Problem:** `useSearchParams()` causes prerender errors in Next.js 15 without Suspense. This happens because `useSearchParams()` opts the page out of static generation and requires client-side rendering.

**Error:**
```
useSearchParams() should be wrapped in a suspense boundary at page "/lab/orders/new"
Error occurred prerendering page "/lab/orders/new". Read more: https://nextjs.org/docs/messages/prerender-error
```

**Solution:** Extract the component using `useSearchParams` into a separate component and wrap it in a Suspense boundary:

```typescript
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Step 1: Extract the component that uses useSearchParams
function PageContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId');

  // ... rest of component logic using searchParams
  return (
    <div>
      {/* Your page content */}
    </div>
  );
}

// Step 2: Create a loading fallback component
function PageLoading() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// Step 3: Export main component wrapped in Suspense
export default function MyPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PageContent />
    </Suspense>
  );
}
```

**Why This Happens:**
- Next.js 15 App Router tries to statically generate pages at build time
- `useSearchParams()` reads URL query parameters which are only available at runtime
- Without Suspense, Next.js cannot determine what to render during static generation
- The Suspense boundary provides a fallback during the hydration phase

**IMPORTANT:** This pattern is REQUIRED for ANY page that uses:
- `useSearchParams()`
- `usePathname()` when reading dynamic segments
- Any hook that depends on client-side URL state

**Quick Fix Checklist:**
1. [ ] Add `'use client'` directive at top of file (if not already present)
2. [ ] Import `Suspense` from 'react'
3. [ ] Rename your existing component (e.g., `MyPage` → `MyPageContent`)
4. [ ] Create a simple loading fallback component
5. [ ] Create new default export that wraps content in `<Suspense>`

---

## Auth.js (NextAuth v5) Issues

### UntrustedHost Error in Production Build

**Problem:** Auth.js rejects requests when running `npm start` (production build) on localhost.

**Error:**
```
[auth][error] UntrustedHost: Host must be trusted. URL was: http://localhost:3000/api/auth/session
```

**Solution:** Add `trustHost: true` to auth config:

```typescript
// src/lib/auth/config.ts
export const authConfig: NextAuthConfig = {
  // ... other config
  trustHost: true,  // Required for local production builds
};
```

**Note:** In actual production, use `AUTH_TRUST_HOST` environment variable instead.

---

## Zod 4 Breaking Changes

### error.errors → error.issues

**Problem:** Zod 4 renamed the errors array property.

**Error:**
```
Property 'errors' does not exist on type 'ZodError'
```

**Solution:** Use `error.issues` instead:

```typescript
// ❌ WRONG (Zod 3)
const messages = result.error.errors.map((e) => e.message);

// ✅ CORRECT (Zod 4)
const messages = result.error.issues.map((e) => e.message);
```

### zodResolver Type Incompatibility with react-hook-form

**Problem:** Zod 4 types don't fully align with react-hook-form's Resolver type.

**Error:**
```
Type 'ZodType<...>' is not assignable to type 'Resolver<...>'
```

**Solution:** Cast the resolver (temporary workaround until libraries align):

```typescript
import { zodResolver } from '@hookform/resolvers/zod';

const { register, handleSubmit } = useForm<MyFormInput>({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolver: zodResolver(mySchema) as any,
});
```

---

## Prisma Issues

### InputJsonValue Type Errors

**Problem:** TypeScript doesn't accept `Record<string, unknown>` for JSON fields.

**Error:**
```
Type 'Record<string, unknown>' is not assignable to type 'InputJsonValue'
```

**Solution:** Cast to `Prisma.InputJsonValue`:

```typescript
import { Prisma } from '@prisma/client';

await db.auditLog.create({
  data: {
    // ...
    details: (input.details ?? null) as Prisma.InputJsonValue | null,
  },
});
```

### Optional vs Required Field Mismatch

**Problem:** Validation schema and Prisma schema disagree on required fields.

**Solution:** Ensure both are aligned:
- If field is optional in validation, make it `Type?` in Prisma
- If field is required in Prisma, make it `.min(1)` or required in Zod

---

## MongoDB/Prisma Soft Delete

### Querying for null Values in MongoDB

**Problem:** MongoDB handles `null` queries differently than expected. When querying `{ deletedAt: null }`, it may return 0 results even when documents have `deletedAt` explicitly set to `null`.

**Symptom:** Queries with `deletedAt: null` return empty results, but removing the filter returns all expected records.

**Root Cause:** MongoDB's null query semantics differ - `{ field: null }` doesn't always match documents where the field is explicitly `null`.

**Solution:** Use `OR` with `isSet: false` for reliable null checks in MongoDB:

```typescript
// ✅ CORRECT - MongoDB-compatible null check
const activeItems = await db.patient.findMany({
  where: {
    clinicId,
    OR: [
      { deletedAt: { isSet: false } },  // Field doesn't exist
      { deletedAt: null },              // Field is explicitly null
    ],
  },
});

// ❌ WRONG - May return 0 results in MongoDB
const activeItems = await db.patient.findMany({
  where: {
    clinicId,
    deletedAt: null,  // This often fails!
  },
});
```

**Complex Query Example (with other OR conditions):**

```typescript
// When combining with other OR conditions, use AND
const conflicts = await db.appointment.findFirst({
  where: {
    providerId,
    status: { notIn: ['CANCELLED', 'NO_SHOW'] },
    AND: [
      { OR: [{ deletedAt: { isSet: false } }, { deletedAt: null }] },
      {
        OR: [
          { startTime: { lte: start }, endTime: { gt: start } },
          { startTime: { lt: end }, endTime: { gte: end } },
        ],
      },
    ],
  },
});
```

### Creating Records - Explicitly Set deletedAt

**Problem:** When seeding data, omitting `deletedAt` may cause issues with subsequent queries.

**Solution:** Always explicitly set `deletedAt: null` when creating records:

```typescript
// ✅ CORRECT - Explicitly set deletedAt
await db.equipment.create({
  data: {
    name: 'Equipment',
    // ... other fields
    deletedAt: null, // Explicit for clarity
  },
});
```

---

## Seed Infrastructure

### IdTracker Interface Missing Methods

**Problem:** Implementation has methods not declared in interface.

**Solution:** Keep `prisma/seed/types.ts` IdTracker interface in sync with `prisma/seed/utils/id-tracker.ts` implementation.

---

## Development Workflow

### Always Run Build Before Commit

Many type errors only surface during `npm run build`, not in dev mode. Always verify:

```bash
npm run build
```

### Check for Pre-existing Issues

When implementing new features, the build may reveal pre-existing issues in other files. Fix these as encountered but document them.

---

## Radix UI / shadcn Issues

### Select.Item Cannot Have Empty String Value

**Problem:** Radix UI's `Select.Item` component throws an error when `value=""` is used. This commonly happens when creating "All" options in filter dropdowns.

**Error:**
```
A <Select.Item /> must have a value prop that is not an empty string. This is because the Select value can be set to an empty string to clear the selection and show the placeholder.
```

**Solution:** Use a non-empty placeholder value like `'__all__'` for "all" options, and convert it back when building API queries:

```typescript
// ✅ CORRECT - Use '__all__' instead of empty string
const categoryOptions = [
  { value: '__all__', label: 'All Categories' },  // Not ''
  { value: 'BRACKETS', label: 'Brackets' },
  { value: 'WIRES', label: 'Wires' },
];

// State initialization
const [category, setCategory] = useState('__all__');  // Not ''

// When building API queries, convert '__all__' to empty (skip the filter)
const params = new URLSearchParams();
if (category && category !== '__all__') {
  params.set('category', category);
}

// ❌ WRONG - Empty string causes runtime error
const categoryOptions = [
  { value: '', label: 'All Categories' },  // This will throw!
  { value: 'BRACKETS', label: 'Brackets' },
];
```

**Pattern Summary:**
1. Use `'__all__'` (or similar like `'all'`) as the value for "All" options
2. Initialize state with `'__all__'` instead of empty string
3. When building API params/URLs, check `value !== '__all__'` before adding to params
4. Add a comment explaining this pattern for future developers

---

## Next.js Build Issues

### Html Import Error in Production Build

**Problem:** Production build (`npm run build`) fails with "<Html> should not be imported outside of pages/_document" error.

**Error:**
```
Error: <Html> should not be imported outside of pages/_document.
Read more: https://nextjs.org/docs/messages/no-document-import-in-page
    at x (c:\dev\orca\.next\server\chunks\8548.js:6:1351)
Error occurred prerendering page "/404"
```

**Status:** Under investigation. Dev server (`npm run dev`) works correctly.

**Workaround:** Use `npm run dev` for development. This issue affects production builds only.

**Possible Causes:**
1. Conflict between next-themes and Next.js 15 App Router
2. Bundle optimization issues with theme provider
3. Pages/App Router hybrid configuration issues

---

## Quick Checklist for New Features

Before committing, verify:

1. [ ] `npx tsc --noEmit` passes without errors
2. [ ] `npm run build` passes without errors (catches issues dev mode misses)
3. [ ] All API routes use `withAuth` with typed params if dynamic
4. [ ] Forms using Zod + react-hook-form have resolver cast
5. [ ] **Any `useSearchParams` usage is wrapped in Suspense** (common build failure!)
6. [ ] Prisma JSON fields are properly cast
7. [ ] Zod error handling uses `.issues` not `.errors`
8. [ ] Select.Item values are never empty strings (use `'__all__'` for "All" options)
9. [ ] MongoDB null queries use `OR: [{ field: { isSet: false } }, { field: null }]`

---

**Last Updated:** 2025-12-12
