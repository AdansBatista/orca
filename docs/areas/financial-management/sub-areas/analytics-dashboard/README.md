# Analytics Dashboard

> **Area**: [Financial Management](../../)
>
> **Sub-Area**: 10.4 Analytics Dashboard
>
> **Purpose**: Real-time KPIs, trend analysis, benchmarking, and predictive analytics for orthodontic practice performance

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | High |
| **Complexity** | Large |
| **Parent Area** | [Financial Management](../../) |
| **Dependencies** | Revenue Tracking, Expense Management, CRM & Onboarding, Treatment Management |
| **Last Updated** | 2024-11-26 |

---

## Overview

The Analytics Dashboard provides comprehensive business intelligence for orthodontic practices. It transforms financial and operational data into actionable insights through real-time KPIs, historical trends, industry benchmarking, and AI-powered predictive analytics.

### Key Goals

- **Real-time visibility**: Instant access to key metrics
- **Trend identification**: Spot patterns and anomalies
- **Benchmarking**: Compare against industry standards
- **Predictive insights**: Forecast future performance
- **Decision support**: Data-driven business decisions

### Dashboard Hierarchy

| Level | Audience | Focus |
|-------|----------|-------|
| Executive | Owners, Partners | High-level KPIs, trends, ROI |
| Management | Clinic Admins | Operational metrics, staff performance |
| Operational | Billing, Front Desk | Daily targets, action items |
| Clinical | Providers | Production, case metrics |

---

## Functions

| # | Function | Description | Status | Priority |
|---|----------|-------------|--------|----------|
| 10.4.1 | [KPI Dashboard](./functions/kpi-dashboard.md) | Real-time key performance indicators | 📋 Planned | Critical |
| 10.4.2 | [Trend Analysis](./functions/trend-analysis.md) | Historical trend visualization | 📋 Planned | High |
| 10.4.3 | [Benchmarking](./functions/benchmarking.md) | Industry comparison and rankings | 📋 Planned | High |
| 10.4.4 | [New Patient ROI](./functions/new-patient-roi.md) | Marketing and conversion analytics | 📋 Planned | High |
| 10.4.5 | [Case Profitability](./functions/case-profitability.md) | Treatment-level profitability | 📋 Planned | Medium |
| 10.4.6 | [Predictive Analytics](./functions/predictive-analytics.md) | AI-powered forecasting | 📋 Planned | Medium |

---

## Function Details

### 10.4.1 KPI Dashboard

**Purpose**: Display real-time key performance indicators with configurable widgets.

**Key Capabilities**:
- Configurable KPI widgets
- Real-time data updates
- Goal setting and progress tracking
- Threshold alerting (above/below targets)
- Trend mini-charts in widgets
- Role-based visibility
- Mobile-responsive design

**Core KPI Categories**:

#### Financial KPIs
| KPI | Description | Benchmark | Alert Threshold |
|-----|-------------|-----------|-----------------|
| Production (Gross) | Total production value | - | Below goal |
| Production (Net) | Production minus adjustments | - | Below goal |
| Collections | Payments received | - | Below goal |
| Collection Rate | Collections ÷ Net Production | 98%+ | <95% |
| Overhead Ratio | Operating Expenses ÷ Collections | 55-65% | >70% |
| Profit Margin | Net Income ÷ Collections | 35-45% | <30% |

#### Operational KPIs
| KPI | Description | Benchmark | Alert Threshold |
|-----|-------------|-----------|-----------------|
| New Patient Exams | New patients seen | - | Below goal |
| Case Acceptance Rate | Starts ÷ Exams | 85%+ | <75% |
| Treatment Starts | New treatments started | - | Below goal |
| Average Case Value | Mean contract value | $5,500+ | Declining |
| Active Patients | Patients in treatment | - | - |
| Chair Utilization | Chairs used ÷ Available | 85%+ | <75% |

#### Patient KPIs
| KPI | Description | Benchmark | Alert Threshold |
|-----|-------------|-----------|-----------------|
| No-Show Rate | No-shows ÷ Scheduled | <5% | >8% |
| Recall Completion | Recall compliance | 85%+ | <75% |
| Patient Satisfaction | Survey score | 90%+ | <85% |
| Net Promoter Score | NPS | 50+ | <30 |

