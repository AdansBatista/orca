# Query Patterns

> **Sub-Area**: [Data Isolation](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Defines safe query patterns for single-clinic, multi-clinic, and cross-clinic data access. Provides copy-paste templates for common operations ensuring clinicId is always properly handled.

---

## Core Requirements

- [ ] Provide single-clinic query pattern
- [ ] Provide multi-clinic query pattern (with permission check)
- [ ] Provide cross-clinic pattern (super admin only)
- [ ] Provide create/update/delete patterns with clinicId
- [ ] Document unsafe patterns to avoid

---

## API Endpoints

No dedicated endpoints - patterns are for internal use.

---

## Data Model

N/A - patterns use existing models.

---

## Business Rules

### Pattern 1: Single Clinic Query (Most Common)

```typescript
// Used by: All standard operations
async function getPatients(session: Session) {
  return db.patient.findMany({
    where: {
      clinicId: session.user.clinicId, // Always from session
      deletedAt: null,
    },
    orderBy: { lastName: 'asc' },
  });
}

async function getPatientById(session: Session, patientId: string) {
  return db.patient.findFirst({
    where: {
      id: patientId,
      clinicId: session.user.clinicId, // Prevents cross-clinic access
      deletedAt: null,
    },
  });
}
```

### Pattern 2: Multi-Clinic Query (Admins)

```typescript
// Used by: Clinic admins with multiple clinics
async function getPatientsAcrossClinics(session: Session, clinicIds?: string[]) {
  // Permission check
  if (!session.user.permissions.includes('multi_clinic:view_all')) {
    throw new ForbiddenError('Multi-clinic access not permitted');
  }

  // Use provided clinicIds or user's assigned clinics
  const targetClinics = clinicIds ?? session.user.clinicIds;

  // Validate user has access to all requested clinics
  const unauthorized = targetClinics.filter(id => !session.user.clinicIds.includes(id));
  if (unauthorized.length > 0) {
    throw new ForbiddenError('Access denied to some clinics');
  }

  return db.patient.findMany({
    where: {
      clinicId: { in: targetClinics },
      deletedAt: null,
    },
  });
}
```

### Pattern 3: Cross-Clinic Query (Super Admin)

```typescript
// Used by: Super admin only for system-wide operations
async function getAllPatients(session: Session) {
  if (session.user.role !== 'super_admin') {
    throw new ForbiddenError('Super admin access required');
  }

  return db.patient.findMany({
    where: { deletedAt: null },
    include: { clinic: true }, // Include clinic for context
  });
}
```

### Pattern 4: Create with Clinic ID

```typescript
async function createPatient(session: Session, data: CreatePatientInput) {
  return db.patient.create({
    data: {
      ...data,
      clinicId: session.user.clinicId, // Always from session
      createdBy: session.user.id,
      createdAt: new Date(),
    },
  });
}
```

### Pattern 5: Update with Clinic Verification

```typescript
async function updatePatient(session: Session, id: string, data: UpdateInput) {
  return db.patient.update({
    where: {
      id,
      clinicId: session.user.clinicId, // Prevents cross-clinic update
    },
    data: {
      ...data,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    },
  });
}
```

### Pattern 6: Soft Delete with Clinic Verification

```typescript
async function deletePatient(session: Session, id: string) {
  return db.patient.update({
    where: {
      id,
      clinicId: session.user.clinicId, // Prevents cross-clinic delete
    },
    data: {
      deletedAt: new Date(),
      deletedBy: session.user.id,
    },
  });
}
```

### Anti-Patterns (NEVER DO)

```typescript
// ❌ Missing clinicId
const patients = await db.patient.findMany({});

// ❌ Using user-provided clinicId without validation
const patients = await db.patient.findMany({
  where: { clinicId: req.body.clinicId },
});

// ❌ Trusting client-side clinicId
const patient = await db.patient.update({
  where: { id: req.body.patientId },
  data: { clinicId: req.body.newClinicId },
});
```

---

## Dependencies

**Depends On:**
- Clinic ID Enforcement
- Session Management

**Required By:**
- All API routes
- All data services

---

## Notes

- Copy-paste these patterns - don't improvise
- When in doubt, add clinicId filter
- Code review should verify pattern usage
