# Utilization Tracking

> **Sub-Area**: [Resource Coordination](../) | **Status**: 📋 Planned | **Priority**: Medium

---

## Overview

Utilization Tracking monitors and reports on resource utilization across chairs, rooms, and providers. It provides chair utilization metrics, provider productivity data, peak time analysis, downtime tracking, capacity planning data, and trend reporting for operational optimization.

---

## Core Requirements

- [ ] Calculate chair utilization metrics (used vs. available time)
- [ ] Track provider productivity (patients seen, procedures completed)
- [ ] Identify peak times and low-utilization periods
- [ ] Track downtime by reason (maintenance, no-show, gap)
- [ ] Provide capacity planning data and forecasts
- [ ] Generate trend reports over configurable periods
- [ ] Compare utilization across resources/providers
- [ ] Support drill-down from summary to detail
- [ ] Export utilization data for analysis

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/utilization` | `ops:view_analytics` | Get utilization metrics |
| GET | `/api/v1/ops/utilization/chairs` | `ops:view_analytics` | Get chair utilization |
| GET | `/api/v1/ops/utilization/providers` | `ops:view_analytics` | Get provider utilization |
| GET | `/api/v1/ops/utilization/trends` | `ops:view_analytics` | Get trend data |
| GET | `/api/v1/ops/utilization/report` | `ops:view_analytics` | Get utilization report |
| GET | `/api/v1/ops/utilization/capacity` | `ops:view_analytics` | Get capacity analysis |

---

## Data Model

```prisma
model ResourceUtilization {
  id              String    @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String    @db.ObjectId
  resourceId      String    @db.ObjectId
  date            DateTime  @db.Date

  // Time metrics (minutes)
  availableMinutes Int
  usedMinutes     Int
  blockedMinutes  Int
  downtimeMinutes Int

  // Counts
  appointmentCount Int
  turnoverCount   Int       // Times resource changed patients

  // Downtime breakdown
  maintenanceMinutes Int    @default(0)
  noShowMinutes     Int     @default(0)
  gapMinutes        Int     @default(0)

  // Calculated
  utilizationRate Float     // usedMinutes / availableMinutes

  createdAt       DateTime  @default(now())

  @@unique([clinicId, resourceId, date])
}

// Provider productivity tracked separately
model ProviderProductivity {
  id              String    @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String    @db.ObjectId
  providerId      String    @db.ObjectId
  date            DateTime  @db.Date

  patientsScheduled Int
  patientsSeen    Int
  proceduresCompleted Int
  chairMinutes    Int

  productionValue Float?    // Revenue generated (if billing integrated)

  @@unique([clinicId, providerId, date])
}
```

---

## Business Rules

- Utilization calculated daily, aggregated weekly/monthly
- Target utilization: 70-85% for treatment chairs
- Low utilization (<65%) triggers optimization suggestions
- High utilization (>90%) may indicate overbooking risk
- Downtime categorized for actionable insights
- Provider productivity respects privacy (not individual ranking)
- Data retained per compliance policy (2+ years)

---

## Dependencies

**Depends On:**
- [Chair/Room Assignment](./chair-room-assignment.md) - Occupancy data
- [Staff Assignment](./staff-assignment.md) - Provider assignments
- [Patient Flow](../../patient-flow/) - Flow completion data

**Required By:**
- [AI Manager](../../ai-manager/) - Optimization inputs
- [Month View Dashboard](../../operations-dashboard/functions/month-view-dashboard.md) - Metrics

---

## Notes

- Benchmark against industry standards
- Show trends over time, not just snapshots
- Capacity planning should project 30/60/90 days
- Consider gamification for utilization goals (carefully)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