**User Stories**:
- As an **owner**, I want to see key metrics at a glance on my dashboard
- As a **clinic admin**, I want alerts when KPIs fall below thresholds
- As a **provider**, I want to see my personal production against goals

---

### 10.4.2 Trend Analysis

**Purpose**: Visualize historical trends to identify patterns and anomalies.

**Key Capabilities**:
- 12-month rolling trends
- Year-over-year comparisons
- Seasonal pattern identification
- Moving averages (7-day, 30-day)
- Growth rate calculations
- Anomaly highlighting
- Custom date range analysis

**Trend Visualizations**:
| Visualization | Metrics | Insight |
|---------------|---------|---------|
| Production Trend | Daily/Weekly/Monthly production | Growth trajectory |
| Collections Trend | Collections over time | Cash flow patterns |
| Seasonal Chart | Month-over-month by year | Seasonal patterns |
| YoY Comparison | This year vs last year | Year-over-year growth |
| Rolling Average | Smoothed production/collections | Trend direction |

**Seasonal Patterns in Orthodontics**:
```
Typical Orthodontic Seasonal Pattern:

Peak Periods:
- Back-to-School (August-September): High new starts
- Summer (June-July): High new starts, adjustments
- Holiday (December): Lower activity

Slower Periods:
- Post-New Year (January-February): Recovery from holidays
- Spring Break (March-April): Moderate activity
- Fall Holidays (November): Lower activity
```

**User Stories**:
- As an **owner**, I want to see 12-month production trends so I can identify growth
- As a **clinic admin**, I want seasonal comparison so I can plan staffing
- As an **analyst**, I want to identify anomalies so I can investigate root causes

---

### 10.4.3 Benchmarking

**Purpose**: Compare practice performance against industry standards and peers.

**Key Capabilities**:
- Industry benchmark database
- Practice-to-benchmark comparison
- Location-to-location comparison
- Provider-to-provider comparison
- Historical self-benchmarking
- Percentile rankings
- Improvement recommendations

**Benchmark Categories**:

#### Industry Benchmarks
| Metric | 25th %ile | 50th %ile | 75th %ile | Top 10% |
|--------|-----------|-----------|-----------|---------|
| Collection Rate | 93% | 96% | 98% | 99%+ |
| Overhead Ratio | 72% | 62% | 55% | <50% |
| Case Acceptance | 70% | 80% | 88% | 95%+ |
| Average Case Value | $4,500 | $5,500 | $6,500 | $7,500+ |
| Production/Chair/Day | $1,200 | $1,800 | $2,400 | $3,000+ |
| New Patients/Month | 12 | 20 | 32 | 50+ |

#### Internal Benchmarking
- Location vs Location (multi-site)
- Provider vs Provider
- This year vs Last year
- This month vs Same month last year
- Quarter vs Previous quarter

**User Stories**:
- As an **owner**, I want to know how my practice compares to industry benchmarks
- As a **consultant**, I want percentile rankings to identify improvement areas
- As a **clinic admin**, I want to compare locations to share best practices

---

### 10.4.4 New Patient ROI

**Purpose**: Track return on investment for new patient acquisition and marketing.

**Key Capabilities**:
- Marketing source ROI tracking
- Cost per lead by source
- Cost per start by source
- New patient lifetime value
- Referral source value analysis
- Conversion funnel metrics
- Marketing budget allocation insights

**Conversion Funnel**:
```
Marketing Spend → Leads → Exams → Starts → Revenue

Example:
Marketing: $5,000/month
Leads: 50 (Cost per lead: $100)
Exams: 25 (50% lead-to-exam)
Starts: 20 (80% acceptance)
Revenue: $110,000 (Avg $5,500/case)

ROI: ($110,000 - $5,000) ÷ $5,000 = 2,000%
```

