# Payment Reconciliation

> **Sub-Area**: [Payment Processing](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Payment Reconciliation matches processed payments to bank deposits and gateway settlements. This function provides visibility into daily settlement reports, tracks processing fees, identifies discrepancies between expected and actual deposits, and ensures accurate financial reporting. It's essential for accounting and audit purposes.

---

## Core Requirements

- [ ] Automatic reconciliation with payment gateway settlements
- [ ] Daily settlement reports
- [ ] Bank deposit matching
- [ ] Processing fee tracking and reporting
- [ ] Payout schedule visibility
- [ ] Discrepancy identification and flagging
- [ ] Manual reconciliation tools
- [ ] Settlement history and audit trail

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/settlements` | `payment:reconcile` | List settlements |
| GET | `/api/settlements/:id` | `payment:reconcile` | Get settlement details |
| GET | `/api/settlements/:id/payments` | `payment:reconcile` | Get payments in settlement |
| POST | `/api/settlements/:id/reconcile` | `payment:reconcile` | Mark reconciled |
| POST | `/api/settlements/:id/discrepancy` | `payment:reconcile` | Report discrepancy |
| GET | `/api/settlements/summary` | `payment:reconcile` | Get reconciliation summary |
| GET | `/api/reconciliation/fees` | `payment:read` | Get fee report |

---

## Data Model

```prisma
model PaymentSettlement {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Settlement identification
  settlementId  String   @unique  // Gateway settlement/payout ID
  gateway       PaymentGateway
  settlementDate DateTime
  depositDate   DateTime?

  // Amounts
  grossAmount   Decimal  // Total payments
  feeAmount     Decimal  // Processing fees
  netAmount     Decimal  // Net deposit amount
  refundAmount  Decimal  @default(0)
  chargebackAmount Decimal @default(0)
  adjustmentAmount Decimal @default(0)

  // Payment counts
  paymentCount  Int
  refundCount   Int      @default(0)

  // Reconciliation
  status        SettlementStatus @default(PENDING)
  reconciledAt  DateTime?
  reconciledBy  String?  @db.ObjectId

  // Bank matching
  bankTransactionId String?
  bankAmount        Decimal?
  discrepancy       Decimal?
  discrepancyNotes  String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  items     SettlementItem[]

  @@index([clinicId])
  @@index([settlementId])
  @@index([settlementDate])
  @@index([status])
}

model SettlementItem {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  settlementId  String   @db.ObjectId
  paymentId     String?  @db.ObjectId
  refundId      String?  @db.ObjectId

  // Item details
  type          SettlementItemType
  amount        Decimal
  feeAmount     Decimal  @default(0)
  netAmount     Decimal

  // Gateway reference
  gatewayTransactionId String?

  // Relations
  settlement    PaymentSettlement @relation(fields: [settlementId], references: [id])

  @@index([settlementId])
  @@index([paymentId])
}

enum SettlementStatus {
  PENDING
  DEPOSITED
  RECONCILED
  DISCREPANCY
}

enum SettlementItemType {
  PAYMENT
  REFUND
  CHARGEBACK
  ADJUSTMENT
  FEE
}
```

---

## Business Rules

- Settlements imported automatically from gateway webhooks
- Reconciliation required within 3 business days of deposit
- Discrepancy threshold for auto-flagging (e.g., >$1.00)
- Fee tracking by payment type for reporting
- Monthly fee summary for accounting
- Settlements cannot be modified after reconciliation
- Unreconciled settlements flagged on dashboard

---

## Dependencies

**Depends On:**
- Payment Gateway Integration (settlement data)
- Payment Processing (payment records)
- Refund Processing (refund records)

**Required By:**
- Financial Reporting (revenue verification)
- Accounting Integration (GL posting)

---

## Notes

- Stripe provides detailed payout reconciliation via API
- Implement settlement CSV export for accounting software
- Track effective processing rate (fees / gross)
- Consider bank feed integration for automatic matching
- Alert on chargebacks for immediate attention

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
