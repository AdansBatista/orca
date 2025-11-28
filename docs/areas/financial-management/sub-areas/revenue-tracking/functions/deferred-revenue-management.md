# Deferred Revenue Management

> **Sub-Area**: [Revenue Tracking](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Deferred Revenue Management tracks unearned revenue from treatment contracts and manages recognition schedules for GAAP/IFRS compliance. This function is essential for orthodontic practices where treatment contracts span 18-24+ months, requiring careful revenue recognition that matches revenue to the treatment delivery period rather than payment timing.

---

## Core Requirements

- [ ] Track deferred revenue balance per treatment contract
- [ ] Generate revenue recognition schedules for each active treatment
- [ ] Produce monthly deferred revenue reports for financial statements
- [ ] Compare contract value vs recognized revenue for compliance
- [ ] Track deferred revenue aging by treatment start date
- [ ] Handle early termination with proper revenue acceleration
- [ ] Support GAAP/IFRS compliant recognition methods

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/deferred-revenue` | `finance:view_revenue` | Get deferred revenue summary |
| GET | `/api/finance/deferred-revenue/:id` | `finance:view_revenue` | Get specific contract deferred revenue |
| GET | `/api/finance/deferred-revenue/by-patient/:patientId` | `finance:view_revenue` | Get patient's deferred revenue |
| POST | `/api/finance/deferred-revenue/recognize` | `finance:close_period` | Run monthly recognition |
| POST | `/api/finance/deferred-revenue/:id/terminate` | `finance:adjust` | Terminate contract early |
| POST | `/api/finance/deferred-revenue/:id/transfer` | `finance:adjust` | Transfer to another provider |
| GET | `/api/finance/deferred-revenue/report` | `finance:view_reports` | Deferred revenue report |

---

## Data Model

```prisma
model DeferredRevenue {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  treatmentPlanId String @db.ObjectId

  // Contract details
  contractValue     Decimal
  contractStartDate DateTime
  contractEndDate   DateTime
  treatmentMonths   Int

  // Recognition
  recognitionMethod RevenueRecognitionMethod @default(STRAIGHT_LINE)
  monthlyAmount     Decimal

  // Balances
  totalRecognized   Decimal @default(0)
  deferredBalance   Decimal

  // Collection tracking
  totalCollected    Decimal @default(0)
  collectedBalance  Decimal

  // Status
  status            DeferredRevenueStatus @default(ACTIVE)
  terminatedAt      DateTime?
  terminationReason String?
  transferredToId   String?  @db.ObjectId

  // Timestamps & Audit
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  createdBy     String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])
  schedule      RevenueSchedule[]

  @@index([clinicId])
  @@index([patientId])
  @@index([treatmentPlanId])
  @@index([status])
}

enum RevenueRecognitionMethod {
  STRAIGHT_LINE      // Equal monthly recognition
  MILESTONE_BASED    // Recognition at treatment milestones
  PERCENT_COMPLETE   // Based on treatment progress percentage
  CASH_BASIS         // Recognize when collected (not GAAP)
}

enum DeferredRevenueStatus {
  ACTIVE
  COMPLETED
  TERMINATED
  TRANSFERRED
}
```

---

## Business Rules

- Revenue recognition runs monthly on the last day of the month
- Cannot recognize more revenue than the contracted amount
- Remaining deferred revenue recognized immediately at termination
- Transferred cases retain deferred revenue balance
- Monthly recognition amount = Contract Value ÷ Treatment Months
- Deferred revenue appears as liability on balance sheet
- Recognition method must be consistent within a clinic for compliance

---

## Dependencies

**Depends On:**
- Treatment Management (treatment plans, contract values)
- Billing & Insurance (payment collections)

**Required By:**
- Financial Reports (balance sheet, P&L)
- Revenue Recognition Scheduling
- Month-End Close Process
- Tax Preparation

---

## Notes

**Example Orthodontic Revenue Recognition:**
```
Treatment Contract: $6,000
Treatment Duration: 24 months
Monthly Recognition: $250

Month 1:
  - Collected: $1,500 down payment
  - Recognized: $250 (1/24 of treatment)
  - Deferred: $1,250 (collected but not yet earned)

Month 2:
  - Collected: $195 (payment plan)
  - Recognized: $250
  - Deferred: $1,195 (decreasing as treatment progresses)
```

This pattern continues until treatment completion when all revenue is recognized.

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