**Source Analysis**:
| Source | Leads | Cost | CPL | Starts | CPA | LTV |
|--------|-------|------|-----|--------|-----|-----|
| Google Ads | 25 | $2,000 | $80 | 8 | $250 | $5,500 |
| Facebook | 15 | $1,500 | $100 | 5 | $300 | $5,200 |
| Referral | 30 | $500 | $17 | 15 | $33 | $6,000 |
| Walk-in | 10 | $0 | $0 | 4 | $0 | $5,000 |

**User Stories**:
- As a **marketing manager**, I want ROI by source so I can allocate budget
- As an **owner**, I want cost per acquisition so I can evaluate marketing spend
- As a **clinic admin**, I want referral source analysis so I can nurture relationships

---

### 10.4.5 Case Profitability

**Purpose**: Analyze profitability at the treatment case level.

**Key Capabilities**:
- Case-level profitability calculation
- Profitability by treatment type
- Profitability by insurance plan
- Chair time cost allocation
- Supply and lab cost per case
- Break-even analysis
- Margin optimization insights

**Case Profitability Model**:
```
Case Revenue: $5,500

Direct Costs:
  - Lab Fees: $800 (aligners)
  - Supplies: $150
  - Chair Time Cost: $600 (12 visits × $50/visit)
  Total Direct: $1,550

Contribution Margin: $3,950 (72%)

Allocated Overhead:
  - Based on chair time share
  Total Overhead: $1,200

Net Profit: $2,750 (50% margin)
```

**Profitability by Treatment Type**:
| Treatment | Avg Revenue | Avg Cost | Margin | Visits |
|-----------|-------------|----------|--------|--------|
| Metal Braces | $5,200 | $1,800 | 65% | 24 |
| Ceramic Braces | $5,800 | $2,100 | 64% | 24 |
| Clear Aligners | $5,500 | $2,400 | 56% | 18 |
| Limited Treatment | $2,500 | $800 | 68% | 8 |
| Retainer Only | $500 | $150 | 70% | 2 |

**User Stories**:
- As a **provider**, I want case profitability so I can make treatment recommendations
- As an **owner**, I want profitability by treatment type so I can focus growth
- As a **clinic admin**, I want insurance plan profitability so I can evaluate contracts

---

### 10.4.6 Predictive Analytics

**Purpose**: AI-powered forecasting and prediction for business planning.

**Key Capabilities**:
- Revenue forecasting (30/60/90 days)
- Collection prediction
- Patient volume forecasting
- Seasonal adjustment
- What-if scenario modeling
- Early warning indicators
- Confidence intervals

**Forecasting Models**:
| Metric | Model | Inputs | Accuracy Target |
|--------|-------|--------|-----------------|
| Revenue | Time series + seasonal | Historical production, starts scheduled | ±5% |
| Collections | AR analysis + history | Outstanding AR, payment patterns | ±3% |
| New Patients | Trend + marketing | Lead pipeline, conversion rates | ±15% |
| Chair Utilization | Scheduling | Appointments, no-show history | ±5% |

**Early Warning Indicators**:
| Indicator | Warning Sign | Action |
|-----------|--------------|--------|
| Declining Starts | 3+ months below trend | Review marketing, acceptance |
| Rising AR | AR days increasing | Intensify collections |
| Overhead Creep | Overhead ratio rising | Review expenses |
| Conversion Drop | Acceptance rate falling | Training, pricing review |
| Production Gap | Production-collection widening | AR investigation |

**What-If Scenarios**:
- "What if we add another provider?"
- "What if we raise prices 5%?"
- "What if we increase marketing 25%?"
- "What if no-shows drop to 3%?"

**User Stories**:
- As an **owner**, I want revenue forecasts so I can plan cash flow
- As a **clinic admin**, I want early warning indicators so I can act quickly
- As an **analyst**, I want what-if modeling so I can evaluate decisions

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

  // Goals and thresholds
  goal          Decimal?
  goalType      GoalType?  // TARGET, MINIMUM, MAXIMUM
  warningThreshold Decimal?
  criticalThreshold Decimal?

  // Comparison
  compareToLastPeriod Boolean @default(true)
  compareToGoal Boolean @default(true)

  // Access
  visibleToRoles String[] // Role names

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

enum GoalType {
  TARGET
  MINIMUM
  MAXIMUM
}

