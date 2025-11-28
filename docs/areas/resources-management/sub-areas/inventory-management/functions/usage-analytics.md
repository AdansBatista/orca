# Usage Analytics

> **Sub-Area**: [Inventory Management](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Usage Analytics analyzes supply consumption patterns to optimize inventory levels, identify trends, and control costs. The system tracks usage by provider, procedure type, and patient, calculates consumption rates, detects anomalies, and projects future needs. This data-driven approach helps practices reduce waste, prevent stockouts, and understand true treatment costs.

---

## Core Requirements

- [ ] Track usage by provider, procedure type, and patient
- [ ] Calculate average daily/weekly/monthly consumption
- [ ] Identify usage trends and seasonality
- [ ] Compare usage across locations
- [ ] Detect unusual usage patterns (potential waste, theft)
- [ ] Project future inventory needs
- [ ] Generate cost analysis reports
- [ ] Calculate cost per patient/treatment
- [ ] Compare actual vs. expected usage
- [ ] Identify high-cost and high-volume items

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/resources/inventory/analytics/usage` | `inventory:read` | Usage analytics |
| GET | `/api/resources/inventory/analytics/by-provider` | `inventory:read` | Usage by provider |
| GET | `/api/resources/inventory/analytics/by-procedure` | `inventory:read` | Usage by procedure |
| GET | `/api/resources/inventory/analytics/trends` | `inventory:read` | Usage trends |
| GET | `/api/resources/inventory/analytics/cost` | `inventory:read` | Cost analysis |
| GET | `/api/resources/inventory/analytics/waste` | `inventory:read` | Waste report |
| GET | `/api/resources/inventory/analytics/forecast` | `inventory:read` | Demand forecast |

---

## Data Model

```prisma
// Usage analytics derived from StockMovement
// This is primarily computed/aggregated data

model UsageAnalyticsSummary {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  itemId          String   @db.ObjectId

  // Period
  period          String   // YYYY-MM format
  periodType      PeriodType

  // Usage metrics
  totalQuantity   Int
  totalValue      Decimal

  // Breakdowns (JSON for flexibility)
  byProvider      Json?    // { providerId: quantity }
  byProcedure     Json?    // { procedureType: quantity }
  byDayOfWeek     Json?    // { day: quantity }

  // Calculations
  averageDailyUsage Decimal?
  variance        Decimal? // vs. previous period
  variancePercent Decimal?

  // Timestamps
  calculatedAt    DateTime @default(now())

  // Relations
  clinic    Clinic        @relation(fields: [clinicId], references: [id])
  item      InventoryItem @relation(fields: [itemId], references: [id])

  @@unique([clinicId, itemId, period, periodType])
  @@index([clinicId])
  @@index([itemId])
  @@index([period])
}

enum PeriodType {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}

model WasteRecord {
  id              String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String   @db.ObjectId
  itemId          String   @db.ObjectId
  lotId           String?  @db.ObjectId

  // Waste details
  wasteType       WasteType
  wasteDate       DateTime @default(now())
  quantity        Int
  unitCost        Decimal
  totalValue      Decimal

  // Context
  reason          String?
  notes           String?

  // Timestamps & Audit
  createdAt DateTime @default(now())
  createdBy String   @db.ObjectId

  // Relations
  clinic    Clinic        @relation(fields: [clinicId], references: [id])
  item      InventoryItem @relation(fields: [itemId], references: [id])

  @@index([clinicId])
  @@index([itemId])
  @@index([wasteType])
  @@index([wasteDate])
}

enum WasteType {
  EXPIRED
  DAMAGED
  LOST
  RECALLED
  CONTAMINATED
  OTHER
}
```

---

## Business Rules

- Usage data aggregated nightly for reporting efficiency
- Provider usage comparisons should account for patient volume
- Anomaly detection flags usage >2 standard deviations from norm
- Cost per patient calculated as: total supply cost / number of patients
- Waste rate = waste value / total usage value × 100
- Forecast uses weighted moving average with trend adjustment
- Sensitive data (provider comparisons) restricted to admin roles

---

## Dependencies

**Depends On:**
- Stock Tracking (usage movement records)
- Supplies Catalog (item costs)
- Patient Records (patient-linked usage)
- Treatment Management (procedure-linked usage)
- Auth & Authorization (user authentication, permissions)

**Required By:**
- Reorder Automation (usage forecasts)
- Financial Management (cost analysis)
- Practice Optimization (efficiency insights)

---

## Notes

- Dashboard visualizations: charts, graphs, trend lines
- Drill-down capability from summary to detail
- Comparison periods: month-over-month, year-over-year
- Benchmark data could compare to industry averages
- Export functionality for external analysis
- AI/ML could enhance forecasting accuracy over time
- Consider real-time usage tracking for immediate visibility

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
