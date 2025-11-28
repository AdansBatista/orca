# Predictive Analytics

> **Sub-Area**: [Analytics Dashboard](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Predictive Analytics provides AI-powered forecasting and prediction for orthodontic practice business planning. This function forecasts revenue and collections, predicts patient volume, adjusts for seasonal patterns, enables what-if scenario modeling, generates early warning indicators, and calculates confidence intervals for all predictions.

---

## Core Requirements

- [ ] Forecast revenue for 30/60/90 day periods
- [ ] Predict collections based on AR and payment patterns
- [ ] Forecast patient volume and new starts
- [ ] Apply seasonal adjustments to all forecasts
- [ ] Enable what-if scenario modeling for decision support
- [ ] Generate early warning indicators for potential issues
- [ ] Calculate confidence intervals for predictions

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/analytics/forecasts` | `finance:view_analytics` | Get all active forecasts |
| GET | `/api/analytics/forecasts/:metric` | `finance:view_analytics` | Specific metric forecast |
| GET | `/api/analytics/forecasts/revenue` | `finance:view_analytics` | Revenue forecast |
| GET | `/api/analytics/forecasts/collections` | `finance:view_analytics` | Collections forecast |
| GET | `/api/analytics/forecasts/patients` | `finance:view_analytics` | Patient volume forecast |
| POST | `/api/analytics/forecasts/scenario` | `finance:view_analytics` | What-if scenario |
| GET | `/api/analytics/warnings` | `finance:view_analytics` | Early warning indicators |
| GET | `/api/analytics/forecasts/accuracy` | `finance:view_analytics` | Forecast accuracy report |

---

## Data Model

```prisma
model Forecast {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Forecast definition
  forecastType  ForecastType
  metricCode    String
  metricName    String

  // Period
  forecastDate  DateTime  // When forecast was made
  startDate     DateTime  // Start of forecast period
  endDate       DateTime  // End of forecast period
  periodType    PeriodType

  // Predictions
  predictedValue Decimal
  lowerBound    Decimal?  // Lower confidence bound
  upperBound    Decimal?  // Upper confidence bound
  confidence    Decimal?  // Confidence level (0-1)

  // Seasonal adjustment
  seasonalFactor Decimal?
  trendComponent Decimal?

  // Actual (filled in when known)
  actualValue   Decimal?
  variance      Decimal?
  variancePercent Decimal?
  accuracyScore Decimal?

  // Model info
  modelType     ForecastModel
  modelVersion  String
  inputsSnapshot Json?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([forecastType])
  @@index([forecastDate])
  @@index([startDate])
}

enum ForecastType {
  REVENUE
  PRODUCTION
  COLLECTIONS
  NEW_PATIENTS
  TREATMENT_STARTS
  CHAIR_UTILIZATION
  CASH_POSITION
}

enum ForecastModel {
  TIME_SERIES      // ARIMA, exponential smoothing
  PROPHET          // Facebook Prophet
  REGRESSION       // Linear/polynomial regression
  ENSEMBLE         // Multiple model combination
}

model EarlyWarning {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Warning definition
  warningType   WarningType
  indicatorCode String
  indicatorName String

  // Detection
  detectedAt    DateTime @default(now())
  triggerValue  Decimal
  thresholdValue Decimal
  severity      WarningSeverity

  // Context
  trend         TrendDirection
  periodStart   DateTime
  periodEnd     DateTime
  message       String
  recommendedActions String[]

  // Status
  status        WarningStatus @default(NEW)
  acknowledgedAt DateTime?
  acknowledgedBy String?  @db.ObjectId
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId
  resolutionNotes String?

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([warningType])
  @@index([status])
  @@index([detectedAt])
}

enum WarningType {
  DECLINING_STARTS
  RISING_AR
  OVERHEAD_CREEP
  CONVERSION_DROP
  PRODUCTION_GAP
  COLLECTION_LAG
  NO_SHOW_INCREASE
  SATISFACTION_DROP
}

enum WarningSeverity {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum TrendDirection {
  IMPROVING
  STABLE
  DECLINING
  VOLATILE
}

enum WarningStatus {
  NEW
  ACKNOWLEDGED
  INVESTIGATING
  RESOLVED
  DISMISSED
}

model Scenario {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Scenario definition
  name          String
  description   String?
  scenarioType  ScenarioType

  // Input parameters
  parameters    Json

  // Base values
  baseRevenue   Decimal
  baseExpenses  Decimal
  baseProfit    Decimal

  // Projected values
  projectedRevenue Decimal
  projectedExpenses Decimal
  projectedProfit Decimal

  // Impact analysis
  revenueImpact Decimal
  expenseImpact Decimal
  profitImpact  Decimal
  roiImpact     Decimal?

  // Confidence
  confidenceLevel Decimal?

  // Timestamps
  createdAt     DateTime @default(now())
  createdBy     String   @db.ObjectId

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([scenarioType])
}

enum ScenarioType {
  ADD_PROVIDER
  PRICE_CHANGE
  MARKETING_INCREASE
  MARKETING_DECREASE
  REDUCE_NO_SHOWS
  ADD_LOCATION
  NEW_SERVICE
  CUSTOM
}
```

---

## Business Rules

- Forecasts generated weekly with rolling 90-day horizon
- Actual values compared to forecasts monthly for accuracy tracking
- Early warnings trigger when indicators exceed thresholds for 3+ periods
- Seasonal factors calculated from historical patterns
- Confidence intervals widen for longer forecast horizons
- What-if scenarios preserved for comparison
- Model accuracy tracked and models retrained quarterly

---

## Dependencies

**Depends On:**
- Trend Analysis (historical patterns)
- KPI Dashboard (current metrics)
- All financial and operational data

**Required By:**
- Executive Planning
- Budgeting
- Strategic Decision Making

---

## Notes

**Forecasting Models:**
| Metric | Model | Inputs | Accuracy Target |
|--------|-------|--------|-----------------|
| Revenue | Time series + seasonal | Historical production, scheduled starts | ±5% |
| Collections | AR analysis + history | Outstanding AR, payment patterns | ±3% |
| New Patients | Trend + marketing | Lead pipeline, conversion rates | ±15% |
| Chair Utilization | Scheduling | Appointments, no-show history | ±5% |

**Early Warning Indicators:**
| Indicator | Warning Sign | Threshold | Action |
|-----------|--------------|-----------|--------|
| Declining Starts | 3+ months below trend | -15% | Review marketing, acceptance |
| Rising AR | AR days increasing | +10 days | Intensify collections |
| Overhead Creep | Overhead ratio rising | +5% | Review expenses |
| Conversion Drop | Acceptance rate falling | -10% | Training, pricing review |
| Production Gap | Prod-collection widening | +10% | AR investigation |

**What-If Scenarios:**
- "What if we add another provider?"
- "What if we raise prices 5%?"
- "What if we increase marketing 25%?"
- "What if no-shows drop to 3%?"
- "What if we open a second location?"

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