model KPISnapshot {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Snapshot timing
  snapshotDate  DateTime
  periodType    PeriodType

  // Location/Provider (null for clinic-wide)
  locationId    String?  @db.ObjectId
  providerId    String?  @db.ObjectId

  // Financial KPIs
  grossProduction    Decimal @default(0)
  netProduction      Decimal @default(0)
  collections        Decimal @default(0)
  collectionRate     Decimal @default(0)
  overheadRatio      Decimal @default(0)
  profitMargin       Decimal @default(0)

  // Operational KPIs
  newPatientExams    Int     @default(0)
  treatmentStarts    Int     @default(0)
  caseAcceptanceRate Decimal @default(0)
  averageCaseValue   Decimal @default(0)
  activePatients     Int     @default(0)
  chairUtilization   Decimal @default(0)

  // Patient KPIs
  noShowRate         Decimal @default(0)
  cancellationRate   Decimal @default(0)
  recallCompletionRate Decimal @default(0)
  patientSatisfaction Decimal?
  nps                Int?

  // Timestamps
  createdAt     DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, snapshotDate, periodType, locationId, providerId])
  @@index([clinicId])
  @@index([snapshotDate])
  @@index([periodType])
}

model BenchmarkData {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId

  // Benchmark definition
  metricCode    String
  metricName    String
  category      BenchmarkCategory

  // Percentiles
  percentile10  Decimal
  percentile25  Decimal
  percentile50  Decimal
  percentile75  Decimal
  percentile90  Decimal

  // Segmentation
  practiceSize  PracticeSize?
  region        String?
  specialty     String?

  // Source
  source        String
  sourceYear    Int
  lastUpdated   DateTime

  @@index([metricCode])
  @@index([category])
}

enum BenchmarkCategory {
  FINANCIAL
  OPERATIONAL
  CLINICAL
  MARKETING
}

enum PracticeSize {
  SOLO
  SMALL      // 2-3 providers
  MEDIUM     // 4-6 providers
  LARGE      // 7+ providers
}

model MarketingROI {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Period
  periodStart   DateTime
  periodEnd     DateTime

  // Source
  sourceId      String   @db.ObjectId
  sourceName    String
  sourceType    MarketingSourceType

  // Spend
  spend         Decimal

  // Funnel metrics
  leads         Int
  exams         Int
  starts        Int

  // Revenue
  revenue       Decimal
  projectedLTV  Decimal

  // Calculated metrics
  costPerLead   Decimal
  costPerExam   Decimal
  costPerStart  Decimal
  leadToExamRate Decimal
  examToStartRate Decimal
  roi           Decimal

  // Timestamps
  generatedAt   DateTime @default(now())

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@unique([clinicId, periodStart, sourceId])
  @@index([clinicId])
  @@index([periodStart])
  @@index([sourceId])
}

enum MarketingSourceType {
  DIGITAL_ADS
  SOCIAL_MEDIA
  REFERRAL
  DIRECT_MAIL
  LOCAL_MARKETING
  WEBSITE_ORGANIC
  WALK_IN
  OTHER
}

model CaseProfitability {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  patientId     String   @db.ObjectId
  treatmentPlanId String @db.ObjectId

  // Treatment info
  treatmentType TreatmentType
  startDate     DateTime
  completionDate DateTime?
  status        CaseStatus

  // Revenue
  contractValue Decimal
  collectedAmount Decimal
  recognizedRevenue Decimal

  // Direct costs
  labCosts      Decimal @default(0)
  supplyCosts   Decimal @default(0)
  chairTimeCost Decimal @default(0)
  totalDirectCosts Decimal

  // Chair time
  plannedVisits Int
  actualVisits  Int
  totalChairMinutes Int @default(0)

  // Margins
  contributionMargin Decimal
  contributionMarginPercent Decimal
  allocatedOverhead Decimal @default(0)
  netProfit     Decimal
  netProfitPercent Decimal

  // Insurance
  insuranceId   String?  @db.ObjectId
  insuranceType InsuranceType?

  // Provider
  primaryProviderId String @db.ObjectId

  // Timestamps
  calculatedAt  DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([patientId])
  @@index([treatmentPlanId])
  @@index([treatmentType])
  @@index([status])
}

