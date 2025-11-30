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

**Problem:** `useSearchParams()` causes prerender errors in Next.js 15 without Suspense.

**Error:**
```
useSearchParams() should be wrapped in a suspense boundary at page "/login"
```

**Solution:** Extract component using `useSearchParams` and wrap in Suspense:

```typescript
// ✅ CORRECT
function LoginForm() {
  const searchParams = useSearchParams();
  // ... form logic
}

function LoginFormFallback() {
  return <Loader2 className="animate-spin" />;
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginForm />
    </Suspense>
  );
}
```

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

## Quick Checklist for New Features

Before committing, verify:

1. [ ] `npm run build` passes without errors
2. [ ] All API routes use `withAuth` with typed params if dynamic
3. [ ] Forms using Zod + react-hook-form have resolver cast
4. [ ] Any `useSearchParams` usage is wrapped in Suspense
5. [ ] Prisma JSON fields are properly cast
6. [ ] Zod error handling uses `.issues` not `.errors`

---

**Last Updated:** 2024-11-29
