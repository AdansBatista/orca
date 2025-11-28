# Week View Dashboard

> **Sub-Area**: [Operations Dashboard](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Week View Dashboard provides a 7-day schedule overview for planning and capacity management. It displays weekly appointment grids, provider availability, capacity indicators, and trend comparisons to help managers optimize scheduling and identify opportunities.

---

## Core Requirements

- [ ] Display weekly appointment grid (7 days)
- [ ] Show provider availability across the week
- [ ] Calculate and display capacity utilization indicators
- [ ] Compare current week to previous weeks
- [ ] Identify schedule gaps and booking opportunities
- [ ] Show weekly metrics summary (volume, cancellations, new patients)
- [ ] Support provider and resource filtering
- [ ] Enable drill-down to day view
- [ ] Export week schedule for printing

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/dashboard/week/:date` | `ops:view_dashboard` | Get week view data |
| GET | `/api/v1/ops/dashboard/week/:date/capacity` | `ops:view_dashboard` | Get capacity analysis |
| GET | `/api/v1/ops/dashboard/week/:date/comparison` | `ops:view_analytics` | Get week-over-week comparison |
| GET | `/api/v1/ops/dashboard/week/:date/gaps` | `ops:view_dashboard` | Get schedule gaps |

---

## Data Model

```typescript
interface WeekViewData {
  weekStart: Date;
  weekEnd: Date;
  days: DaySummary[];
  providers: ProviderWeekSchedule[];
  metrics: {
    totalScheduled: number;
    totalCapacity: number;
    utilizationRate: number;
    cancellationRate: number;
    newPatientCount: number;
    weekOverWeekChange: number;
  };
  gaps: ScheduleGap[];
  comparison: WeekComparison;
}

interface DaySummary {
  date: Date;
  dayOfWeek: string;
  scheduledCount: number;
  capacity: number;
  utilization: number;
  isHoliday: boolean;
  isClosed: boolean;
}

interface ScheduleGap {
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  providerId: string;
  chairId?: string;
}
```

---

## Business Rules

- Week starts on Monday (configurable)
- Capacity calculated from template-defined slots
- Utilization = scheduled / capacity
- Holidays marked but may have emergency coverage
- Historical weeks are read-only analytics
- Gaps only shown for future dates

---

## Dependencies

**Depends On:**
- [Day View Dashboard](./day-view-dashboard.md) - Daily data
- [Booking & Scheduling](../../../../booking/) - Schedule data
- [Staff Management](../../../../staff-management/) - Provider schedules

**Required By:**
- [Month View Dashboard](./month-view-dashboard.md)
- Practice planning workflows

---

## Notes

- Color-code days by utilization level (green/yellow/red)
- Highlight days with low bookings for marketing opportunities
- Consider heatmap visualization for busy times

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
