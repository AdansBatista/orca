# EOB Processing

> **Sub-Area**: [Insurance Claims](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

EOB Processing handles Explanation of Benefits documents received from insurance companies. This function receives electronic EOBs (EDI 835), processes paper EOBs using AI-powered data extraction, matches EOBs to claims, reviews payment and adjustment details, and prepares data for payment posting. Efficient EOB processing is essential for accurate revenue recognition.

---

## Core Requirements

- [ ] Receive and parse electronic EOBs (EDI 835)
- [ ] AI-powered data extraction from scanned paper EOBs
- [ ] Match EOBs to submitted claims
- [ ] Review payment, adjustments, and patient responsibility
- [ ] Flag discrepancies between expected and actual payment
- [ ] Batch EOB processing for efficiency
- [ ] Handle EOBs with multiple claims
- [ ] Support manual EOB entry

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/insurance/eobs` | `insurance:read` | List EOBs |
| GET | `/api/insurance/eobs/:id` | `insurance:read` | Get EOB details |
| POST | `/api/insurance/eobs` | `insurance:create` | Create EOB (manual) |
| POST | `/api/insurance/eobs/upload` | `insurance:create` | Upload scanned EOB |
| POST | `/api/insurance/eobs/:id/process` | `insurance:post_payment` | Process EOB |
| POST | `/api/insurance/eobs/:id/match` | `insurance:update` | Match to claim |
| PUT | `/api/insurance/eobs/:id/review` | `insurance:update` | Mark reviewed |
| GET | `/api/insurance/eobs/pending` | `insurance:read` | List pending EOBs |

---

## Data Model

```prisma
model EOB {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // EOB identification
  eobNumber     String?
  checkNumber   String?
  eftNumber     String?
  receivedDate  DateTime

  // Source
  receiptMethod EOBReceiptMethod
  documentUrl   String?   // Scanned EOB image
  rawData       Json?     // EDI 835 parsed data

  // Amounts (totals across all claims on EOB)
  totalPaid     Decimal
  totalAdjusted Decimal  @default(0)
  totalPatientResponsibility Decimal @default(0)

  // Processing
  status        EOBStatus @default(PENDING)
  processedAt   DateTime?
  processedBy   String?  @db.ObjectId

  // AI extraction (for paper EOBs)
  extractionConfidence Decimal?
  extractedData Json?
  needsReview   Boolean  @default(false)
  reviewNotes   String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic          @relation(fields: [clinicId], references: [id])
  lineItems EOBLineItem[]

  @@index([clinicId])
  @@index([status])
  @@index([receivedDate])
  @@index([checkNumber])
}

model EOBLineItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  eobId         String   @db.ObjectId
  claimId       String?  @db.ObjectId

  // Line details
  claimNumber   String?
  patientName   String?
  serviceDate   DateTime?
  procedureCode String?

  // Amounts
  billedAmount  Decimal
  allowedAmount Decimal?
  paidAmount    Decimal
  adjustmentAmount Decimal @default(0)
  patientResponsibility Decimal @default(0)

  // Adjustments
  adjustmentCodes String[]
  adjustmentReasons String[]

  // Matching
  isMatched     Boolean  @default(false)
  matchConfidence Decimal?

  // Relations
  eob       EOB              @relation(fields: [eobId], references: [id])

  @@index([eobId])
  @@index([claimId])
  @@index([claimNumber])
}

enum EOBReceiptMethod {
  ELECTRONIC   // EDI 835
  SCANNED      // Paper scanned
  MANUAL       // Manually entered
  PORTAL       // Downloaded from payer portal
}

enum EOBStatus {
  PENDING
  REVIEWING
  MATCHED
  PROCESSED
  DISCREPANCY
  VOID
}
```

---

## Business Rules

- Electronic EOBs (835) auto-matched to claims by claim number
- Paper EOBs require AI extraction review before processing
- Flag payment discrepancies over threshold (e.g., >$50 difference)
- EOB totals must balance before posting
- Adjustments validated against fee schedule allowed amounts
- Patient responsibility transfers to patient account
- Duplicate EOB detection (same check number)

---

## Dependencies

**Depends On:**
- Claims Submission (claims to match)
- Clearinghouse Integration (EDI 835 receipt)
- AI Integration (OCR and data extraction)

**Required By:**
- Insurance Payment Posting (payment data)
- Denial Management (denial detection)
- Patient Billing (patient responsibility)

---

## Notes

- Train AI model on EOB formats from common payers
- Implement confidence threshold for auto-processing vs. manual review
- Parse CARC (Claim Adjustment Reason Codes) for adjustment categorization
- Consider bulk EOB import for practices switching from other systems

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
