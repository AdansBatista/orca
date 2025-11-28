# Trend Analysis

> **Sub-Area**: [Analytics Dashboard](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Trend Analysis visualizes historical trends to identify patterns and anomalies in orthodontic practice performance. This function provides rolling trend charts, year-over-year comparisons, seasonal pattern identification, moving averages, growth rate calculations, and anomaly highlighting to support data-driven decision making.

---

## Core Requirements

- [ ] Display 12-month rolling trends for key metrics
- [ ] Enable year-over-year comparisons with variance calculations
- [ ] Identify seasonal patterns in orthodontic practice data
- [ ] Calculate and display moving averages (7-day, 30-day)
- [ ] Compute growth rates (month-over-month, year-over-year)
- [ ] Highlight anomalies that deviate significantly from trends
- [ ] Support custom date range analysis

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/analytics/trends/:metric` | `finance:view_analytics` | Get metric trend data |
| GET | `/api/analytics/trends/comparison` | `finance:view_analytics` | Period comparison |
| GET | `/api/analytics/trends/yoy` | `finance:view_analytics` | Year-over-year comparison |
| GET | `/api/analytics/trends/seasonal` | `finance:view_analytics` | Seasonal analysis |
| GET | `/api/analytics/trends/moving-average` | `finance:view_analytics` | Moving average data |
| GET | `/api/analytics/trends/anomalies` | `finance:view_analytics` | Detected anomalies |
| GET | `/api/analytics/trends/growth` | `finance:view_analytics` | Growth rate analysis |

---

## Data Model

```prisma
model TrendData {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Metric
  metricCode    String
  metricName    String

  // Period
  periodType    PeriodType
  periodDate    DateTime

  // Value
  value         Decimal
  movingAverage7  Decimal?
  movingAverage30 Decimal?

  // Comparisons
  previousPeriodValue Decimal?
  momChange     Decimal?   // Month-over-month
  momChangePercent Decimal?
  yoyValue      Decimal?   // Same period last year
  yoyChange     Decimal?
  yoyChangePercent Decimal?

  // Anomaly detection
  expectedValue Decimal?
  deviation     Decimal?
  isAnomaly     Boolean  @default(false)
  anomalySeverity AnomalySeverity?

  // Timestamps
  calculatedAt  DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, metricCode, periodType, periodDate])
  @@index([clinicId])
  @@index([metricCode])
  @@index([periodDate])
}

enum AnomalySeverity {
  LOW         // 1-2 std deviations
  MEDIUM      // 2-3 std deviations
  HIGH        // 3+ std deviations
}

model SeasonalPattern {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Pattern definition
  metricCode    String
  patternYear   Int

  // Monthly indices (1.0 = average)
  janIndex      Decimal @default(1.0)
  febIndex      Decimal @default(1.0)
  marIndex      Decimal @default(1.0)
  aprIndex      Decimal @default(1.0)
  mayIndex      Decimal @default(1.0)
  junIndex      Decimal @default(1.0)
  julIndex      Decimal @default(1.0)
  augIndex      Decimal @default(1.0)
  sepIndex      Decimal @default(1.0)
  octIndex      Decimal @default(1.0)
  novIndex      Decimal @default(1.0)
  decIndex      Decimal @default(1.0)

  // Pattern strength
  seasonalityStrength Decimal?

  // Timestamps
  calculatedAt  DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, metricCode, patternYear])
  @@index([clinicId])
  @@index([metricCode])
}
```

---

## Business Rules

- Trends require minimum 3 months of data for meaningful analysis
- Moving averages smooth daily volatility for trend identification
- Anomalies flagged when values exceed 2 standard deviations from expected
- Seasonal patterns calculated annually using previous 2-3 years of data
- Year-over-year comparisons adjust for business day differences
- Growth rates calculated using compound formulas for accuracy
- Custom date ranges must be at least 7 days for trend analysis

---

## Dependencies

**Depends On:**
- KPI Dashboard (metric values)
- Revenue Tracking (financial data)
- Practice Orchestration (operational data)

**Required By:**
- Predictive Analytics (historical patterns)
- Executive Reporting
- Budgeting and Planning

---

## Notes

**Trend Visualizations:**
| Visualization | Metrics | Insight |
|---------------|---------|---------|
| Production Trend | Daily/Weekly/Monthly production | Growth trajectory |
| Collections Trend | Collections over time | Cash flow patterns |
| Seasonal Chart | Month-over-month by year | Seasonal patterns |
| YoY Comparison | This year vs last year | Year-over-year growth |
| Rolling Average | Smoothed production/collections | Trend direction |

**Orthodontic Seasonal Patterns:**
```
Typical Orthodontic Seasonal Pattern:

Peak Periods:
- Back-to-School (August-September): High new starts, index 1.2-1.4
- Summer (June-July): High new starts, adjustments, index 1.1-1.3
- Holiday (December): Lower activity, index 0.7-0.8

Slower Periods:
- Post-New Year (January-February): Recovery, index 0.9-1.0
- Spring Break (March-April): Moderate, index 1.0
- Fall Holidays (November): Lower, index 0.8-0.9
```

**Anomaly Examples:**
- Sudden production drop (staff absence, equipment issue)
- Unexpected collection spike (insurance bulk payment)
- New patient surge (marketing campaign success)
- No-show rate increase (scheduling issues)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
