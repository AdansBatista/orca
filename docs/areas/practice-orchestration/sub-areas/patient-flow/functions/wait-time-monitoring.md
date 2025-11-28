# Wait Time Monitoring

> **Sub-Area**: [Patient Flow Management](../) | **Status**: 📋 Planned | **Priority**: High

---

## Overview

Wait Time Monitoring tracks and manages patient wait times throughout their visit. It provides real-time wait calculations, configurable target thresholds, alerts for excessive waits, dashboard displays of average wait times, predictive estimates, and trend analysis for operational improvement.

---

## Core Requirements

- [ ] Calculate real-time wait times for each patient
- [ ] Configure target wait thresholds per stage
- [ ] Alert staff when waits exceed thresholds
- [ ] Display average wait times on dashboard
- [ ] Predict wait times for queued patients
- [ ] Analyze wait time trends over time
- [ ] Break down wait time by stage
- [ ] Compare wait times across providers/days
- [ ] Generate wait time reports

---

## API Endpoints

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | `/api/v1/ops/flow/wait-times` | `ops:view_dashboard` | Get current wait times |
| GET | `/api/v1/ops/flow/wait-times/alerts` | `ops:view_dashboard` | Get wait time alerts |
| GET | `/api/v1/ops/flow/wait-times/average` | `ops:view_dashboard` | Get average wait time |
| GET | `/api/v1/ops/flow/wait-times/trends` | `ops:view_analytics` | Get wait time trends |
| PUT | `/api/v1/ops/config/wait-thresholds` | `ops:configure` | Set wait thresholds |

---

## Data Model

```prisma
model WaitTimeThreshold {
  id              String    @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String    @db.ObjectId

  stage           FlowStage
  targetMinutes   Int       // Target wait time
  warningMinutes  Int       // Yellow alert threshold
  criticalMinutes Int       // Red alert threshold

  isActive        Boolean   @default(true)

  @@unique([clinicId, stage])
}

model WaitTimeAlert {
  id              String    @id @default(auto()) @map("_id") @db.ObjectId
  clinicId        String    @db.ObjectId
  flowStateId     String    @db.ObjectId

  stage           FlowStage
  waitMinutes     Int
  thresholdType   'warning' | 'critical'

  triggeredAt     DateTime  @default(now())
  acknowledgedAt  DateTime?
  acknowledgedBy  String?   @db.ObjectId

  @@index([clinicId, triggeredAt])
}

// Aggregated metrics stored in DailyMetrics
```

---

## Business Rules

- Wait time = current time - stage entered time (for current stage)
- Total wait = sum of waiting stage durations
- Warning threshold default: 15 minutes
- Critical threshold default: 20 minutes
- Alerts auto-clear when patient moves to next stage
- Predictions based on rolling 30-day averages
- Thresholds configurable per clinic and stage

---

## Dependencies

**Depends On:**
- [Patient Journey Tracking](./patient-journey-tracking.md) - Stage timestamps
- [Queue Management](./queue-management.md) - Queue data

**Required By:**
- [Day View Dashboard](../../operations-dashboard/functions/day-view-dashboard.md) - Metrics display
- [Anomaly Detection](../../ai-manager/functions/anomaly-detection.md) - Alert triggers

---

## Notes

- Consider SMS apology for excessive waits
- Track provider-specific wait time patterns
- Correlate wait times with patient satisfaction scores
- Display wait time on patient-facing screens (optional)

---

**Status Legend:**
- 📋 Planned - Documented, not started
- 🔄 In Progress - Currently being implemented
- ✅ Completed - Fully implemented and tested
