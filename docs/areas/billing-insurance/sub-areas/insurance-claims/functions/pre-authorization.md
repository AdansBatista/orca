# Pre-Authorization

> **Sub-Area**: [Insurance Claims](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Pre-Authorization submits and tracks pre-authorization requests required by some insurance plans before orthodontic treatment can begin. This function creates authorization requests with required documentation (photos, x-rays, treatment plan), submits them electronically when supported, tracks authorization status, and stores approval numbers for claims submission.

---

## Core Requirements

- [ ] Create pre-authorization requests with treatment details
- [ ] Attach required documentation (photos, x-rays, treatment plan)
- [ ] Submit electronically through clearinghouse when supported
- [ ] Support paper/portal submission workflow
- [ ] Track authorization status and expiration
- [ ] Store authorization numbers for claims reference
- [ ] Handle partial approvals and denials
- [ ] Manage resubmission and appeals

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/insurance/preauthorizations` | `insurance:read` | List pre-authorizations |
| GET | `/api/insurance/preauthorizations/:id` | `insurance:read` | Get authorization details |
| POST | `/api/insurance/preauthorizations` | `insurance:create` | Create pre-authorization |
| PUT | `/api/insurance/preauthorizations/:id` | `insurance:update` | Update authorization |
| POST | `/api/insurance/preauthorizations/:id/submit` | `insurance:submit_claim` | Submit to payer |
| POST | `/api/insurance/preauthorizations/:id/attachments` | `insurance:update` | Add attachments |
| PUT | `/api/insurance/preauthorizations/:id/response` | `insurance:update` | Record payer response |

---

## Data Model

```prisma
model Preauthorization {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId          String   @db.ObjectId
  patientId         String   @db.ObjectId
  patientInsuranceId String  @db.ObjectId

  // Auth request details
  authNumber        String?  // Assigned by payer
  status            PreauthStatus @default(DRAFT)
  requestDate       DateTime?
  responseDate      DateTime?
  expirationDate    DateTime?

  // Treatment info
  treatmentPlanId   String?  @db.ObjectId
  procedureCodes    String[]
  requestedAmount   Decimal
  diagnosisCodes    String[]

  // Response
  approvedAmount    Decimal?
  approvedUnits     Int?
  denialCode        String?
  denialReason      String?

  // Documents
  attachments       PreauthAttachment[]

  // Submission tracking
  submissionMethod  SubmissionMethod?
  submittedAt       DateTime?
  submittedBy       String?  @db.ObjectId
  confirmationNumber String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic           Clinic           @relation(fields: [clinicId], references: [id])
  patient          Patient          @relation(fields: [patientId], references: [id])
  patientInsurance PatientInsurance @relation(fields: [patientInsuranceId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([status])
  @@index([authNumber])
}

type PreauthAttachment {
  id          String
  type        AttachmentType
  filename    String
  url         String
  uploadedAt  DateTime
}

enum PreauthStatus {
  DRAFT
  PENDING
  SUBMITTED
  APPROVED
  PARTIAL
  DENIED
  EXPIRED
  APPEALED
}

enum AttachmentType {
  XRAY
  PHOTO
  TREATMENT_PLAN
  CLINICAL_NOTES
  MEDICAL_NECESSITY
  OTHER
}

enum SubmissionMethod {
  ELECTRONIC
  PAPER
  PORTAL
  FAX
}
```

---

## Business Rules

- Pre-authorization required before treatment for flagged payers
- Authorization valid for limited period (typically 90-180 days)
- Expired authorizations require resubmission
- Treatment cannot exceed approved amount/units without new auth
- Denials tracked for appeal management
- Authorization number required on claims for payers requiring preauth
- Alert when authorization approaching expiration

---

## Dependencies

**Depends On:**
- Patient Insurance Management (insurance details)
- Insurance Company Database (preauth requirements)
- Treatment Management (treatment plan, procedures)
- Imaging Management (x-rays, photos for attachments)

**Required By:**
- Claims Submission (auth number reference)
- Treatment Management (authorization to start treatment)

---

## Notes

- Common ortho procedure codes: D8010-D8999
- Generate cover letter template for paper submissions
- Track average preauth response time by payer
- Consider AI-powered medical necessity narrative generation

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
