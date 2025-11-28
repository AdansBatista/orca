# Insurance Payment Posting

> **Sub-Area**: [Insurance Claims](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Insurance Payment Posting posts insurance payments from processed EOBs to patient accounts. This function applies payments to claims, records contractual adjustments, handles over/under payments, and transfers remaining balances to patient responsibility. Accurate payment posting ensures correct account balances and financial reporting.

---

## Core Requirements

- [ ] Post payments from processed EOBs to claims
- [ ] Apply contractual adjustments per fee schedule
- [ ] Handle over-payments (credit to account)
- [ ] Handle under-payments (flag for review)
- [ ] Transfer remaining balance to patient responsibility
- [ ] Bulk payment posting from single EOB
- [ ] Payment reconciliation with bank deposits
- [ ] Audit trail for all postings

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | `/api/insurance/eobs/:id/post` | `insurance:post_payment` | Post EOB payments |
| POST | `/api/insurance/payments` | `insurance:post_payment` | Post individual payment |
| GET | `/api/insurance/payments` | `insurance:read` | List insurance payments |
| GET | `/api/insurance/payments/:id` | `insurance:read` | Get payment details |
| POST | `/api/insurance/payments/:id/void` | `insurance:void` | Void posted payment |
| POST | `/api/insurance/payments/batch` | `insurance:post_payment` | Batch post payments |
| GET | `/api/insurance/payments/unposted` | `insurance:read` | List unposted payments |

---

## Data Model

```prisma
model InsurancePayment {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  eobId         String   @db.ObjectId
  claimId       String   @db.ObjectId
  accountId     String   @db.ObjectId

  // Payment identification
  paymentNumber String   @unique

  // Payment details
  paymentDate   DateTime
  amount        Decimal
  adjustmentAmount Decimal @default(0)
  adjustmentCodes  String[]
  patientResponsibility Decimal @default(0)

  // Posting
  status        InsurancePaymentStatus @default(PENDING)
  postedAt      DateTime?
  postedBy      String?  @db.ObjectId

  // Void tracking
  voidedAt      DateTime?
  voidedBy      String?  @db.ObjectId
  voidReason    String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic         @relation(fields: [clinicId], references: [id])
  eob       EOB            @relation(fields: [eobId], references: [id])

  @@index([clinicId])
  @@index([eobId])
  @@index([claimId])
  @@index([accountId])
  @@index([paymentDate])
  @@index([status])
}

enum InsurancePaymentStatus {
  PENDING
  POSTED
  VOIDED
}
```

---

## Business Rules

- Payment amount must match EOB line item
- Adjustments validated against allowed amounts
- Over-payment creates credit on patient account
- Under-payment flags claim for review/appeal
- Patient responsibility auto-calculated and transferred
- Posted payments update claim status to PAID or PARTIAL
- Voiding payment reverses all account transactions
- Bulk posting creates individual payment records

---

## Dependencies

**Depends On:**
- EOB Processing (processed EOBs)
- Claims Submission (claims to apply payments)
- Patient Account Management (account balances)

**Required By:**
- Patient Billing (balance updates)
- Financial Reporting (revenue recognition)
- Collections Management (insurance payment tracking)

---

## Notes

- Implement automatic fee schedule lookup for adjustment validation
- Support posting to secondary insurance claims after primary pays
- Track payment timeliness by payer for analytics
- Consider auto-posting for electronic EOBs with high confidence matching

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
