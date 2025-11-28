# Credit Balance Management

> **Sub-Area**: [Patient Billing](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Credit Balance Management handles overpayments, credits, and refund processing. When patients overpay, insurance pays more than expected, or adjustments create credits, this function tracks those credits and provides options to apply them to outstanding balances, refund them, or transfer them within family accounts.

---

## Core Requirements

- [ ] Track credit balances by source (overpayment, insurance, adjustment, promotional)
- [ ] Apply credits to outstanding invoice balances
- [ ] Process refunds to original payment method
- [ ] Transfer credits between family member accounts
- [ ] Credit expiration tracking for promotional credits
- [ ] Credit aging and reporting
- [ ] Automated credit application options (apply to oldest invoice)
- [ ] Audit trail for all credit activity

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/billing/credits` | `billing:read` | List credit balances |
| GET | `/api/billing/credits/:id` | `billing:read` | Get credit details |
| POST | `/api/billing/credits` | `billing:adjust_balance` | Create manual credit |
| POST | `/api/billing/credits/:id/apply` | `billing:adjust_balance` | Apply credit to invoice |
| POST | `/api/billing/credits/:id/refund` | `billing:process_refund` | Refund credit to patient |
| POST | `/api/billing/credits/:id/transfer` | `billing:adjust_balance` | Transfer to another account |
| GET | `/api/billing/accounts/:id/credits` | `billing:read` | List account's credits |

---

## Data Model

```prisma
model CreditBalance {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  accountId     String   @db.ObjectId

  // Credit details
  creditNumber   String   @unique
  amount         Decimal
  remainingAmount Decimal
  source         CreditSource
  description    String?

  // Source references
  paymentId      String?  @db.ObjectId
  insurancePaymentId String? @db.ObjectId
  adjustmentId   String?  @db.ObjectId

  // Expiration
  expiresAt     DateTime?

  // Status
  status        CreditStatus @default(AVAILABLE)

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic         @relation(fields: [clinicId], references: [id])
  account   PatientAccount @relation(fields: [accountId], references: [id])
  applications CreditApplication[]

  @@index([clinicId])
  @@index([accountId])
  @@index([status])
  @@index([expiresAt])
}

model CreditApplication {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  creditId      String   @db.ObjectId
  invoiceId     String?  @db.ObjectId
  refundId      String?  @db.ObjectId

  // Application details
  amount        Decimal
  applicationType CreditApplicationType
  appliedAt     DateTime @default(now())
  appliedBy     String?  @db.ObjectId

  // Relations
  credit     CreditBalance @relation(fields: [creditId], references: [id])

  @@index([creditId])
  @@index([invoiceId])
}

enum CreditSource {
  OVERPAYMENT
  INSURANCE_REFUND
  ADJUSTMENT
  PROMOTIONAL
  TRANSFER
}

enum CreditStatus {
  AVAILABLE
  PARTIALLY_APPLIED
  FULLY_APPLIED
  EXPIRED
  REFUNDED
}

enum CreditApplicationType {
  INVOICE_PAYMENT
  REFUND
  TRANSFER
  WRITE_OFF
}
```

---

## Business Rules

- Credits from overpayments never expire
- Promotional credits may have expiration dates
- Refunds go to original payment method when possible
- Credits over threshold (e.g., $25) require proactive refund or patient notification
- Automatic credit application option at patient/account level
- Transfer credits require both accounts in same family group
- Manual credit creation requires manager approval over threshold
- Expired credits are auto-written-off with notification

---

## Dependencies

**Depends On:**
- Patient Account Management (account data)
- Payment Processing (refund processing)
- Family Account Management (credit transfers)

**Required By:**
- Patient Account Management (credit balance calculation)
- Collections Management (credit application to overdue balances)

---

## Notes

- Generate monthly credit balance report for review
- Consider automatic notification to patients with credit balances
- Track refund check numbers if mailed
- Implement credit balance aging similar to AR aging

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