enum TreatmentType {
  BRACES_METAL
  BRACES_CERAMIC
  ALIGNERS
  LIMITED
  PHASE_1
  RETAINER_ONLY
  OTHER
}

enum CaseStatus {
  ACTIVE
  COMPLETED
  TRANSFERRED
  DISCONTINUED
}

enum InsuranceType {
  PPO
  HMO
  INDEMNITY
  DISCOUNT_PLAN
  SELF_PAY
}

model Forecast {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Forecast definition
  forecastType  ForecastType
  metricCode    String

  // Period
  forecastDate  DateTime  // Date the forecast was made
  startDate     DateTime  // Start of forecast period
  endDate       DateTime  // End of forecast period
  periodType    PeriodType

  // Predictions
  predictedValue Decimal
  lowerBound    Decimal?  // 95% CI lower
  upperBound    Decimal?  // 95% CI upper
  confidence    Decimal?

  // Actual (filled in when known)
  actualValue   Decimal?
  variance      Decimal?
  variancePercent Decimal?

  // Model info
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
  COLLECTIONS
  NEW_PATIENTS
  STARTS
  CHAIR_UTILIZATION
  CASH_POSITION
}

model Alert {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId

  // Alert definition
  alertType     AlertType
  severity      AlertSeverity
  title         String
  message       String

  // Context
  kpiCode       String?
  currentValue  Decimal?
  threshold     Decimal?

  // Status
  status        AlertStatus @default(NEW)
  acknowledgedAt DateTime?
  acknowledgedBy String?  @db.ObjectId
  resolvedAt    DateTime?
  resolvedBy    String?  @db.ObjectId

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([alertType])
  @@index([status])
  @@index([createdAt])
}

enum AlertType {
  KPI_THRESHOLD
  TREND_ANOMALY
  FORECAST_WARNING
  SYSTEM_HEALTH
  COMPLIANCE
}

enum AlertSeverity {
  INFO
  WARNING
  CRITICAL
}

enum AlertStatus {
  NEW
  ACKNOWLEDGED
  RESOLVED
  DISMISSED
}

model DashboardConfiguration {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  userId        String   @db.ObjectId

  // Dashboard
  name          String
  isDefault     Boolean  @default(false)

  // Layout
  layout        Json     // Widget positions and sizes

  // Widgets
  widgets       DashboardWidget[]

  // Timestamps
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  clinic        Clinic   @relation(fields: [clinicId], references: [id])

  @@index([clinicId])
  @@index([userId])
}

type DashboardWidget {
  widgetId      String
  widgetType    WidgetType
  kpiCode       String?
  title         String
  position      WidgetPosition
  size          WidgetSize
  settings      Json?
}

type WidgetPosition {
  x             Int
  y             Int
}

enum WidgetType {
  KPI_SINGLE
  KPI_COMPARISON
  TREND_CHART
  PIE_CHART
  BAR_CHART
  TABLE
  FUNNEL
  GAUGE
  MAP
  TEXT
}
```

---

## API Endpoints

### KPIs

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/analytics/kpis` | Get current KPIs | `finance:view_analytics` |
| GET | `/api/analytics/kpis/:code` | Get specific KPI | `finance:view_analytics` |
| GET | `/api/analytics/kpis/history/:code` | Get KPI history | `finance:view_analytics` |
| PUT | `/api/analytics/kpis/:code/config` | Update KPI config | `finance:view_analytics` |

### Trends

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/analytics/trends/:metric` | Get metric trend | `finance:view_analytics` |
| GET | `/api/analytics/trends/comparison` | Compare periods | `finance:view_analytics` |
| GET | `/api/analytics/trends/seasonal` | Seasonal analysis | `finance:view_analytics` |

### Benchmarking

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/analytics/benchmarks` | Get benchmarks | `finance:view_analytics` |
| GET | `/api/analytics/benchmarks/ranking` | Practice ranking | `finance:view_analytics` |
| GET | `/api/analytics/benchmarks/compare` | Compare to benchmark | `finance:view_analytics` |

