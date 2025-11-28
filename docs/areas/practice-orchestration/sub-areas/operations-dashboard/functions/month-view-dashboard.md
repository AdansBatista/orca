# Month View Dashboard

> **Sub-Area**: [Operations Dashboard](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Month View Dashboard provides monthly metrics and trend analysis for practice management. It displays production summaries, patient volume trends, no-show/cancellation rates, utilization reports, and goal tracking with year-over-year comparisons for strategic planning.

---

## Core Requirements

- [ ] Display monthly calendar with appointment density
- [ ] Show monthly production summary (if billing integrated)
- [ ] Track patient volume trends over the month
- [ ] Calculate no-show and cancellation rates
- [ ] Generate utilization reports by resource and provider
- [ ] Support goal tracking against targets
- [ ] Provide year-over-year (YoY) comparisons
- [ ] Enable drill-down to week and day views
- [ ] Export monthly reports

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/dashboard/month/:year/:month` | `ops:view_dashboard` | Get month view data |
| GET | `/api/v1/ops/dashboard/month/:year/:month/trends` | `ops:view_analytics` | Get trend analysis |
| GET | `/api/v1/ops/dashboard/month/:year/:month/goals` | `ops:view_analytics` | Get goal progress |
| GET | `/api/v1/ops/dashboard/month/:year/:month/export` | `ops:view_analytics` | Export monthly report |

---

## Data Model

```typescript
interface MonthViewData {
  year: number;
  month: number;
  calendar: MonthCalendarDay[];
  metrics: MonthlyMetrics;
  trends: MonthlyTrends;
  goals: GoalProgress[];
  comparison: YearOverYearComparison;
}

interface MonthlyMetrics {
  totalAppointments: number;
  completedAppointments: number;
  noShowCount: number;
  noShowRate: number;
  cancellationCount: number;
  cancellationRate: number;
  newPatientCount: number;
  avgWaitTime: number;
  avgChairTime: number;
  chairUtilization: number;
  productionTotal?: number;
  collectionTotal?: number;
}

interface GoalProgress {
  goalType: string;
  target: number;
  actual: number;
  percentComplete: number;
  status: 'on_track' | 'at_risk' | 'behind';
}
```

---

## Business Rules

- Month view optimized for analytics, not real-time operations
- Production data requires billing integration (optional)
- Goals configurable by clinic admin
- YoY comparison uses same calendar month from previous year
- Data refreshed nightly (not real-time)
- Historical data retained indefinitely

---

## Dependencies

**Depends On:**
- [Week View Dashboard](./week-view-dashboard.md) - Weekly aggregation
- [Daily Metrics](../../patient-flow/) - Daily metrics data
- [Billing & Insurance](../../../../billing-insurance/) - Production data (optional)

**Required By:**
- Practice management reporting
- Business intelligence dashboards

---

## Notes

- Consider sparklines for trend visualization
- Provide printable monthly summary report
- Include benchmark comparisons to industry averages

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
