# Operations Dashboard

> **Sub-Area**: Operations Dashboard
>
> **Area**: Practice Orchestration (2.3)
>
> **Purpose**: Multi-view operational dashboards providing real-time visibility into daily, weekly, and monthly practice operations

---

## Quick Info

| Attribute | Value |
|-----------|-------|
| **Status** | 📋 Planned |
| **Priority** | Critical |
| **Complexity** | High |
| **Functions** | 6 |

---

## Overview

The Operations Dashboard provides the central hub for monitoring practice operations across different time horizons and view perspectives. It gives staff, managers, and owners real-time visibility into patient flow, resource utilization, and operational metrics.

### Key Capabilities

- Multiple view options (timeline, kanban, floor plan)
- Real-time data with auto-refresh
- Role-based dashboard configurations
- Customizable widgets and layouts
- Drill-down from summary to detail
- Mobile-responsive design

---

## Functions

| # | Function | Description | Priority |
|---|----------|-------------|----------|
| 1 | [Day View Dashboard](./functions/day-view-dashboard.md) | Today's operational view | Critical |
| 2 | [Week View Dashboard](./functions/week-view-dashboard.md) | Weekly schedule overview | High |
| 3 | [Month View Dashboard](./functions/month-view-dashboard.md) | Monthly metrics and trends | Medium |
| 4 | [Timeline View](./functions/timeline-view.md) | Hour-by-hour schedule view | Critical |
| 5 | [Board/Kanban View](./functions/board-view.md) | Patient flow stages view | High |
| 6 | [Floor Plan View](./functions/floor-plan-view.md) | Visual room/chair occupancy | High |

---

## Function Details

### Day View Dashboard

Real-time view of today's operations.

**Key Features:**
- Patient count (scheduled, seen, remaining)
- Current wait times
- Chair/room status summary
- Provider schedules
- Key alerts and issues
- Quick action buttons

---

### Week View Dashboard

7-day schedule overview for planning.

**Key Features:**
- Weekly appointment grid
- Provider availability
- Capacity indicators
- Trend comparisons
- Week-over-week metrics
- Schedule gaps/opportunities

---

### Month View Dashboard

Monthly metrics and trend analysis.

**Key Features:**
- Monthly production summary
- Patient volume trends
- No-show/cancellation rates
- Utilization reports
- Goal tracking
- YoY comparisons

---

### Timeline View

Hour-by-hour schedule visualization.

**Key Features:**
- Appointment blocks by time
- Color-coded by appointment type
- Provider columns
- Drag-and-drop rescheduling
- Current time indicator
- Overlap detection

---

### Board/Kanban View

Patient flow stages visualization.

**Key Features:**
- Columns: Scheduled → Waiting → In Chair → Checkout
- Patient cards with key info
- Drag-and-drop flow updates
- Time-in-stage indicators
- Priority flagging
- WIP limits

---

### Floor Plan View

Visual representation of physical space.

**Key Features:**
- Room/chair layout diagram
- Real-time occupancy status
- Color-coded status (available, occupied, blocked)
- Click for patient details
- Equipment status overlay
- Maintenance indicators

---

## Data Model

### Prisma Schema

```prisma
model DashboardConfiguration {
  id              String            @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String            @db.ObjectId
  userId          String?           @db.ObjectId  // Null for clinic-wide default

  name            String
  viewType        DashboardViewType // DAY, WEEK, MONTH
  layout          Json              // Widget positions and sizes

  // Settings
  autoRefreshInterval Int           @default(30) // Seconds
  defaultFilters  Json?
  visibleColumns  String[]

  isDefault       Boolean           @default(false)

  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  // Relations
  clinic          Clinic            @relation(fields: [clinicId], references: [id])
  user            User?             @relation(fields: [userId], references: [id])

  @@index([clinicId, viewType])
  @@index([userId])
}

enum DashboardViewType {
  DAY
  WEEK
  MONTH
  CUSTOM
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/ops/dashboard` | Get dashboard configuration |
| GET | `/api/v1/ops/dashboard/day/:date` | Get day view data |
| GET | `/api/v1/ops/dashboard/week/:date` | Get week view data |
| GET | `/api/v1/ops/dashboard/month/:date` | Get month view data |
| PUT | `/api/v1/ops/dashboard/config` | Save dashboard configuration |
| GET | `/api/v1/ops/dashboard/widgets` | List available widgets |
| GET | `/api/v1/ops/dashboard/metrics` | Get real-time metrics |

---

## UI Components

| Component | Description |
|-----------|-------------|
| `OperationsDashboard` | Main dashboard container |
| `DayViewDashboard` | Day view layout |
| `WeekViewDashboard` | Week view layout |
| `MonthViewDashboard` | Month view layout |
| `TimelineView` | Hour-by-hour timeline |
| `KanbanBoard` | Patient flow kanban |
| `FloorPlanEditor` | Floor plan viewer/editor |
| `MetricsSummaryWidget` | Key metrics display |
| `ChairStatusWidget` | Chair status grid |
| `AlertsWidget` | Active alerts list |
| `DashboardConfigurator` | Layout customization |

---

## Key Metrics by View

### Day View Metrics

| Metric | Calculation |
|--------|-------------|
| Patients Scheduled | Count of today's appointments |
| Patients Seen | Count of completed appointments |
| Patients Remaining | Scheduled - Seen |
| Average Wait | Mean time from check-in to chair |
| Running Late | % appointments behind schedule |
| No-Shows | Count marked no-show |

### Week View Metrics

| Metric | Calculation |
|--------|-------------|
| Weekly Volume | Total appointments |
| Capacity Used | Appointments / Available slots |
| Cancellation Rate | Cancelled / Scheduled |
| New Patients | First-visit appointments |

---

## Business Rules

1. **Real-Time Data**: Day view refreshes every 30 seconds
2. **Role-Based Views**: Different default layouts per role
3. **Multi-Location**: Super admins see all locations
4. **Historical Data**: Past data is read-only
5. **Mobile Adaptation**: Simplified views on mobile
6. **Performance**: Dashboard loads in under 2 seconds

---

## Dependencies

- **Booking & Scheduling**: Appointment data source
- **Patient Flow Management**: Real-time flow data
- **Resources Management**: Chair/room data
- **Staff Management**: Provider schedules

---

## Related Documentation

- [Practice Orchestration Overview](../../README.md)
- [Patient Flow Management](../patient-flow/)
- [Resource Coordination](../resource-coordination/)
