# Payment Plan Builder

> **Sub-Area**: [Patient Billing](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Payment Plan Builder creates flexible payment arrangements that work for patients and the practice. This function calculates payment options based on treatment costs, accepts patient preferences, and sets up recurring payment schedules. It supports various down payment amounts, payment frequencies, and term lengths while enforcing practice policies.

---

## Core Requirements

- [ ] Calculate payment plan options based on total amount
- [ ] Configure down payment requirements (percent or fixed minimum)
- [ ] Support multiple payment frequencies (weekly, bi-weekly, monthly)
- [ ] Set up automatic recurring payments via payment gateway
- [ ] Generate payment plan agreements for patient signature
- [ ] Track payment plan compliance and missed payments
- [ ] Handle modifications (adjust amount, extend term, pause)
- [ ] Calculate early payoff amounts

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/billing/payment-plans` | `billing:read` | List payment plans |
| GET | `/api/billing/payment-plans/:id` | `billing:read` | Get plan details |
| POST | `/api/billing/payment-plans` | `billing:create` | Create payment plan |
| PUT | `/api/billing/payment-plans/:id` | `billing:update` | Update payment plan |
| POST | `/api/billing/payment-plans/:id/pause` | `billing:update` | Pause payment plan |
| POST | `/api/billing/payment-plans/:id/resume` | `billing:update` | Resume payment plan |
| POST | `/api/billing/payment-plans/:id/payoff` | `billing:update` | Early payoff |
| GET | `/api/billing/payment-plans/:id/schedule` | `billing:read` | Get payment schedule |

---

## Data Model

```prisma
model PaymentPlan {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  accountId     String   @db.ObjectId

  // Plan details
  planNumber    String   @unique
  status        PaymentPlanStatus @default(ACTIVE)

  // Amounts
  totalAmount      Decimal
  downPayment      Decimal
  financedAmount   Decimal
  monthlyPayment   Decimal
  remainingBalance Decimal

  // Terms
  numberOfPayments   Int
  completedPayments  Int      @default(0)
  frequency          PaymentFrequency @default(MONTHLY)
  startDate          DateTime
  nextPaymentDate    DateTime
  endDate            DateTime

  // Payment method
  paymentMethodId    String?  @db.ObjectId
  autoPayEnabled     Boolean  @default(false)

  // Agreement
  agreementUrl       String?
  signedAt           DateTime?
  signedBy           String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime?
  createdBy String?  @db.ObjectId
  updatedBy String?  @db.ObjectId

  // Relations
  clinic         Clinic         @relation(fields: [clinicId], references: [id])
  account        PatientAccount @relation(fields: [accountId], references: [id])
  paymentMethod  PaymentMethod? @relation(fields: [paymentMethodId], references: [id])
  scheduledPayments ScheduledPayment[]

  @@index([clinicId])
  @@index([accountId])
  @@index([status])
  @@index([nextPaymentDate])
}

enum PaymentPlanStatus {
  PENDING
  ACTIVE
  PAUSED
  COMPLETED
  DEFAULTED
  CANCELLED
}

enum PaymentFrequency {
  WEEKLY
  BIWEEKLY
  MONTHLY
}
```

---

## Business Rules

- Minimum down payment percentage configurable per clinic (e.g., 20%)
- Maximum payment term based on treatment type and amount
- Interest-free payment plans (orthodontics typically doesn't charge interest)
- Payment plan requires stored payment method for auto-pay
- Three consecutive missed payments trigger default status
- Early payoff has no penalty
- Paused plans cannot exceed maximum pause duration (e.g., 60 days)
- Payment schedule recalculates when amount or term changes

---

## Dependencies

**Depends On:**
- Patient Account Management (account data)
- Treatment Cost Estimator (estimate acceptance)
- Payment Processing (stored payment methods)

**Required By:**
- Recurring Billing Engine (scheduled payments)
- Collections Management (default tracking)

---

## Notes

- Generate PDF agreement with full terms and conditions
- Ensure compliance with consumer lending regulations
- Consider offering multiple plan options during setup
- Track payment plan success rates by term length for optimization

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
