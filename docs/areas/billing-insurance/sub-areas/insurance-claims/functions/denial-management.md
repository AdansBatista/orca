# Denial Management

> **Sub-Area**: [Insurance Claims](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Denial Management handles claim denials efficiently with appeals and resubmissions. When claims are denied, this function captures denial reasons, facilitates appeals with supporting documentation, tracks appeal deadlines, enables corrected claim resubmission, and analyzes denial patterns to prevent future denials.

---

## Core Requirements

- [ ] Capture denial reasons and CARC/RARC codes
- [ ] Create appeal letters using templates
- [ ] Track appeal deadlines by payer
- [ ] Attach supporting documentation to appeals
- [ ] Resubmit corrected claims
- [ ] Analyze denial patterns by code, payer, procedure
- [ ] AI-suggested denial resolutions
- [ ] Track appeal success rates

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/insurance/denials` | `insurance:read` | List denied claims |
| GET | `/api/insurance/denials/:claimId` | `insurance:read` | Get denial details |
| POST | `/api/insurance/claims/:id/appeal` | `insurance:appeal` | Create appeal |
| GET | `/api/insurance/claims/:id/appeal` | `insurance:read` | Get appeal status |
| POST | `/api/insurance/claims/:id/appeal/submit` | `insurance:appeal` | Submit appeal |
| POST | `/api/insurance/claims/:id/appeal/attachments` | `insurance:appeal` | Add appeal docs |
| GET | `/api/insurance/denials/analytics` | `insurance:read` | Denial analytics |
| GET | `/api/insurance/denials/patterns` | `insurance:read` | Denial patterns report |

---

## Data Model

```prisma
model ClaimDenial {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  claimId       String   @db.ObjectId

  // Denial details
  deniedAt      DateTime
  denialSource  DenialSource
  denialCodes   String[]  // CARC codes
  remarkCodes   String[]  // RARC codes
  denialReason  String

  // Resolution
  status        DenialStatus @default(PENDING)
  resolution    DenialResolution?
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId

  // Financial impact
  deniedAmount  Decimal
  recoveredAmount Decimal @default(0)

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  claim     InsuranceClaim @relation(fields: [claimId], references: [id])
  appeal    ClaimAppeal?

  @@index([claimId])
  @@index([status])
  @@index([deniedAt])
}

model ClaimAppeal {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  denialId      String   @unique @db.ObjectId
  claimId       String   @db.ObjectId

  // Appeal details
  appealNumber  String?
  status        AppealStatus @default(DRAFT)
  appealReason  String
  appealLetter  String?  // Rich text content
  letterUrl     String?  // Generated PDF

  // Deadlines
  appealDeadline DateTime
  submittedAt    DateTime?
  responseDeadline DateTime?
  responseAt     DateTime?

  // Outcome
  outcome       AppealOutcome?
  outcomeNotes  String?
  approvedAmount Decimal?

  // Attachments
  attachments   AppealAttachment[]

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId
  submittedBy String? @db.ObjectId

  // Relations
  denial    ClaimDenial @relation(fields: [denialId], references: [id])

  @@index([claimId])
  @@index([status])
  @@index([appealDeadline])
}

type AppealAttachment {
  id          String
  type        String
  filename    String
  url         String
  uploadedAt  DateTime
}

enum DenialSource {
  EOB
  CLEARINGHOUSE
  MANUAL
}

enum DenialStatus {
  PENDING
  APPEALING
  RESUBMITTED
  WRITTEN_OFF
  RECOVERED
  CLOSED
}

enum DenialResolution {
  APPEAL_WON
  APPEAL_LOST
  RESUBMIT_PAID
  WRITTEN_OFF
  PATIENT_RESPONSIBILITY
  CODING_ERROR_CORRECTED
}

enum AppealStatus {
  DRAFT
  READY
  SUBMITTED
  UNDER_REVIEW
  WON
  LOST
  EXPIRED
}

enum AppealOutcome {
  APPROVED
  PARTIALLY_APPROVED
  DENIED
  NO_RESPONSE
}
```

---

## Business Rules

- Appeals must be filed within payer's appeal deadline (typically 30-90 days)
- One appeal per denial unless multiple levels allowed
- Appeal requires supporting documentation
- Track common denial codes for staff training
- Auto-suggest resolution based on denial code
- Expired appeal deadlines flagged immediately
- Write-off requires manager approval for denials over threshold

---

## Dependencies

**Depends On:**
- Claims Tracking (denied claims)
- EOB Processing (denial details)
- Imaging Management (clinical photos for appeals)
- Treatment Management (clinical notes for appeals)

**Required By:**
- Collections Management (patient responsibility after denial)
- Financial Reporting (denial analytics)

---

## Notes

- Build library of successful appeal letter templates
- Track appeal success rate by payer and denial code
- Consider AI-powered appeal letter generation
- Implement denial prevention rules based on pattern analysis

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
