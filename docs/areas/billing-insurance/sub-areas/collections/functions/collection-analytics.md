# Collection Analytics

> **Sub-Area**: [Collections Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Collection Analytics analyzes collection performance and identifies trends. This function provides metrics on collection rates, AR days, workflow effectiveness, staff performance, and payer analysis. It enables data-driven decisions to optimize collection strategies and improve cash flow.

---

## Core Requirements

- [ ] Collection rate metrics (amount collected / amount owed)
- [ ] AR days calculation (DSO - Days Sales Outstanding)
- [ ] Aging trend analysis over time
- [ ] Collection effort ROI
- [ ] Staff performance metrics
- [ ] Payer analysis (slowest paying payers)
- [ ] Workflow stage effectiveness
- [ ] Predictive analytics for collection success

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/collections/analytics/summary` | `collections:read` | Collection summary |
| GET | `/api/collections/analytics/trends` | `collections:read` | AR trend analysis |
| GET | `/api/collections/analytics/dso` | `collections:read` | Days sales outstanding |
| GET | `/api/collections/analytics/effectiveness` | `collections:read` | Workflow effectiveness |
| GET | `/api/collections/analytics/staff` | `collections:read` | Staff performance |
| GET | `/api/collections/analytics/payer` | `collections:read` | Payer analysis |
| GET | `/api/collections/analytics/forecast` | `collections:read` | Collection forecast |
| GET | `/api/collections/analytics/export` | `collections:export` | Export analytics |

---

## Data Model

```prisma
// Analytics are computed from existing models
// Store periodic snapshots for trend analysis

model CollectionSnapshot {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Snapshot details
  snapshotDate  DateTime
  periodType    SnapshotPeriod

  // AR Summary
  totalAR           Decimal
  patientAR         Decimal
  insuranceAR       Decimal
  aging0            Decimal  // Current
  aging30           Decimal
  aging60           Decimal
  aging90           Decimal
  aging120Plus      Decimal

  // Collection metrics
  dso               Decimal  // Days Sales Outstanding
  collectionRate    Decimal  // % collected
  periodCollections Decimal  // Amount collected in period
  periodCharges     Decimal  // New charges in period
  periodAdjustments Decimal  // Write-offs and adjustments

  // Workflow metrics
  accountsInCollection Int
  accountsCompleted    Int
  avgDaysToCollect     Decimal?

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([snapshotDate])
  @@index([periodType])
}

model StaffCollectionMetric {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId

  // Period
  periodStart   DateTime
  periodEnd     DateTime

  // Activity metrics
  accountsWorked    Int
  callsMade         Int
  promisesRecorded  Int
  promisesFulfilled Int

  // Collection metrics
  amountCollected   Decimal
  accountsClosed    Int
  avgDaysToCollect  Decimal?

  // Timestamps
  createdAt DateTime @default(now())

  // Relations
  clinic    Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([userId])
  @@index([periodStart])
}

enum SnapshotPeriod {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}
```

---

## Business Rules

- DSO = (Average AR / Total Credit Sales) × Days in Period
- Collection rate = (Collections / Beginning AR + New Charges)
- Snapshots taken daily, aggregated to weekly/monthly
- Staff metrics include only assigned accounts
- Payer analysis excludes actively disputed claims
- Forecast based on historical patterns and current aging
- Trend alerts when metrics deviate significantly

---

## Dependencies

**Depends On:**
- Aging Reports (AR data)
- Collection Workflows (workflow metrics)
- Payment Processing (collection data)
- All Collections functions (activity data)

**Required By:**
- Dashboard (KPI widgets)
- Financial Reporting (collection metrics)
- Executive Reports (practice health)

---

## Notes

- Implement materialized views for performance
- Consider benchmarking against industry averages
- Build predictive model for collection probability
- Alert on negative trends before they worsen
- Support drill-down from metrics to accounts

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
