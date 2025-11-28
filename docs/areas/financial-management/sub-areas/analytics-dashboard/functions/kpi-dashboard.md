# KPI Dashboard

> **Sub-Area**: [Analytics Dashboard](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

KPI Dashboard displays real-time key performance indicators with configurable widgets for orthodontic practices. This function provides at-a-glance visibility into practice health through financial, operational, patient, and clinical metrics with goal tracking, threshold alerting, trend visualization, and role-based dashboards.

---

## Core Requirements

- [ ] Display configurable KPI widgets with real-time data updates
- [ ] Support goal setting and progress tracking for each metric
- [ ] Implement threshold alerting when KPIs fall above/below targets
- [ ] Include trend mini-charts within KPI widgets
- [ ] Enable role-based widget visibility and permissions
- [ ] Provide mobile-responsive dashboard design
- [ ] Allow user customization of dashboard layout

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/analytics/kpis` | `finance:view_analytics` | Get all current KPIs |
| GET | `/api/analytics/kpis/:code` | `finance:view_analytics` | Get specific KPI details |
| GET | `/api/analytics/kpis/:code/history` | `finance:view_analytics` | Get KPI history |
| PUT | `/api/analytics/kpis/:code/config` | `finance:view_analytics` | Update KPI configuration |
| PUT | `/api/analytics/kpis/:code/goal` | `finance:view_analytics` | Set KPI goal |
| GET | `/api/analytics/dashboard` | `finance:view_analytics` | Get user's dashboard config |
| PUT | `/api/analytics/dashboard` | `finance:view_analytics` | Update dashboard layout |
| GET | `/api/analytics/alerts/active` | `finance:view_analytics` | Get active KPI alerts |

---

## Data Model

```prisma
model KPIConfiguration {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // KPI definition
  kpiCode       String
  kpiName       String
  description   String?
  category      KPICategory

  // Display
  displayOrder  Int      @default(0)
  isVisible     Boolean  @default(true)
  widgetSize    WidgetSize @default(SMALL)
  chartType     ChartType?

  // Goals and thresholds
  goal          Decimal?
  goalType      GoalType?
  warningThreshold Decimal?
  criticalThreshold Decimal?
  thresholdDirection ThresholdDirection @default(ABOVE_IS_GOOD)

  // Comparison
  compareToLastPeriod Boolean @default(true)
  compareToGoal Boolean @default(true)

  // Access
  visibleToRoles String[]

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, kpiCode])
  @@index([clinicId])
  @@index([category])
}

enum KPICategory {
  FINANCIAL
  OPERATIONAL
  PATIENT
  CLINICAL
  MARKETING
}

enum WidgetSize {
  SMALL
  MEDIUM
  LARGE
  FULL_WIDTH
}

enum ChartType {
  SPARKLINE
  BAR
  GAUGE
  TREND
  NONE
}

enum GoalType {
  TARGET      // Exact target
  MINIMUM     // At least this much
  MAXIMUM     // No more than this
}

enum ThresholdDirection {
  ABOVE_IS_GOOD
  BELOW_IS_GOOD
}

model KPIValue {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  kpiCode       String

  // Value
  value         Decimal
  periodType    PeriodType
  periodDate    DateTime

  // Context
  locationId    String?  @db.ObjectId
  providerId    String?  @db.ObjectId

  // Comparison
  previousValue Decimal?
  changeAmount  Decimal?
  changePercent Decimal?
  goalValue     Decimal?
  goalVariance  Decimal?

  // Status
  status        KPIStatus @default(NORMAL)

  // Timestamps
  calculatedAt  DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, kpiCode, periodType, periodDate, locationId, providerId])
  @@index([clinicId])
  @@index([kpiCode])
  @@index([periodDate])
}

enum KPIStatus {
  EXCELLENT
  GOOD
  NORMAL
  WARNING
  CRITICAL
}
```

---

## Business Rules

- KPI values refresh every 5 minutes during business hours
- Daily snapshots captured at midnight for historical trending
- Alert thresholds trigger notifications to configured recipients
- Provider-level KPIs respect provider's own data visibility settings
- Goals can only be set/modified at period start (month, quarter, year)
- Role-based visibility controls which KPIs each user sees
- Widget positions persist per-user across sessions

---

## Dependencies

**Depends On:**
- Revenue Tracking (production, collections)
- Expense Management (overhead, costs)
- Practice Orchestration (operational metrics)
- Patient Communications (patient metrics)

**Required By:**
- Alert System
- Executive Reporting
- Goal Tracking

---

## Notes

**Financial KPIs:**
| KPI | Description | Benchmark | Alert |
|-----|-------------|-----------|-------|
| Production (Gross) | Total production value | - | Below goal |
| Production (Net) | Production minus adjustments | - | Below goal |
| Collections | Payments received | - | Below goal |
| Collection Rate | Collections ÷ Net Production | 98%+ | <95% |
| Overhead Ratio | Operating Expenses ÷ Collections | 55-65% | >70% |
| Profit Margin | Net Income ÷ Collections | 35-45% | <30% |

**Operational KPIs:**
| KPI | Description | Benchmark | Alert |
|-----|-------------|-----------|-------|
| New Patient Exams | New patients seen | - | Below goal |
| Case Acceptance Rate | Starts ÷ Exams | 85%+ | <75% |
| Treatment Starts | New treatments started | - | Below goal |
| Average Case Value | Mean contract value | $5,500+ | Declining |
| Chair Utilization | Chairs used ÷ Available | 85%+ | <75% |

**Patient KPIs:**
| KPI | Description | Benchmark | Alert |
|-----|-------------|-----------|-------|
| No-Show Rate | No-shows ÷ Scheduled | <5% | >8% |
| Recall Completion | Recall compliance | 85%+ | <75% |
| Patient Satisfaction | Survey score | 90%+ | <85% |
| Net Promoter Score | NPS | 50+ | <30 |

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
