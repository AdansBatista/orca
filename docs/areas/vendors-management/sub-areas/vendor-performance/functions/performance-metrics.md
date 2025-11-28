# Performance Metrics

> **Sub-Area**: [Vendor Performance](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Performance Metrics automatically tracks and calculates vendor performance indicators from order and receiving data. This function provides objective measurements of vendor reliability including on-time delivery rates, order accuracy, fill rates, and response times. Metrics are calculated for configurable periods and compared against benchmarks to identify top performers and vendors needing improvement.

---

## Core Requirements

- [ ] Auto-calculate metrics from order and receipt transactions
- [ ] Support configurable metric definitions and thresholds
- [ ] Calculate metrics for multiple periods (monthly, quarterly, annual)
- [ ] Provide trend analysis and visualization
- [ ] Set threshold alerts for underperforming metrics
- [ ] Compare vendor metrics to category benchmarks
- [ ] Support category-specific metric definitions
- [ ] Generate metric reports and exports
- [ ] Dashboard view of key vendor metrics
- [ ] Trigger recalculation on-demand or scheduled

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/vendors/:id/metrics` | `performance:read` | Get vendor metrics |
| GET | `/api/vendors/:id/metrics/summary` | `performance:read` | Get metrics summary |
| GET | `/api/vendors/:id/metrics/trends` | `performance:read` | Get metric trends |
| POST | `/api/vendors/:id/metrics/calculate` | `performance:update` | Recalculate metrics |
| GET | `/api/vendors/metrics/comparison` | `performance:view_all` | Compare vendor metrics |
| GET | `/api/vendors/metrics/benchmarks` | `performance:read` | Get category benchmarks |
| GET | `/api/vendors/metrics/alerts` | `performance:read` | Metric threshold alerts |

---

## Data Model

```prisma
model VendorMetric {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  vendorId      String   @db.ObjectId

  // Period
  periodType    MetricPeriod
  periodStart   DateTime
  periodEnd     DateTime

  // Order Metrics
  totalOrders   Int      @default(0)
  totalLineItems Int     @default(0)
  totalSpend    Decimal  @default(0)

  // Delivery Metrics
  onTimeDeliveries Int   @default(0)
  lateDeliveries Int     @default(0)
  avgLeadTimeDays Decimal?

  // Quality Metrics
  itemsReceived Int      @default(0)
  itemsAccepted Int      @default(0)
  itemsRejected Int      @default(0)
  qualityIssues Int      @default(0)

  // Accuracy Metrics
  correctOrders Int      @default(0)
  incorrectOrders Int    @default(0)
  backOrders    Int      @default(0)

  // Returns
  itemsReturned Int      @default(0)
  returnCredits Decimal  @default(0)

  // Issues
  issuesOpened  Int      @default(0)
  issuesClosed  Int      @default(0)
  avgResolutionDays Decimal?

  // Calculated Rates
  onTimeRate    Decimal?
  accuracyRate  Decimal?
  defectRate    Decimal?
  returnRate    Decimal?
  fillRate      Decimal?

  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([clinicId, vendorId, periodType, periodStart])
  @@index([clinicId])
  @@index([vendorId])
  @@index([periodStart])
}

enum MetricPeriod {
  WEEKLY
  MONTHLY
  QUARTERLY
  ANNUAL
}
```

---

## Business Rules

- Metrics auto-calculated daily, summarized weekly/monthly
- On-Time Rate: (On-time deliveries / Total deliveries) × 100
- Accuracy Rate: (Correct orders / Total orders) × 100
- Defect Rate: (Rejected items / Received items) × 100
- Fill Rate: (Items shipped / Items ordered) × 100
- Return Rate: (Items returned / Items ordered) × 100
- Threshold targets: On-time >95%, Accuracy >99%, Defect <1%
- Metrics below threshold trigger alerts
- Category benchmarks based on vendor type
- Historical metrics retained for trend analysis

---

## Dependencies

**Depends On:**
- Order Management (order data)
- Receiving (receipt data)
- Issue Tracking (issue counts)

**Required By:**
- Vendor Ratings (rating calculations)
- Quality Tracking (quality metrics)
- Delivery Tracking (delivery metrics)

---

## Notes

- Background job for daily metric calculation
- Manual recalculation for corrections
- Metric definitions configurable by practice
- Industry benchmarks for comparison
- Metric export for external analysis
- Seasonal adjustment considerations

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
