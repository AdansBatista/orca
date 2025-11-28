# Clinic ID Enforcement

> **Sub-Area**: [Data Isolation](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

The most critical security control in Orca. Every database query for clinic-scoped data MUST include a clinicId filter to prevent cross-clinic data access. This function defines the enforcement mechanisms and patterns.

---

## Core Requirements

- [ ] Define list of clinic-scoped models
- [ ] Validate clinicId presence on all queries
- [ ] Automatically inject clinicId via Prisma middleware
- [ ] Throw error if clinicId missing (defense in depth)
- [ ] Log violations as security events
- [ ] Provide code review checklist

---

## API Endpoints

No dedicated endpoints - enforcement is automatic via middleware.

---

## Data Model

All clinic-scoped models include:

```prisma
model [AnyClinicScopedModel] {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId  String   @db.ObjectId  // REQUIRED

  // ... other fields

  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])  // REQUIRED for performance
}
```

### Clinic-Scoped Models List

```typescript
const CLINIC_SCOPED_MODELS = [
  'Patient',
  'Appointment',
  'Treatment',
  'TreatmentPlan',
  'Invoice',
  'Payment',
  'LabOrder',
  'Image',
  'Communication',
  'Lead',
  'Staff',
  'Equipment',
  'InventoryItem',
  'Room',
  'Message',
  // Add all models that belong to a specific clinic
];
```

---

## Business Rules

### The Golden Rule

```typescript
// ❌ NEVER do this - security vulnerability
const patients = await db.patient.findMany({});

// ✅ ALWAYS do this
const patients = await db.patient.findMany({
  where: { clinicId: session.user.clinicId },
});
```

### Enforcement Layers

1. **Prisma Middleware** - Auto-injects clinicId (primary defense)
2. **Code Pattern** - Developers always include clinicId (defense in depth)
3. **Code Review** - Checklist item for all PRs
4. **Static Analysis** - ESLint rule to flag missing clinicId (future)

### Exceptions

| Model | Scoping | Reason |
|-------|---------|--------|
| User | Multi-clinic via clinicIds[] | Users can belong to multiple clinics |
| Role | Global | System-wide role definitions |
| Permission | Global | System-wide permissions |
| Clinic | Self | Clinic is the scope itself |
| AuditLog | Clinic or null | Some events are cross-clinic |

---

## Dependencies

**Depends On:**
- Session Management (provides clinicId)

**Required By:**
- All data access operations
- Query Patterns function

---

## Notes

- This is a HIPAA requirement - cross-clinic access is a violation
- Middleware provides safety net but explicit clinicId is still required
- Log all enforcement failures as CRITICAL security events
