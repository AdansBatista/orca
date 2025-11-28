# Patient Insurance Management

> **Sub-Area**: [Insurance Claims](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Patient Insurance Management stores and manages patient insurance information including policy details, subscriber information, and orthodontic benefit tracking. This function captures insurance data during patient intake and maintains it throughout treatment. It tracks benefit usage against lifetime maximums common in orthodontic coverage.

---

## Core Requirements

- [ ] Capture primary and secondary insurance information
- [ ] Store subscriber and dependent information
- [ ] Track group numbers, policy details, and effective dates
- [ ] Manage insurance card images (front and back)
- [ ] Track orthodontic benefit usage and remaining amounts
- [ ] Support coverage verification status tracking
- [ ] Handle insurance changes (new coverage, termination)
- [ ] Calculate coordination of benefits order

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/patients/:id/insurance` | `insurance:read` | List patient's insurance |
| GET | `/api/patients/:id/insurance/:insuranceId` | `insurance:read` | Get insurance details |
| POST | `/api/patients/:id/insurance` | `insurance:create` | Add insurance to patient |
| PUT | `/api/patients/:id/insurance/:insuranceId` | `insurance:update` | Update insurance info |
| DELETE | `/api/patients/:id/insurance/:insuranceId` | `insurance:delete` | Remove insurance |
| POST | `/api/patients/:id/insurance/:insuranceId/card` | `insurance:update` | Upload card images |
| PUT | `/api/patients/:id/insurance/reorder` | `insurance:update` | Change primary/secondary order |

---

## Data Model

```prisma
model PatientInsurance {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  insuranceCompanyId String @db.ObjectId

  // Coverage order
  priority      InsurancePriority @default(PRIMARY)

  // Subscriber info
  subscriberId     String
  groupNumber      String?
  subscriberName   String
  subscriberDob    DateTime
  relationToSubscriber RelationToSubscriber

  // Coverage dates
  effectiveDate    DateTime
  terminationDate  DateTime?

  // Verification
  lastVerified     DateTime?
  verificationStatus VerificationStatus @default(NOT_VERIFIED)

  // Ortho benefits (populated from eligibility check)
  hasOrthoBenefit     Boolean @default(false)
  orthoLifetimeMax    Decimal?
  orthoUsedAmount     Decimal  @default(0)
  orthoRemainingAmount Decimal?
  orthoAgeLimit       Int?
  orthoWaitingPeriod  Int?      // months
  orthoCoveragePercent Decimal?
  orthoDeductible     Decimal?
  orthoDeductibleMet  Decimal  @default(0)

  // Card images
  cardFrontUrl     String?
  cardBackUrl      String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic      Clinic          @relation(fields: [clinicId], references: [id])
  patient     Patient         @relation(fields: [patientId], references: [id])
  company     InsuranceCompany @relation(fields: [insuranceCompanyId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([insuranceCompanyId])
  @@index([subscriberId])
}

enum InsurancePriority {
  PRIMARY
  SECONDARY
  TERTIARY
}

enum RelationToSubscriber {
  SELF
  SPOUSE
  CHILD
  OTHER
}

enum VerificationStatus {
  NOT_VERIFIED
  VERIFIED
  FAILED
  EXPIRED
}
```

---

## Business Rules

- Patient can have multiple insurances (primary, secondary, tertiary)
- Subscriber ID and group number required for claims submission
- Insurance marked expired 30 days after last verification
- Ortho benefit usage tracked across treatment lifetime
- Age limit triggers warning before patient ages out
- Waiting period calculated from subscriber's effective date
- Coverage termination blocks new claims to that insurance

---

## Dependencies

**Depends On:**
- Insurance Company Database (company reference)
- CRM & Onboarding (patient records, intake capture)

**Required By:**
- Eligibility Verification (insurance to verify)
- Claims Submission (billing target)
- Treatment Cost Estimator (benefit estimation)
- Coordination of Benefits (dual coverage)

---

## Notes

- Card images stored in secure document storage with PHI protection
- Consider OCR extraction from card images to auto-populate fields
- Track insurance changes history for claims appeals
- Notify staff when insurance approaching termination date

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
