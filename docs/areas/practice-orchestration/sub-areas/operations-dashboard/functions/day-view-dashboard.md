# Day View Dashboard

> **Sub-Area**: [Operations Dashboard](../) | **Status**: 📋 Planned | **Priority**: Critical

---

## Overview

Day View Dashboard provides a real-time operational view of today's clinic activities. It displays patient counts, wait times, chair/room status, provider schedules, alerts, and key metrics to give staff instant visibility into current operations and enable quick decision-making.

---

## Core Requirements

- [ ] Display patient count metrics (scheduled, seen, remaining)
- [ ] Show current and average wait times
- [ ] Display chair/room status summary grid
- [ ] Show provider schedules with current appointments
- [ ] Surface key alerts and issues requiring attention
- [ ] Provide quick action buttons for common tasks
- [ ] Auto-refresh data in real-time (configurable interval)
- [ ] Support customizable widget layout
- [ ] Adapt to mobile screen sizes

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/dashboard/day/:date` | `ops:view_dashboard` | Get day view data |
| GET | `/api/v1/ops/dashboard/metrics` | `ops:view_dashboard` | Get real-time metrics |
| GET | `/api/v1/ops/dashboard/alerts` | `ops:view_dashboard` | Get active alerts |
| PUT | `/api/v1/ops/dashboard/config` | `ops:configure` | Save dashboard layout |

---

## Data Model

Uses `DashboardConfiguration` and `DailyMetrics` models from Operations Dashboard.

Key day view data structure:
```typescript
interface DayViewData {
  date: Date;
  metrics: {
    scheduledCount: number;
    checkedInCount: number;
    completedCount: number;
    remainingCount: number;
    noShowCount: number;
    walkInCount: number;
    avgWaitMinutes: number;
    currentWaitMinutes: number;
    onTimePercentage: number;
  };
  chairStatus: ChairStatusSummary[];
  providerSchedules: ProviderSchedule[];
  alerts: OperationsAlert[];
  nextAppointments: AppointmentSummary[];
}
```

---

## Business Rules

- Dashboard refreshes every 30 seconds (configurable)
- Metrics calculated from start of business day
- Alerts prioritized by severity (critical first)
- Historical dates are view-only
- Role-based default widget layouts
- Performance target: load in under 2 seconds

---

## Dependencies

**Depends On:**
- [Patient Flow Management](../../patient-flow/) - Flow state data
- [Booking & Scheduling](../../../../booking/) - Appointment data
- [Resources Management](../../../../resources-management/) - Chair/room status

**Required By:**
- [Timeline View](./timeline-view.md)
- [Board View](./board-view.md)

---

## Notes

- Consider WebSocket/SSE for real-time updates instead of polling
- Cache frequently accessed metrics with short TTL
- Show countdown timer to next appointment start

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
