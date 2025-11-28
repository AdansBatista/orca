# Recurring Billing Engine

> **Sub-Area**: [Payment Processing](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Recurring Billing Engine automatically processes scheduled payments for payment plans. This function runs scheduled charges against stored payment methods, handles failed payments with intelligent retry logic, sends pre-charge notifications to patients, and manages dunning (communication after failed payments). It ensures consistent cash flow from payment plans.

---

## Core Requirements

- [ ] Process scheduled automatic charges
- [ ] Send pre-charge notifications (configurable days before)
- [ ] Handle failed payments with retry logic
- [ ] Grace period management before marking late
- [ ] Support payment plan pause/resume
- [ ] Early payoff processing
- [ ] Dunning management (failed payment communications)
- [ ] Daily scheduled payment run

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/scheduled-payments` | `payment:read` | List scheduled payments |
| GET | `/api/scheduled-payments/upcoming` | `payment:read` | List upcoming charges |
| GET | `/api/scheduled-payments/failed` | `payment:read` | List failed payments |
| POST | `/api/scheduled-payments/:id/process` | `payment:process` | Process single payment |
| POST | `/api/scheduled-payments/:id/skip` | `payment:update` | Skip payment |
| POST | `/api/scheduled-payments/:id/retry` | `payment:process` | Manual retry |
| POST | `/api/scheduled-payments/run` | `payment:admin` | Trigger daily run |

---

## Data Model

```prisma
model ScheduledPayment {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  paymentPlanId   String   @db.ObjectId
  paymentMethodId String?  @db.ObjectId

  // Schedule
  scheduledDate   DateTime
  amount          Decimal

  // Status
  status          ScheduledPaymentStatus @default(PENDING)

  // Processing
  attemptCount    Int      @default(0)
  lastAttemptAt   DateTime?
  nextAttemptAt   DateTime?
  processedAt     DateTime?

  // Result
  resultPaymentId String?  @db.ObjectId
  failureReason   String?
  failureCode     String?
  declineCode     String?

  // Notifications
  reminderSentAt     DateTime?
  failureNotifiedAt  DateTime?
  finalNoticeAt      DateTime?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  clinic       Clinic      @relation(fields: [clinicId], references: [id])
  paymentPlan  PaymentPlan @relation(fields: [paymentPlanId], references: [id])

  @@index([clinicId])
  @@index([paymentPlanId])
  @@index([scheduledDate])
  @@index([status])
  @@index([nextAttemptAt])
}

model RecurringBillingRun {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Run details
  runDate       DateTime
  status        BillingRunStatus @default(PENDING)

  // Statistics
  totalScheduled    Int
  totalProcessed    Int      @default(0)
  totalSucceeded    Int      @default(0)
  totalFailed       Int      @default(0)
  totalSkipped      Int      @default(0)
  totalAmount       Decimal
  collectedAmount   Decimal  @default(0)

  // Timing
  startedAt     DateTime?
  completedAt   DateTime?
  durationMs    Int?

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([runDate])
  @@index([status])
}

enum ScheduledPaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  SKIPPED
  CANCELLED
}

enum BillingRunStatus {
  PENDING
  RUNNING
  COMPLETED
  FAILED
}
```

---

## Business Rules

- Daily billing run at configured time (default 6 AM clinic time)
- Pre-charge reminder sent 3 days before (configurable)
- Failed payment retry: 1 day, 3 days, 7 days
- Maximum 3 retry attempts before requiring manual intervention
- Grace period of 5 days before marking payment late
- Failed payment notification sent after first failure
- Final notice sent after all retries exhausted
- Paused plans skip scheduled payments
- Skipped payments don't count against plan completion

---

## Dependencies

**Depends On:**
- Payment Gateway Integration (charge processing)
- Payment Method Management (stored cards)
- Payment Plan Builder (payment schedules)
- Patient Communications (notifications)

**Required By:**
- Patient Billing (payment posting)
- Collections Management (late payment tracking)

---

## Notes

- Implement idempotency to prevent duplicate charges
- Run billing in background job with proper error handling
- Consider time zones for international clinics
- Track processing time for performance monitoring
- Generate daily billing summary report

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