### ROI

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/analytics/roi` | Marketing ROI summary | `finance:view_analytics` |
| GET | `/api/analytics/roi/by-source` | ROI by source | `finance:view_analytics` |
| GET | `/api/analytics/roi/funnel` | Conversion funnel | `finance:view_analytics` |

### Profitability

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/analytics/profitability` | Profitability summary | `finance:view_analytics` |
| GET | `/api/analytics/profitability/by-type` | By treatment type | `finance:view_analytics` |
| GET | `/api/analytics/profitability/case/:id` | Case profitability | `finance:view_analytics` |

### Forecasts

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/analytics/forecasts` | Get forecasts | `finance:view_analytics` |
| GET | `/api/analytics/forecasts/:metric` | Specific forecast | `finance:view_analytics` |
| POST | `/api/analytics/forecasts/scenario` | What-if scenario | `finance:view_analytics` |

### Alerts

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/analytics/alerts` | Get active alerts | `finance:view_analytics` |
| POST | `/api/analytics/alerts/:id/acknowledge` | Acknowledge alert | `finance:view_analytics` |
| POST | `/api/analytics/alerts/:id/resolve` | Resolve alert | `finance:view_analytics` |

### Dashboard

| Method | Endpoint | Description | Permissions |
|--------|----------|-------------|-------------|
| GET | `/api/analytics/dashboard` | Get user dashboard | `finance:view_analytics` |
| PUT | `/api/analytics/dashboard` | Update dashboard | `finance:view_analytics` |
| POST | `/api/analytics/dashboard/widgets` | Add widget | `finance:view_analytics` |

---

## UI Components

| Component | Purpose | Location |
|-----------|---------|----------|
| `AnalyticsDashboard` | Main dashboard view | `components/analytics/` |
| `KPIWidget` | Single KPI display | `components/analytics/` |
| `KPIGrid` | Grid of KPI widgets | `components/analytics/` |
| `TrendChart` | Trend line visualization | `components/analytics/` |
| `ComparisonChart` | Period comparison | `components/analytics/` |
| `SeasonalChart` | Seasonal pattern | `components/analytics/` |
| `BenchmarkGauge` | Benchmark comparison | `components/analytics/` |
| `BenchmarkTable` | Percentile rankings | `components/analytics/` |
| `ConversionFunnel` | Marketing funnel | `components/analytics/` |
| `ROISummary` | Marketing ROI | `components/analytics/` |
| `ProfitabilityMatrix` | Case profitability | `components/analytics/` |
| `ForecastChart` | Revenue forecasts | `components/analytics/` |
| `AlertPanel` | Active alerts | `components/analytics/` |
| `DashboardEditor` | Customize dashboard | `components/analytics/` |
| `WidgetPicker` | Add widgets | `components/analytics/` |

---

## AI Features

| Feature | Description | Model Type |
|---------|-------------|------------|
| Anomaly Detection | Identify unusual patterns | Statistical + ML |
| Trend Forecasting | Predict future values | Time series (ARIMA/Prophet) |
| Seasonal Adjustment | Account for seasonality | Seasonal decomposition |
| Recommendation Engine | Suggest improvements | Rule-based + ML |
| Natural Language Insights | Generate text summaries | LLM |
| Early Warning System | Predict problems | Classification |

---

## Business Rules

1. **KPI Refresh**: Real-time KPIs update every 5 minutes
2. **Snapshot Frequency**: Daily snapshots at midnight, monthly at close
3. **Benchmark Updates**: Industry benchmarks updated annually
4. **Alert Escalation**: Critical alerts notify via email/SMS
5. **Forecast Accuracy**: Track and report forecast accuracy monthly
6. **Data Retention**: Analytics data retained for 7 years
7. **Access Control**: Sensitive metrics restricted by role
8. **Goal Setting**: Goals can only be set at period start

---

## Related Documentation

- [Parent: Financial Management](../../)
- [Revenue Tracking](../revenue-tracking/)
- [Expense Management](../expense-management/)
- [Financial Reports](../financial-reports/)
- [CRM & Onboarding](../../../crm-onboarding/)

---

**Status**: 📋 Planned
**Last Updated**: 2024-11-26
**Owner**: Development Team
