# Performance Metrics

> **Sub-Area**: [Performance & Training](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Track and display role-specific key performance indicators for orthodontic practice staff. Provides real-time dashboards with provider production, treatment coordinator conversion rates, clinical staff efficiency, and front desk metrics. Supports historical trend analysis and benchmark comparisons.

---

## Core Requirements

- [ ] Define role-based metric configurations
- [ ] Calculate metrics automatically from system data
- [ ] Display real-time performance dashboards
- [ ] Track historical trends by period
- [ ] Support benchmark comparisons
- [ ] Generate metric reports
- [ ] Configure custom metric definitions

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/staff/:id/metrics` | `performance:read` | Get staff metrics |
| GET | `/api/staff/:id/metrics/:code` | `performance:read` | Get specific metric |
| GET | `/api/staff/:id/metrics/history` | `performance:read` | Get metric history |
| GET | `/api/staff/metrics/summary` | `performance:view_all` | Get team summary |
| GET | `/api/staff/metrics/leaderboard` | `performance:view_all` | Get leaderboard |
| POST | `/api/staff/metrics/calculate` | `performance:manage` | Trigger calculation |

---

## Data Model

```prisma
model PerformanceMetric {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  clinicId      String   @db.ObjectId
  staffProfileId String  @db.ObjectId

  metricCode    String
  periodStart   DateTime
  periodEnd     DateTime
  periodType    MetricPeriod

  value         Decimal
  target        Decimal?
  previousValue Decimal?

  calculatedAt  DateTime @default(now())
  dataPoints    Int?

  @@unique([staffProfileId, metricCode, periodStart, periodEnd])
  @@index([metricCode])
  @@index([periodStart])
}

enum MetricPeriod {
  DAILY
  WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}
```

---

## Business Rules

- Metrics calculated based on role-specific definitions
- Historical metrics stored for trend analysis
- Calculation frequency: daily for operational, weekly for summary
- Staff can view own metrics; managers see team metrics
- Targets set by practice or role defaults
- Leaderboards respect privacy settings

### Provider Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| Case Starts | New treatments begun | Count per period |
| Production | Revenue generated | Billed amount |
| Collections | Revenue collected | Collected amount |
| Average Case Value | Value per case | Total / starts |
| Patients Seen | Patient encounters | Unique patients |

### Treatment Coordinator Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| Consultations | New patient consults | Count per period |
| Conversion Rate | Consults to starts | Starts / Consults × 100 |
| Case Acceptance | Dollar acceptance | Accepted / Presented × 100 |
| Same-Day Starts | Cases started day of consult | % of total starts |

### Clinical Staff Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| Patients Assisted | Patient encounters | Count per period |
| Chair Time Efficiency | Productive time | Productive / Scheduled × 100 |
| On-Time Rate | Appointments on time | On-time / Total × 100 |

### Front Desk Metrics

| Metric | Description | Calculation |
|--------|-------------|-------------|
| No-Show Rate | Missed appointments | No-shows / Total × 100 |
| Confirmation Rate | Confirmed appointments | Confirmed / Total × 100 |
| Collection Rate | Payments collected | Collected / Due × 100 |

---

## Dependencies

**Depends On:**
- Employee Profiles
- Treatment Management (provider data)
- Scheduling (appointment data)
- Financial Management (production data)

**Required By:**
- Goal Tracking
- Performance Reviews
- Practice dashboards

---

## Notes

- Metric calculations may be resource-intensive; schedule off-peak
- Consider: caching frequently accessed metrics
- Privacy: some metrics visible only to self and managers
- Benchmark data requires industry partnerships
