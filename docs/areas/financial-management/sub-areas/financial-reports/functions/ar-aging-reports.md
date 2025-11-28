# AR Aging Reports

> **Sub-Area**: [Financial Reports](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

AR Aging Reports provides specialized accounts receivable aging for orthodontic practices. This function separates patient AR from insurance AR, tracks payment plan receivables (current vs delinquent), categorizes AR by treatment status, calculates expected collections, and provides the detailed analysis needed to prioritize collection efforts effectively.

---

## Core Requirements

- [ ] Generate standard aging buckets (Current, 30, 60, 90, 120+ days)
- [ ] Separate patient AR from insurance AR with distinct aging
- [ ] Track payment plan AR with delinquency status
- [ ] Categorize AR by responsible party (patient, insurance, guarantor)
- [ ] Filter AR by treatment status (active, completed, transferred)
- [ ] Calculate expected collections based on aging and type
- [ ] Compute AR days metric with trending
- [ ] Provide detail and summary views with drill-down

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/finance/reports/ar-aging` | `finance:view_reports` | AR aging summary |
| GET | `/api/finance/reports/ar-aging/detail` | `finance:view_reports` | Detail by account |
| GET | `/api/finance/reports/ar-aging/by-type` | `finance:view_reports` | Patient vs insurance |
| GET | `/api/finance/reports/ar-aging/by-provider` | `finance:view_reports` | AR by provider |
| GET | `/api/finance/reports/ar-aging/by-treatment-status` | `finance:view_reports` | AR by treatment status |
| GET | `/api/finance/reports/ar-aging/payment-plans` | `finance:view_reports` | Payment plan AR |
| GET | `/api/finance/reports/ar-aging/trend` | `finance:view_reports` | AR aging trend |
| POST | `/api/finance/reports/ar-aging/export` | `finance:export` | Export to PDF/Excel |

---

## Data Model

```prisma
model ARSnapshot {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Snapshot date
  snapshotDate  DateTime

  // Totals
  totalAR       Decimal
  patientAR     Decimal
  insuranceAR   Decimal
  paymentPlanAR Decimal

  // Aging buckets - Patient
  patientCurrent  Decimal @default(0)
  patient30       Decimal @default(0)
  patient60       Decimal @default(0)
  patient90       Decimal @default(0)
  patient120Plus  Decimal @default(0)

  // Aging buckets - Insurance
  insuranceCurrent Decimal @default(0)
  insurance30     Decimal @default(0)
  insurance60     Decimal @default(0)
  insurance90     Decimal @default(0)
  insurance120Plus Decimal @default(0)

  // Payment Plan Status
  paymentPlanCurrent   Decimal @default(0)
  paymentPlanDelinquent Decimal @default(0)

  // By treatment status
  arActiveTreatment    Decimal @default(0)
  arCompletedTreatment Decimal @default(0)
  arTransferredCases   Decimal @default(0)

  // Metrics
  arDays        Decimal?
  allowanceForDoubtful Decimal @default(0)
  netAR         Decimal

  // Expected collections
  expectedCollections30 Decimal?
  expectedCollections60 Decimal?
  expectedCollections90 Decimal?

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, snapshotDate])
  @@index([clinicId])
  @@index([snapshotDate])
}

model ARDetail {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  snapshotDate  DateTime

  // Account
  patientId     String   @db.ObjectId
  guarantorId   String?  @db.ObjectId
  accountType   ARAccountType
  treatmentStatus TreatmentARStatus

  // Balance
  totalBalance  Decimal
  currentBalance Decimal @default(0)
  balance30     Decimal @default(0)
  balance60     Decimal @default(0)
  balance90     Decimal @default(0)
  balance120Plus Decimal @default(0)

  // Oldest item
  oldestDate    DateTime
  agingDays     Int

  // Payment plan info (if applicable)
  paymentPlanId String?  @db.ObjectId
  isDelinquent  Boolean  @default(false)
  missedPayments Int     @default(0)

  // Provider
  providerId    String?  @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([snapshotDate])
  @@index([accountType])
  @@index([agingDays])
}

enum ARAccountType {
  PATIENT
  INSURANCE
  PAYMENT_PLAN
  GUARANTOR
}

enum TreatmentARStatus {
  ACTIVE
  COMPLETED
  TRANSFERRED
  DISCONTINUED
}
```

---

## Business Rules

- Insurance AR typically collected within 30-45 days of clean claim
- Payment plan AR current if all scheduled payments received
- Delinquent = 2+ missed payment plan payments
- Completed treatment AR requires different collection approach
- Transferred cases may have remaining AR to collect
- AR days = (Average AR / Daily Collections) × Days
- Expected collections calculated using historical collection rates by aging bucket
- Daily AR snapshots captured for trending

---

## Dependencies

**Depends On:**
- Billing & Insurance (patient/insurance balances)
- Payment Processing (payment plan data)
- Treatment Management (treatment status)

**Required By:**
- Collections Management (prioritization)
- Financial Reports (balance sheet AR)
- Cash Flow Forecasting

---

## Notes

**Orthodontic AR Characteristics:**
| AR Type | Characteristics | Collection Approach |
|---------|-----------------|---------------------|
| Insurance | Predictable timing, high rate | Claim follow-up, appeals |
| Payment Plan - Current | Monthly, reliable | Maintain auto-pay |
| Payment Plan - Delinquent | Risk of default | Immediate outreach |
| Patient Balance | Variable timing | Statement, collection calls |
| Completed Treatment | Higher risk | Priority collection |
| Transferred | Special handling | Coordinate with new provider |

**AR Aging Report Views:**
- Summary by aging bucket
- Detail by patient/guarantor
- By treatment status
- By insurance vs patient
- By provider
- By location

**AR Days Benchmark:** <45 days is healthy for orthodontics

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
