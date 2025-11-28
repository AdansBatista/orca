# Late Payment Tracking

> **Sub-Area**: [Collections Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Late Payment Tracking monitors and manages late payments on invoices and payment plans. This function identifies missed payment plan payments, tracks consecutive missed payments, flags accounts at risk of default, records payment promises, and manages follow-up on unfulfilled promises. It provides early warning for potential collection issues.

---

## Core Requirements

- [ ] Identify missed payment plan payments
- [ ] Track consecutive missed payments
- [ ] Calculate and apply late fees (if applicable)
- [ ] Flag accounts at risk of default
- [ ] Record payment promises with due dates
- [ ] Track promise-to-pay follow-ups
- [ ] Dashboard view of late/at-risk accounts
- [ ] Configurable late payment thresholds

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/collections/late-payments` | `collections:read` | List late payments |
| GET | `/api/collections/at-risk` | `collections:read` | List at-risk accounts |
| GET | `/api/collections/promises` | `collections:read` | List payment promises |
| POST | `/api/collections/accounts/:id/promise` | `collections:manage` | Record promise |
| PUT | `/api/collections/promises/:id` | `collections:manage` | Update promise |
| POST | `/api/collections/promises/:id/fulfill` | `collections:manage` | Mark fulfilled |
| POST | `/api/collections/promises/:id/broken` | `collections:manage` | Mark broken |
| GET | `/api/collections/promises/due-today` | `collections:read` | Promises due today |

---

## Data Model

```prisma
model AccountCollection {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  accountId     String   @db.ObjectId
  workflowId    String?  @db.ObjectId

  // Status
  status        CollectionStatus @default(ACTIVE)
  currentStage  Int      @default(1)
  enteredStageAt DateTime @default(now())

  // Balance tracking
  startingBalance Decimal
  currentBalance  Decimal
  paidAmount      Decimal  @default(0)

  // Late payment tracking
  missedPayments     Int   @default(0)
  consecutiveMissed  Int   @default(0)
  lastPaymentDate    DateTime?
  lateFeeBalance     Decimal @default(0)

  // Risk assessment
  riskScore     Int?     // 0-100
  riskLevel     RiskLevel @default(LOW)

  // Dates
  startedAt     DateTime @default(now())
  lastActionAt  DateTime?
  pausedAt      DateTime?
  pauseReason   PauseReason?
  completedAt   DateTime?
  completionReason String?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic    Clinic         @relation(fields: [clinicId], references: [id])
  account   PatientAccount @relation(fields: [accountId], references: [id])
  activities CollectionActivity[]
  promises  PaymentPromise[]

  @@index([clinicId])
  @@index([accountId])
  @@index([status])
  @@index([riskLevel])
}

model PaymentPromise {
  id                  String   @id @default(auto()) @map("_id") @db.ObjectId
  accountCollectionId String?  @db.ObjectId
  accountId           String   @db.ObjectId
  clinicId            String   @db.ObjectId

  // Promise details
  promisedAmount    Decimal
  promisedDate      DateTime
  notes             String?
  contactMethod     String?  // Phone, email, in-person

  // Status
  status            PromiseStatus @default(PENDING)

  // Outcome
  paidAmount        Decimal?
  paidDate          DateTime?
  brokenAt          DateTime?
  brokenReason      String?

  // Follow-up
  followUpDate      DateTime?
  followUpCompleted Boolean  @default(false)

  // Timestamps & Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  recordedBy String?  @db.ObjectId

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([accountId])
  @@index([promisedDate])
  @@index([status])
}

enum CollectionStatus {
  ACTIVE
  PAUSED
  PAYMENT_PLAN
  SETTLED
  WRITTEN_OFF
  AGENCY
  COMPLETED
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum PauseReason {
  PAYMENT_PLAN
  DISPUTE
  HARDSHIP
  BANKRUPTCY
  LEGAL_HOLD
  MANUAL
}

enum PromiseStatus {
  PENDING
  FULFILLED
  PARTIAL
  BROKEN
  CANCELLED
}
```

---

## Business Rules

- Three consecutive missed payments triggers default risk
- Late fee applied after grace period (if enabled)
- Broken promises increase risk score
- High-risk accounts flagged for immediate attention
- Promise follow-up task created automatically
- Risk score factors: balance, aging, history, promises
- Risk level affects collection priority
- Fulfilled promises improve account standing

---

## Dependencies

**Depends On:**
- Payment Plan Builder (payment schedules)
- Recurring Billing Engine (missed payments)
- Patient Account Management (account status)

**Required By:**
- Collection Workflows (risk-based routing)
- Collection Agency Integration (default criteria)
- Bad Debt Management (write-off candidates)

---

## Notes

- Implement AI-powered risk scoring model
- Track promise fulfillment rate by patient demographics
- Consider economic factors in risk assessment
- Alert staff to high-risk accounts on patient check-in
- Generate daily at-risk account report

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
