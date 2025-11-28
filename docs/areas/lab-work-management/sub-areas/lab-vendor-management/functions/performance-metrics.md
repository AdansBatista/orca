# Performance Metrics

> **Sub-Area**: [Lab Vendor Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Performance Metrics tracks and analyzes lab vendor performance including turnaround times, on-time delivery rates, remake rates, and quality scores. This data supports informed vendor selection and enables performance-based conversations with lab partners.

---

## Core Requirements

- [ ] Calculate average turnaround time by product
- [ ] Track on-time delivery percentage
- [ ] Monitor remake/adjustment rate
- [ ] Compute composite quality scores
- [ ] Analyze trends over time periods
- [ ] Compare performance across vendors
- [ ] Generate vendor scorecards
- [ ] Alert on declining performance

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/lab/vendors/:id/metrics` | `lab:manage_vendors` | Get vendor metrics |
| GET | `/api/lab/metrics/comparison` | `lab:manage_vendors` | Compare vendors |
| GET | `/api/lab/metrics/trends` | `lab:manage_vendors` | Performance trends |
| POST | `/api/lab/metrics/calculate` | `lab:admin` | Recalculate metrics |
| GET | `/api/lab/vendors/:id/scorecard` | `lab:manage_vendors` | Vendor scorecard |

---

## Data Model

```prisma
model LabVendorMetrics {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  periodType    MetricPeriod  // MONTHLY, QUARTERLY, ANNUAL
  periodStart   DateTime
  periodEnd     DateTime

  totalOrders   Int      @default(0)
  totalItems    Int      @default(0)
  totalSpend    Decimal  @default(0)

  avgTurnaroundDays Float?
  onTimeCount   Int      @default(0)
  lateCount     Int      @default(0)
  onTimeRate    Float?

  remakeCount   Int      @default(0)
  remakeRate    Float?
  qualityScore  Float?

  calculatedAt  DateTime @default(now())

  @@index([clinicId])
  @@index([vendorId])
  @@index([periodStart])
}
```

---

## Business Rules

- Metrics calculated nightly for previous period
- On-demand recalculation available for admins
- Quality score is weighted composite of multiple factors
- Historical metrics preserved for trend analysis
- Performance alerts configurable per vendor

---

## Dependencies

**Depends On:**
- Lab Directory Management (vendor context)
- Order Tracking (delivery data)
- Quality & Remakes (quality data)

**Required By:**
- Lab Preference Rules (performance-based routing)
- Contract Management (SLA compliance)

---

## Notes

- Target metrics: >95% on-time, <3% remake rate
- Consider product-specific metrics
- Support custom reporting periods

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
