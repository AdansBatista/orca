# Minor/Guardian Consent Management

> **Sub-Area**: [Consent Forms](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Minor/Guardian Consent Management handles the complex consent requirements for patients under 18, including guardian identification, custody documentation, multi-guardian consent scenarios, and the transition of consent authority when minors reach age of majority. This ensures proper authorization is obtained for all treatments involving minor patients while accommodating diverse family structures.

---

## Core Requirements

- [ ] Track guardian/parent relationships for minor patients
- [ ] Collect and store custody documentation when applicable
- [ ] Support multi-guardian consent scenarios (divorced parents, joint custody)
- [ ] Provide minor assent forms for age-appropriate acknowledgment (12+)
- [ ] Handle age of majority transition (consent responsibility at 18)
- [ ] Manage emergency treatment authorization levels
- [ ] Verify guardian relationship and consent authority
- [ ] Support delegation of consent authority documents

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/patients/:id/guardians` | `consent:read` | List patient's guardians |
| POST | `/api/patients/:id/guardians` | `consent:collect` | Add guardian relationship |
| PUT | `/api/patients/:id/guardians/:guardianId` | `consent:collect` | Update guardian details |
| DELETE | `/api/patients/:id/guardians/:guardianId` | `consent:collect` | Remove guardian relationship |
| POST | `/api/patients/:id/guardians/:guardianId/verify` | `consent:collect` | Verify guardian authority |
| POST | `/api/patients/:id/custody-document` | `consent:collect` | Upload custody documentation |
| GET | `/api/compliance/consents/minors/pending` | `consent:read` | List minors needing guardian consent |
| POST | `/api/patients/:id/age-transition` | `consent:collect` | Process age of majority transition |

---

## Data Model

```prisma
model GuardianConsent {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId  // Minor patient
  guardianId    String   @db.ObjectId  // Guardian contact record

  // Relationship
  relationship  GuardianRelationship
  isPrimary     Boolean  @default(false)  // Primary consent authority

  // Legal documentation
  custodyType   CustodyType?
  custodyDocumentUrl String?
  courtOrderNumber   String?

  // Authorization scope
  canConsentTreatment   Boolean @default(true)
  canConsentFinancial   Boolean @default(true)
  canConsentImaging     Boolean @default(true)
  canPickUp             Boolean @default(true)
  canAccessRecords      Boolean @default(true)

  // Verification
  verifiedAt    DateTime?
  verifiedBy    String?  @db.ObjectId
  verificationNotes String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?

  // Relations
  clinic     Clinic  @relation(fields: [clinicId], references: [id])
  patient    Patient @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([guardianId])
}

enum GuardianRelationship {
  MOTHER
  FATHER
  STEPMOTHER
  STEPFATHER
  GRANDMOTHER
  GRANDFATHER
  LEGAL_GUARDIAN
  FOSTER_PARENT
  AUNT
  UNCLE
  SIBLING
  OTHER
}

enum CustodyType {
  JOINT_CUSTODY
  SOLE_CUSTODY
  LEGAL_GUARDIAN
  FOSTER_CARE
  OTHER
}
```

---

## Business Rules

- All treatment for patients under 18 requires documented guardian consent
- Custody scenarios and consent requirements:
  - Married parents: Either parent can consent
  - Divorced with joint custody: Either parent can consent
  - Divorced with sole custody: Custodial parent required
  - Legal guardian: Guardian consent required
  - Foster care: Agency authorization required
- Primary guardian designation determines default consent collector
- Minor assent (ages 12+) is recommended but not legally required
- At age 18, patient assumes full consent responsibility (automated transition)
- Emergency treatment may proceed with any present guardian authorization
- Custody documents should be reviewed and verified by clinic staff

---

## Dependencies

**Depends On:**
- Patient Management (patient demographics, birth date)
- Digital Signature Capture (guardian signature collection)
- Document Storage (custody document storage)

**Required By:**
- All consent collection (checks minor status)
- Treatment Management (verifies guardian consent before treatment)
- Appointment Management (identifies guardian for appointment communications)

---

## Notes

- Age of majority varies by jurisdiction (18 in most US states)
- System should alert 30 days before patient turns 18 to prepare for transition
- Emancipated minor status may be documented as exception to guardian requirement
- Consider HIPAA special provisions for minors (some rights at 12-14 depending on state)
- Foster care situations require additional documentation from placing agency

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
