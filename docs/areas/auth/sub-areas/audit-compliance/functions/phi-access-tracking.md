# PHI Access Tracking

> **Sub-Area**: [Audit & Compliance](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Tracks all access to Protected Health Information (PHI) as required by HIPAA. Maintains a dedicated log of who accessed what patient data, when, and for what purpose. Essential for compliance audits and breach investigations.

---

## Core Requirements

- [ ] Log all PHI view events
- [ ] Log all PHI export events
- [ ] Log all PHI print events
- [ ] Track which fields/sections accessed
- [ ] Capture access reason when required
- [ ] Provide patient-centric access history
- [ ] Support HIPAA access audit reports

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/phi-access-logs` | `audit:view_logs` | List PHI access logs |
| GET | `/api/phi-access-logs/patient/[id]` | `audit:view_logs` | Patient access history |
| GET | `/api/phi-access-logs/user/[id]` | `audit:view_logs` | User access history |

---

## Data Model

```prisma
model PhiAccessLog {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  timestamp     DateTime @default(now())

  // Who
  userId        String   @db.ObjectId
  userName      String
  userRole      String
  userIp        String?
  userAgent     String?

  // Which patient
  patientId     String   @db.ObjectId
  clinicId      String   @db.ObjectId

  // What
  accessType    String   // VIEW, EXPORT, PRINT
  fieldsAccessed String[] // demographics, medical_history, etc.
  reason        String?  // Optional reason for access

  @@index([userId])
  @@index([patientId])
  @@index([clinicId])
  @@index([timestamp])
  @@index([accessType])
}
```

---

## Business Rules

### Access Types

| Type | Description | When Logged |
|------|-------------|-------------|
| VIEW | Viewing patient record | Opening patient chart |
| EXPORT | Exporting patient data | Download, API export |
| PRINT | Printing patient info | Print action |

### Fields Categories

```typescript
const PHI_FIELD_CATEGORIES = [
  'demographics',      // Name, DOB, address, phone
  'contact_info',      // Email, emergency contacts
  'medical_history',   // Conditions, allergies
  'treatment_plans',   // Current/past treatments
  'clinical_notes',    // Provider notes
  'images',           // X-rays, photos
  'financial',        // Insurance, billing
  'documents',        // Consent forms, records
];
```

### Logger Implementation

```typescript
// lib/audit/phiAccess.ts
export async function logPhiAccess(
  session: Session,
  patientId: string,
  accessType: 'VIEW' | 'EXPORT' | 'PRINT',
  options?: {
    fieldsAccessed?: string[];
    reason?: string;
  }
) {
  await db.phiAccessLog.create({
    data: {
      userId: session.user.id,
      userName: session.user.name,
      userRole: session.user.role,
      clinicId: session.user.clinicId,
      patientId,
      accessType,
      fieldsAccessed: options?.fieldsAccessed ?? ['full_record'],
      reason: options?.reason,
    },
  });
}
```

### When to Log

```typescript
// Log when opening patient chart
await logPhiAccess(session, patientId, 'VIEW', {
  fieldsAccessed: ['demographics', 'medical_history'],
});

// Log when exporting
await logPhiAccess(session, patientId, 'EXPORT', {
  fieldsAccessed: ['full_record'],
  reason: 'Records transfer to specialist',
});

// Log when printing
await logPhiAccess(session, patientId, 'PRINT', {
  fieldsAccessed: ['treatment_plans'],
  reason: 'Patient requested copy',
});
```

---

## Dependencies

**Depends On:**
- Session Management
- Audit Event Logging

**Required By:**
- Patient chart viewing
- Data export features
- Print features
- Compliance Reporting

---

## Notes

- HIPAA requires 7-year retention of access logs
- Patient can request their access history
- Export/Print may require reason field
