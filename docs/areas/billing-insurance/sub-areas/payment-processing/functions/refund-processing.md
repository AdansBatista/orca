# Refund Processing

> **Sub-Area**: [Payment Processing](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Refund Processing handles refunds and voids for patient payments. This function supports full and partial refunds to the original payment method, same-day voids (which avoid processing fees), refund reason tracking, and approval workflows for large refunds. It maintains proper accounting and audit trails for all refund activity.

---

## Core Requirements

- [ ] Full refunds to original payment method
- [ ] Partial refunds
- [ ] Same-day void (avoids processing fee)
- [ ] Refund reason tracking and reporting
- [ ] Approval workflow for refunds over threshold
- [ ] Refund to different payment method (when original unavailable)
- [ ] Refund check generation for cash/check payments
- [ ] Reconciliation with patient account

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/refunds` | `payment:read` | List refunds |
| GET | `/api/refunds/:id` | `payment:read` | Get refund details |
| POST | `/api/payments/:id/refund` | `payment:process_refund` | Create refund |
| POST | `/api/payments/:id/void` | `payment:void` | Void payment (same-day) |
| POST | `/api/refunds/:id/approve` | `payment:approve_refund` | Approve refund |
| POST | `/api/refunds/:id/reject` | `payment:approve_refund` | Reject refund |
| GET | `/api/refunds/pending-approval` | `payment:read` | List pending approvals |

---

## Data Model

```prisma
model Refund {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  paymentId     String   @db.ObjectId
  accountId     String   @db.ObjectId

  // Refund identification
  refundNumber     String   @unique
  gatewayRefundId  String?  // Stripe/Square refund ID

  // Refund details
  amount           Decimal
  reason           RefundReason
  reasonDetails    String?
  status           RefundStatus @default(PENDING)
  refundMethod     RefundMethod

  // Processing
  processedAt      DateTime?
  processedBy      String?  @db.ObjectId
  gatewayStatus    String?

  // Approval (for large refunds)
  requiresApproval Boolean  @default(false)
  approvalThreshold Decimal?
  approvedAt       DateTime?
  approvedBy       String?  @db.ObjectId
  rejectedAt       DateTime?
  rejectedBy       String?  @db.ObjectId
  rejectionReason  String?

  // Check refund details
  checkNumber      String?
  checkMailedAt    DateTime?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])
  payment   Payment  @relation(fields: [paymentId], references: [id])

  @@index([clinicId])
  @@index([paymentId])
  @@index([refundNumber])
  @@index([status])
}

enum RefundReason {
  OVERPAYMENT
  TREATMENT_CANCELLED
  INSURANCE_ADJUSTMENT
  DUPLICATE_PAYMENT
  PATIENT_REQUEST
  BILLING_ERROR
  DISSATISFACTION
  OTHER
}

enum RefundStatus {
  PENDING
  PENDING_APPROVAL
  APPROVED
  REJECTED
  PROCESSING
  COMPLETED
  FAILED
}

enum RefundMethod {
  ORIGINAL_PAYMENT   // Refund to original card/account
  CHECK             // Mail refund check
  CREDIT            // Apply as account credit
  CASH              // Cash refund (in-office)
}
```

---

## Business Rules

- Void available only on same calendar day as payment
- Refund cannot exceed original payment amount
- Refunds over threshold require manager approval
- Original payment method preferred; check if unavailable
- Partial refund leaves remainder on payment
- Refund updates patient account balance
- Card refunds take 5-10 business days to appear
- Cash/check refund requires in-person pickup or mail

---

## Dependencies

**Depends On:**
- Payment Gateway Integration (refund API)
- Payment Processing (payment records)
- Patient Account Management (balance updates)

**Required By:**
- Credit Balance Management (refund of credits)
- Financial Reporting (refund tracking)

---

## Notes

- Track processing fees saved by voids vs. refunds
- Implement refund limit per staff member per day
- Generate refund check through accounting integration
- Consider partial refund impact on payment plan recalculation
- Alert on unusual refund patterns (fraud detection)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
