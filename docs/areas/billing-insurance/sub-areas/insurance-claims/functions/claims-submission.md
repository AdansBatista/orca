# Claims Submission

> **Sub-Area**: [Insurance Claims](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Claims Submission creates and submits insurance claims electronically through the clearinghouse. This function generates claims from completed procedures, validates them against payer requirements before submission, submits via EDI 837 format, and tracks submission status. It handles orthodontic-specific requirements like monthly treatment claims and initial placement claims.

---

## Core Requirements

- [ ] Generate claims from completed procedures
- [ ] Validate claims before submission (required fields, codes)
- [ ] Submit via EDI 837 through clearinghouse
- [ ] Track submission status and confirmations
- [ ] Batch claim submission for end-of-day processing
- [ ] Handle ortho-specific claim types (initial, monthly, final)
- [ ] Support claim attachments when required
- [ ] Resubmit corrected or replacement claims

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/insurance/claims` | `insurance:read` | List claims |
| GET | `/api/insurance/claims/:id` | `insurance:read` | Get claim details |
| POST | `/api/insurance/claims` | `insurance:submit_claim` | Create new claim |
| PUT | `/api/insurance/claims/:id` | `insurance:update` | Update claim |
| POST | `/api/insurance/claims/:id/validate` | `insurance:submit_claim` | Validate claim |
| POST | `/api/insurance/claims/:id/submit` | `insurance:submit_claim` | Submit claim |
| POST | `/api/insurance/claims/batch-submit` | `insurance:submit_claim` | Batch submit claims |
| POST | `/api/insurance/claims/:id/void` | `insurance:void` | Void claim |
| POST | `/api/insurance/claims/:id/resubmit` | `insurance:submit_claim` | Resubmit corrected claim |

---

## Data Model

```prisma
model InsuranceClaim {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId          String   @db.ObjectId
  patientId         String   @db.ObjectId
  patientInsuranceId String  @db.ObjectId
  insuranceCompanyId String  @db.ObjectId

  // Claim identification
  claimNumber       String   @unique
  internalClaimId   String?  // Clearinghouse tracking ID
  payerClaimId      String?  // Insurance company's claim ID

  // Claim details
  claimType         ClaimType @default(ORIGINAL)
  orthoClaimType    OrthoClaimType?
  serviceDate       DateTime
  filingDate        DateTime?
  status            ClaimStatus @default(DRAFT)

  // Amounts
  billedAmount      Decimal
  allowedAmount     Decimal?
  paidAmount        Decimal?
  patientResponsibility Decimal?
  adjustmentAmount  Decimal?

  // Related
  originalClaimId   String?  @db.ObjectId
  preauthNumber     String?

  // Provider
  renderingProviderId String? @db.ObjectId
  npi               String?

  // Submission tracking
  submissionMethod  SubmissionMethod?
  submittedAt       DateTime?
  submittedBy       String?  @db.ObjectId
  acceptedAt        DateTime?
  rejectedAt        DateTime?
  rejectionReason   String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic           Clinic           @relation(fields: [clinicId], references: [id])
  patient          Patient          @relation(fields: [patientId], references: [id])
  patientInsurance PatientInsurance @relation(fields: [patientInsuranceId], references: [id])
  items            ClaimItem[]
  statusHistory    ClaimStatusHistory[]

  @@index([clinicId])
  @@index([patientId])
  @@index([claimNumber])
  @@index([status])
  @@index([serviceDate])
}

model ClaimItem {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  claimId     String   @db.ObjectId

  // Line details
  lineNumber       Int
  procedureCode    String   // CDT code
  procedureModifier String?
  description      String
  serviceDate      DateTime
  quantity         Int      @default(1)
  toothNumbers     String[]

  // Amounts
  billedAmount     Decimal
  allowedAmount    Decimal?
  paidAmount       Decimal?
  adjustmentAmount Decimal?
  patientResponsibility Decimal?

  // Status
  status           ClaimItemStatus @default(PENDING)
  denialCode       String?
  denialReason     String?

  // Source
  procedureId      String?  @db.ObjectId

  // Relations
  claim    InsuranceClaim  @relation(fields: [claimId], references: [id])

  @@index([claimId])
  @@index([procedureCode])
}

enum ClaimType {
  ORIGINAL
  CORRECTED
  REPLACEMENT
  VOID
}

enum OrthoClaimType {
  INITIAL       // Banding/placement claim
  MONTHLY       // Monthly treatment claim
  FINAL         // Debanding/completion claim
}

enum ClaimStatus {
  DRAFT
  READY
  SUBMITTED
  ACCEPTED
  PENDING
  PAID
  PARTIAL
  DENIED
  APPEALED
  VOID
  CLOSED
}
```

---

## Business Rules

- Claims must be submitted within payer's timely filing limit
- Validate all required fields before submission
- Ortho initial claims include full treatment amount
- Monthly claims submitted per payer's payment schedule
- Corrected claims reference original claim number
- Voided claims cannot be resubmitted
- Pre-authorization number required for payers requiring preauth
- Provider NPI required on all claims

---

## Dependencies

**Depends On:**
- Patient Insurance Management (insurance details)
- Insurance Company Database (payer requirements)
- Treatment Management (procedures to bill)
- Pre-Authorization (auth numbers)
- Clearinghouse Integration (submission API)

**Required By:**
- Claims Tracking (status monitoring)
- EOB Processing (claim matching)
- Denial Management (denied claims)

---

## Notes

- EDI 837D format for dental claims, 837I for medical if needed
- Implement claim scrubbing rules for common errors
- Track timely filing deadlines with alerts
- Consider AI-powered coding suggestions for complex cases

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
