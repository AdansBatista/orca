# Revenue Recognition Scheduling

> **Sub-Area**: [Revenue Tracking](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Revenue Recognition Scheduling creates and manages automated revenue recognition schedules for treatment contracts. This function automatically generates recognition schedules from treatment plans, supports multiple recognition methods, handles modifications and early terminations, and integrates with financial reporting for GAAP/IFRS compliance.

---

## Core Requirements

- [ ] Automatically generate recognition schedules from new treatment plans
- [ ] Support multiple recognition methods (straight-line, milestone-based, percent-complete)
- [ ] Handle schedule modifications when treatment plans change
- [ ] Process early termination and transfer scenarios correctly
- [ ] Execute batch recognition processing monthly
- [ ] Maintain complete schedule audit trail for compliance
- [ ] Integrate with financial reporting for accurate P&L statements

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/revenue-schedules` | `finance:view_revenue` | List all active schedules |
| GET | `/api/finance/revenue-schedules/:id` | `finance:view_revenue` | Get specific schedule |
| POST | `/api/finance/revenue-schedules` | `finance:adjust` | Create manual schedule |
| PUT | `/api/finance/revenue-schedules/:id` | `finance:adjust` | Modify schedule |
| POST | `/api/finance/revenue-schedules/batch-recognize` | `finance:close_period` | Run batch recognition |
| GET | `/api/finance/revenue-schedules/pending` | `finance:view_revenue` | Get pending recognition |
| POST | `/api/finance/revenue-schedules/:id/accelerate` | `finance:adjust` | Accelerate for termination |

---

## Data Model

```prisma
model RevenueSchedule {
  id                String   @id @default(auto()) @map("_id") @db.ObjectId
  deferredRevenueId String   @db.ObjectId

  // Schedule details
  periodDate        DateTime
  periodNumber      Int

  // Amounts
  scheduledAmount   Decimal
  recognizedAmount  Decimal  @default(0)

  // Status
  status            ScheduleStatus @default(PENDING)
  recognizedAt      DateTime?
  recognizedBy      String?  @db.ObjectId

  // Adjustment tracking
  originalAmount    Decimal?
  adjustmentReason  String?
  adjustedAt        DateTime?
  adjustedBy        String?  @db.ObjectId

  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  // Relations
  deferredRevenue   DeferredRevenue @relation(fields: [deferredRevenueId], references: [id])

  @@index([deferredRevenueId])
  @@index([periodDate])
  @@index([status])
}

enum ScheduleStatus {
  PENDING
  RECOGNIZED
  ADJUSTED
  SKIPPED
  ACCELERATED
}

model RecognitionBatch {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Batch details
  batchDate     DateTime
  periodMonth   DateTime

  // Processing
  status        BatchStatus @default(PENDING)
  startedAt     DateTime?
  completedAt   DateTime?

  // Results
  schedulesProcessed Int @default(0)
  totalRecognized    Decimal @default(0)
  errors             Int @default(0)

  // Error details
  errorDetails  Json?

  // Audit
  processedBy   String?  @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([batchDate])
  @@index([status])
}

enum BatchStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  PARTIAL
}
```

---

## Business Rules

- Schedules auto-generate when treatment plans are accepted and contracts signed
- Recognition method set at clinic level for consistency
- Monthly batch runs on last day of month after business hours
- Modifications create adjustment entries; original amounts preserved for audit
- Early termination accelerates remaining schedule into current period
- Transferred cases maintain original schedule until transfer date
- Batch processing requires period to be open; cannot recognize into closed periods

---

## Dependencies

**Depends On:**
- Treatment Management (treatment plans, acceptance)
- Deferred Revenue Management (deferred revenue records)

**Required By:**
- Financial Reports (P&L revenue)
- Month-End Close Process
- Deferred Revenue Management

---

## Notes

**Recognition Methods:**

1. **Straight-Line** (Default): Equal monthly amounts over treatment duration
   - Contract Value: $6,000 / 24 months = $250/month

2. **Milestone-Based**: Recognition at treatment milestones
   - Start (bonding): 30%
   - Mid-treatment: 40%
   - Completion (debond): 30%

3. **Percent-Complete**: Based on treatment progress
   - Calculated from completed visits vs planned visits
   - More complex but matches revenue to actual delivery

Schedule modifications require supervisor approval and detailed audit logging.

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
