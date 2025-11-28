# Insurance Information Capture

> **Sub-Area**: [Intake Forms](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Insurance Information Capture collects subscriber and insurance plan details from patients, including card image uploads for verification. This data supports eligibility verification, claims processing, and financial planning for orthodontic treatment, with support for primary and secondary insurance coverage.

---

## Core Requirements

- [ ] Capture subscriber information (name, DOB, relationship to patient)
- [ ] Collect insurance company and plan details (group number, member ID)
- [ ] Support primary and secondary insurance entry
- [ ] Enable insurance card image upload (front and back)
- [ ] Capture employer information for group plans
- [ ] Trigger automatic eligibility verification on submission
- [ ] Store verification status and results

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/patients/:id/insurance` | `patient:read` | List patient insurance records |
| POST | `/api/patients/:id/insurance` | `intake:update` | Add insurance information |
| PUT | `/api/patients/:id/insurance/:insId` | `intake:update` | Update insurance |
| DELETE | `/api/patients/:id/insurance/:insId` | `intake:update` | Remove insurance |
| POST | `/api/patients/:id/insurance/:insId/verify` | `insurance:verify` | Trigger eligibility check |
| POST | `/api/patients/:id/insurance/:insId/upload-card` | `intake:update` | Upload card images |

---

## Data Model

```prisma
model PatientInsuranceInfo {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId

  // Insurance order
  priority      InsurancePriority @default(PRIMARY)

  // Subscriber info
  subscriberId          String
  subscriberFirstName   String
  subscriberLastName    String
  subscriberDob         DateTime
  subscriberRelationship SubscriberRelationship

  // Insurance company
  insuranceCompanyName  String
  insuranceCompanyId    String?  @db.ObjectId
  groupNumber           String?
  planName              String?

  // Employer
  employerName          String?
  employerAddress       String?
  employerPhone         String?

  // Card images
  cardFrontUrl          String?
  cardBackUrl           String?

  // Verification
  verifiedAt            DateTime?
  verifiedBy            String?  @db.ObjectId
  verificationStatus    VerificationStatus @default(PENDING)
  verificationNotes     String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  deletedAt     DateTime?

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  patient       Patient  @relation(fields: [patientId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([priority])
}

enum InsurancePriority {
  PRIMARY
  SECONDARY
  TERTIARY
}

enum VerificationStatus {
  PENDING
  VERIFIED
  FAILED
  NEEDS_UPDATE
}
```

---

## Business Rules

- Patient can have maximum one primary, one secondary, one tertiary insurance
- Subscriber relationship determines coordination of benefits order
- Card images stored securely with encryption at rest
- Auto-verification triggered within 24 hours of submission during business days
- Failed verification flags for front desk review
- Insurance changes during treatment require re-verification
- Card images accepted: JPG, PNG, PDF up to 10MB
- OCR extraction attempted for card data pre-population

---

## Dependencies

**Depends On:**
- Patient Form Portal (data entry interface)
- Form Template Builder (insurance form template)
- Cloud Storage (card image storage)

**Required By:**
- Billing & Insurance (claims processing)
- Treatment Management (financial planning)
- Completion Tracking (required form status)

---

## Notes

- Consider integration with clearinghouse for real-time eligibility
- Orthodontic-specific benefit extraction (lifetime max, waiting periods)
- Support for coordination of benefits calculation
- Insurance card OCR would improve data accuracy and reduce entry time

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
