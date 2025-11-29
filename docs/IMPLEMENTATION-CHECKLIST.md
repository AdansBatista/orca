# Implementation Checklist

> Quick verification checklist after implementing any feature or area

---

## After Every Implementation

### 1. Data Security
- [ ] All database queries include `clinicId` filter
- [ ] `withAuth` wrapper used on all API routes
- [ ] Permissions checked before operations
- [ ] No PHI logged anywhere
- [ ] Soft deletes used (`deletedAt` field)

### 2. PHI Protection
- [ ] All PHI wrapped with `<PhiProtected>` component
- [ ] `fakeData` prop provided with appropriate generator
- [ ] Input fields use `<PhiProtectedInput>` where needed

### 3. UI Components
- [ ] Used existing components from `src/components/ui/`
- [ ] Used layout components from `src/components/layout/`
- [ ] No raw Tailwind for components that exist (Card, Button, Badge, etc.)
- [ ] Semantic color tokens used (not raw colors like `text-gray-500`)

### 4. Database Seeding
- [ ] Factory created in `prisma/seed/factories/`
- [ ] Fixtures added for reference data
- [ ] Area seed file updated
- [ ] Area registry updated with dependencies
- [ ] Tested with `npm run db:seed -- --area {area}`

### 5. Code Quality
- [ ] TypeScript interfaces for all props
- [ ] Zod schemas for API input validation
- [ ] No TypeScript errors
- [ ] Import order follows convention
- [ ] File naming follows conventions

### 6. Documentation
- [ ] MASTER-INDEX.md status updated
- [ ] Area README updated if needed

---

## Quick Reference

### PHI Fields (Must Protect)
```
Patient names, Email, Phone, Address, SSN, DOB,
Medical record numbers, Treatment notes, Insurance info,
Emergency contacts
```

### Required Query Pattern
```typescript
where: { clinicId: session.user.clinicId }
```

### Response Formats
```typescript
// Success
{ success: true, data: {...} }

// Error
{ success: false, error: { code: 'CODE', message: '...' } }

// Paginated
{ success: true, data: { items: [], total, page, pageSize, totalPages } }
```

### Audit Logging
```typescript
await logAudit(session, {
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
  entity: 'ModelName',
  entityId: record.id,
  details: { /* changed fields */ },
});
```

---

## Component Quick Check

| Need | Use | Not |
|------|-----|-----|
| Container | `<Card variant="...">` | Raw div |
| Button | `<Button variant="...">` | Raw button |
| Input | `<Input>` + `<FormField>` | Raw input |
| Status | `<Badge variant="...">` | Raw span |
| List item | `<ListItem>` | Raw div |
| Grid | `<DashboardGrid>` | Raw grid |

---

## Seeding Commands

```bash
npm run db:seed                  # Standard
npm run db:seed:minimal          # Fast reset
npm run db:seed -- --area {id}   # Specific area
npm run db:list                  # Show areas
```

---

**Tip**: Keep this open while implementing. Check off items as you go.
