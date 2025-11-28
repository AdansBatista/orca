# Coordination of Benefits

> **Sub-Area**: [Insurance Claims](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Coordination of Benefits (COB) handles patients with dual insurance coverage. This function determines primary and secondary insurance order using industry-standard rules (birthday rule, etc.), manages the claim submission sequence, submits to secondary after primary payment, and tracks combined coverage to maximize patient benefits.

---

## Core Requirements

- [ ] Determine primary/secondary insurance order
- [ ] Apply COB determination rules (birthday rule, gender rule)
- [ ] Submit claims to primary insurance first
- [ ] Submit to secondary after primary payment
- [ ] Track coverage across both policies
- [ ] Calculate combined benefit maximum
- [ ] Handle maintenance of benefits vs. non-duplication
- [ ] Estimate total coverage for treatment planning

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/patients/:id/insurance/cob` | `insurance:read` | Get COB determination |
| POST | `/api/patients/:id/insurance/cob/determine` | `insurance:update` | Run COB determination |
| PUT | `/api/patients/:id/insurance/cob/override` | `insurance:update` | Override COB order |
| POST | `/api/insurance/claims/:id/secondary` | `insurance:submit_claim` | Submit to secondary |
| GET | `/api/patients/:id/insurance/combined-benefit` | `insurance:read` | Get combined benefit estimate |

---

## Data Model

```prisma
model COBDetermination {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Insurances involved
  primaryInsuranceId   String   @db.ObjectId
  secondaryInsuranceId String   @db.ObjectId

  // Determination
  determinationRule    COBRule
  determinationDate    DateTime @default(now())
  isOverridden         Boolean  @default(false)
  overrideReason       String?
  overriddenBy         String?  @db.ObjectId

  // Benefit tracking
  primaryPaidAmount    Decimal  @default(0)
  secondaryPaidAmount  Decimal  @default(0)
  combinedPaidAmount   Decimal  @default(0)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  patient   Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
}

model SecondaryClaim {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  primaryClaimId String  @db.ObjectId
  secondaryClaimId String @db.ObjectId

  // Primary payment info
  primaryPaidAmount     Decimal
  primaryAdjustments    Decimal
  primaryPatientResp    Decimal

  // Submission tracking
  submittedAt          DateTime?
  status               SecondaryClaimStatus @default(PENDING)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([primaryClaimId])
  @@index([secondaryClaimId])
  @@index([status])
}

enum COBRule {
  BIRTHDAY_RULE        // Parent with earlier birthday is primary for children
  GENDER_RULE          // Male subscriber primary (deprecated but some plans use)
  SUBSCRIBER_PRIORITY  // Patient's own plan is primary
  DEPENDENT_PRIORITY   // Dependent status determines order
  COURT_ORDER          // Legal document specifies order
  MANUAL               // Manually determined
}

enum SecondaryClaimStatus {
  PENDING              // Waiting for primary payment
  READY                // Primary paid, ready to submit
  SUBMITTED            // Submitted to secondary
  PAID                 // Secondary paid
  DENIED               // Secondary denied
  CLOSED               // No secondary payment expected
}
```

---

## Business Rules

- Birthday rule: Parent with earlier birthday in calendar year is primary for child
- Patient's own insurance is primary over spouse's coverage
- Court orders override standard COB rules
- Submit to secondary with primary EOB data attached
- Secondary pays up to remaining allowed amount
- Combined payment cannot exceed billed amount
- Track both insurances' ortho benefits separately
- Auto-create secondary claim when primary EOB processed

---

## Dependencies

**Depends On:**
- Patient Insurance Management (multiple insurances)
- Claims Submission (primary claims)
- EOB Processing (primary payment data)

**Required By:**
- Treatment Cost Estimator (combined benefit estimation)
- Insurance Payment Posting (secondary payments)

---

## Notes

- Some states have specific COB rules - consider state configuration
- Document COB determination for audit purposes
- Alert if COB order changes mid-treatment
- Consider edge cases: divorced parents, multiple employers

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
